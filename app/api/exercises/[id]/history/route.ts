import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workoutSets, workouts, exercises } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const [exercise] = await db
    .select()
    .from(exercises)
    .where(eq(exercises.id, id));

  if (!exercise) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get all sets for this exercise across all workouts
  const rows = await db
    .select({
      set: workoutSets,
      workout: workouts,
    })
    .from(workoutSets)
    .innerJoin(workouts, eq(workoutSets.workoutId, workouts.id))
    .where(eq(workoutSets.exerciseId, id))
    .orderBy(asc(workouts.date), asc(workoutSets.setNumber));

  // Group by workout date
  const byWorkout = new Map<
    string,
    { date: string; workoutId: string; sets: (typeof workoutSets.$inferSelect)[] }
  >();

  for (const row of rows) {
    const key = row.workout.id;
    if (!byWorkout.has(key)) {
      byWorkout.set(key, {
        date: row.workout.date,
        workoutId: row.workout.id,
        sets: [],
      });
    }
    byWorkout.get(key)!.sets.push(row.set);
  }

  const history = Array.from(byWorkout.values()).map((entry) => {
    const weights = entry.sets
      .map((s) => (s.weightLbs ? parseFloat(s.weightLbs) : null))
      .filter((w): w is number => w !== null);

    const volumes = entry.sets
      .map((s) => {
        const w = s.weightLbs ? parseFloat(s.weightLbs) : 0;
        const r = s.reps ?? 0;
        return w * r;
      });

    return {
      date: entry.date,
      workoutId: entry.workoutId,
      maxWeight: weights.length ? Math.max(...weights) : null,
      totalVolume: Math.round(volumes.reduce((a, b) => a + b, 0)),
      sets: entry.sets,
    };
  });

  // Overall PR
  const allWeights = history.flatMap((h) => h.maxWeight).filter((w): w is number => w !== null);
  const pr = allWeights.length ? Math.max(...allWeights) : null;

  return NextResponse.json({ exercise, history, pr });
}
