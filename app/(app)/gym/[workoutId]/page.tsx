import { db } from "@/lib/db";
import { workouts, workoutSets, exercises } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { WorkoutDetail } from "@/components/gym/workout-detail";

type Props = { params: Promise<{ workoutId: string }> };

async function getWorkoutWithSets(id: string) {
  const [workout] = await db
    .select()
    .from(workouts)
    .where(eq(workouts.id, id));

  if (!workout) return null;

  const rows = await db
    .select({ set: workoutSets, exercise: exercises })
    .from(workoutSets)
    .innerJoin(exercises, eq(workoutSets.exerciseId, exercises.id))
    .where(eq(workoutSets.workoutId, id))
    .orderBy(asc(workoutSets.exerciseId), asc(workoutSets.setNumber));

  const exerciseMap = new Map<
    string,
    { exercise: typeof exercises.$inferSelect; sets: typeof workoutSets.$inferSelect[] }
  >();

  for (const row of rows) {
    const key = row.exercise.id;
    if (!exerciseMap.has(key)) {
      exerciseMap.set(key, { exercise: row.exercise, sets: [] });
    }
    exerciseMap.get(key)!.sets.push(row.set);
  }

  const totalVolume = rows.reduce((sum, r) => {
    return sum + parseFloat(r.set.weightLbs ?? "0") * (r.set.reps ?? 0);
  }, 0);

  return {
    ...workout,
    exerciseBlocks: Array.from(exerciseMap.values()),
    totalVolume: Math.round(totalVolume),
  };
}

export default async function WorkoutDetailPage({ params }: Props) {
  const { workoutId } = await params;
  const workout = await getWorkoutWithSets(workoutId);

  if (!workout) notFound();

  // Get all exercises for adding more
  const allExercises = await db
    .select()
    .from(exercises)
    .orderBy(asc(exercises.muscleGroup), asc(exercises.name));

  return <WorkoutDetail workout={workout} allExercises={allExercises} />;
}
