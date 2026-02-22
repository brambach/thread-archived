import { db } from "@/lib/db";
import { exercises } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { WorkoutLogger } from "@/components/gym/workout-logger";
import type { Exercise } from "@/types";

async function getExercises(): Promise<Exercise[]> {
  const all = await db
    .select()
    .from(exercises)
    .orderBy(asc(exercises.muscleGroup), asc(exercises.name));

  if (all.length === 0) {
    // Trigger seed via API call on the server
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/exercises`);
    return db
      .select()
      .from(exercises)
      .orderBy(asc(exercises.muscleGroup), asc(exercises.name));
  }

  return all;
}

export default async function LogWorkoutPage() {
  const exerciseList = await getExercises();

  return <WorkoutLogger exercises={exerciseList} />;
}
