import { db } from "@/lib/db";
import { habits, habitCompletions, workouts, workoutSets, exercises, dayReviews } from "@/lib/db/schema";
import { eq, gte, asc, desc, inArray } from "drizzle-orm";
import { getToday } from "@/lib/utils";
import { HabitList } from "@/components/morning/habit-list";
import { GymTodayCard } from "@/components/gym/gym-today-card";
import { EnergyPrompt } from "@/components/day-review/energy-prompt";
import { CloseDayButton } from "@/components/day-review/close-day-button";
import Link from "next/link";
import type { HabitWithCompletion, WorkoutSummary } from "@/types";

function computeStreak(
  completions: { date: string; completed: boolean }[]
): number {
  const sorted = [...completions].sort((a, b) => b.date.localeCompare(a.date));
  const today = getToday();
  let streak = 0;
  let cursor = today;
  for (const c of sorted) {
    if (c.date !== cursor) break;
    if (!c.completed) break;
    streak++;
    const d = new Date(cursor);
    d.setDate(d.getDate() - 1);
    cursor = d.toISOString().split("T")[0];
  }
  return streak;
}

async function getHabitsWithCompletions(): Promise<HabitWithCompletion[]> {
  const today = getToday();
  const allHabits = await db
    .select()
    .from(habits)
    .where(eq(habits.isActive, true))
    .orderBy(asc(habits.sortOrder), asc(habits.createdAt));

  if (allHabits.length === 0) return [];

  const todayCompletions = await db
    .select()
    .from(habitCompletions)
    .where(eq(habitCompletions.date, today));

  const completionMap = new Map(todayCompletions.map((c) => [c.habitId, c]));

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const cutoff = ninetyDaysAgo.toISOString().split("T")[0];

  const recentCompletions = await db
    .select()
    .from(habitCompletions)
    .where(gte(habitCompletions.date, cutoff))
    .orderBy(desc(habitCompletions.date));

  const completionsByHabit = new Map<
    string,
    { date: string; completed: boolean }[]
  >();
  for (const c of recentCompletions) {
    if (!completionsByHabit.has(c.habitId)) {
      completionsByHabit.set(c.habitId, []);
    }
    completionsByHabit.get(c.habitId)!.push({
      date: c.date,
      completed: c.completed ?? false,
    });
  }

  return allHabits.map((habit) => ({
    ...habit,
    completion: completionMap.get(habit.id) ?? null,
    streak: computeStreak(completionsByHabit.get(habit.id) ?? []),
  }));
}

async function getTodayWorkout(): Promise<WorkoutSummary | null> {
  const today = getToday();
  const todayWorkouts = await db
    .select()
    .from(workouts)
    .where(eq(workouts.date, today))
    .orderBy(desc(workouts.createdAt));

  if (todayWorkouts.length === 0) return null;

  const w = todayWorkouts[0];
  const sets = await db
    .select({
      exerciseId: workoutSets.exerciseId,
      weightLbs: workoutSets.weightLbs,
      reps: workoutSets.reps,
    })
    .from(workoutSets)
    .where(eq(workoutSets.workoutId, w.id));

  const exerciseIds = [...new Set(sets.map((s) => s.exerciseId))];
  const exerciseRows = exerciseIds.length
    ? await db
        .select({ id: exercises.id, name: exercises.name, muscleGroup: exercises.muscleGroup })
        .from(exercises)
        .where(inArray(exercises.id, exerciseIds))
    : [];

  const totalVolume = sets.reduce((sum, s) => {
    return sum + parseFloat(s.weightLbs ?? "0") * (s.reps ?? 0);
  }, 0);

  const muscleGroups = [...new Set(exerciseRows.map((e) => e.muscleGroup).filter(Boolean) as string[])];

  return {
    ...w,
    topExercises: exerciseRows.slice(0, 3).map((e) => e.name),
    totalVolume: Math.round(totalVolume),
    muscleGroups,
  };
}

export default async function TodayPage() {
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const today = getToday();
  const [habitsData, todayWorkout, todayReview] = await Promise.all([
    getHabitsWithCompletions(),
    getTodayWorkout(),
    db.select().from(dayReviews).where(eq(dayReviews.date, today)).limit(1).then((r) => r[0] ?? null),
  ]);

  return (
    <div className="pt-2 pb-6">
      <header className="py-2 pb-4">
        <h1 className="text-[26px] font-bold tracking-tight text-text leading-tight">
          {greeting}, Bryce.
        </h1>
        <p className="text-sm text-text-secondary mt-0.5 mb-3">{dateStr}</p>
        <EnergyPrompt initialRating={todayReview?.energyRating ?? null} />
      </header>

      <HabitList initialHabits={habitsData} />

      <div className="h-px bg-border my-5" />

      <section>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-text-muted">
            Gym
          </span>
          <Link
            href="/gym"
            className="text-[12px] text-text-muted hover:text-text-secondary transition-colors"
          >
            View all →
          </Link>
        </div>
        <GymTodayCard todayWorkout={todayWorkout} />
      </section>

      <CloseDayButton />
    </div>
  );
}
