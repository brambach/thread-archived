import { db } from "@/lib/db";
import { workouts, workoutSets, exercises } from "@/lib/db/schema";
import { desc, gte, eq, inArray } from "drizzle-orm";
import { GymOverview } from "@/components/gym/gym-overview";
import type { WorkoutSummary } from "@/types";

async function getGymData() {
  // Past 90 days of workouts for heatmap
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const cutoff = ninetyDaysAgo.toISOString().split("T")[0];

  const allWorkouts = await db
    .select()
    .from(workouts)
    .where(gte(workouts.date, cutoff))
    .orderBy(desc(workouts.date));

  // Get summaries for recent 10 workouts
  const recent = allWorkouts.slice(0, 10);
  const summaries: WorkoutSummary[] = await Promise.all(
    recent.map(async (w) => {
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
        return sum + (parseFloat(s.weightLbs ?? "0") * (s.reps ?? 0));
      }, 0);

      const muscleGroups = [...new Set(exerciseRows.map((e) => e.muscleGroup).filter(Boolean) as string[])];

      return {
        ...w,
        topExercises: exerciseRows.slice(0, 3).map((e) => e.name),
        totalVolume: Math.round(totalVolume),
        muscleGroups,
      };
    })
  );

  // This month summary
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const thisMonthWorkouts = allWorkouts.filter((w) => w.date >= firstOfMonth);

  return {
    workoutDates: allWorkouts.map((w) => w.date),
    recentWorkouts: summaries,
    thisMonthCount: thisMonthWorkouts.length,
  };
}

export default async function GymPage() {
  const data = await getGymData();

  return (
    <div className="pt-2 pb-6">
      <header className="py-2 pb-5">
        <h1 className="text-[26px] font-bold tracking-tight text-text leading-tight">
          Gym
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Training log & progress
        </p>
      </header>

      <GymOverview
        workoutDates={data.workoutDates}
        recentWorkouts={data.recentWorkouts}
        thisMonthCount={data.thisMonthCount}
      />
    </div>
  );
}
