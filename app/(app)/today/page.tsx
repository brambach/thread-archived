import { db } from "@/lib/db";
import { habits, habitCompletions } from "@/lib/db/schema";
import { eq, gte, asc, desc } from "drizzle-orm";
import { getToday } from "@/lib/utils";
import { HabitList } from "@/components/morning/habit-list";
import type { HabitWithCompletion } from "@/types";

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

  const habitsData = await getHabitsWithCompletions();

  return (
    <div className="pt-2 pb-6">
      <header className="py-2 pb-5">
        <h1 className="text-[26px] font-bold tracking-tight text-text leading-tight">
          {greeting}, Bryce.
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">{dateStr}</p>
      </header>

      <HabitList initialHabits={habitsData} />

      <div className="h-px bg-border my-5" />

      <section>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-text-muted">
            Gym
          </span>
        </div>
        <div className="rounded-xl border border-border border-l-[3px] border-l-accent bg-surface p-3.5 px-4">
          <p className="text-[15px] font-semibold text-text">
            No workout logged today
          </p>
          <p className="text-[13px] text-text-secondary mt-1">
            Tap to log a workout
          </p>
        </div>
      </section>
    </div>
  );
}
