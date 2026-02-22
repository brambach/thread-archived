import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workoutSets, workouts } from "@/lib/db/schema";
import { eq, and, max } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { workoutId, exerciseId, setNumber, weightLbs, reps, notes } = body;

  if (!workoutId || !exerciseId) {
    return NextResponse.json(
      { error: "workoutId and exerciseId are required" },
      { status: 400 }
    );
  }

  // Verify workout exists
  const [workout] = await db
    .select()
    .from(workouts)
    .where(eq(workouts.id, workoutId));

  if (!workout) {
    return NextResponse.json({ error: "Workout not found" }, { status: 404 });
  }

  // Determine set number if not provided
  let resolvedSetNumber = setNumber;
  if (resolvedSetNumber === undefined || resolvedSetNumber === null) {
    const existing = await db
      .select({ setNumber: workoutSets.setNumber })
      .from(workoutSets)
      .where(
        and(
          eq(workoutSets.workoutId, workoutId),
          eq(workoutSets.exerciseId, exerciseId)
        )
      );
    resolvedSetNumber = existing.length + 1;
  }

  // Check for PR: get historical max weight for this exercise (across all workouts)
  const [prRow] = await db
    .select({ maxWeight: max(workoutSets.weightLbs) })
    .from(workoutSets)
    .where(eq(workoutSets.exerciseId, exerciseId));

  const historicalMax = prRow?.maxWeight ? parseFloat(prRow.maxWeight) : null;
  const newWeight = weightLbs ? parseFloat(String(weightLbs)) : null;
  const isPR =
    newWeight !== null &&
    historicalMax !== null &&
    newWeight > historicalMax;

  const [set] = await db
    .insert(workoutSets)
    .values({
      workoutId,
      exerciseId,
      setNumber: resolvedSetNumber,
      weightLbs: weightLbs !== undefined ? String(weightLbs) : null,
      reps: reps ?? null,
      notes: notes?.trim() || null,
    })
    .returning();

  return NextResponse.json({ ...set, isPR }, { status: 201 });
}
