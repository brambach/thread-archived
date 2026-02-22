import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workouts, workoutSets, exercises } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const [workout] = await db.select().from(workouts).where(eq(workouts.id, id));
  if (!workout) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const sets = await db
    .select({
      set: workoutSets,
      exercise: exercises,
    })
    .from(workoutSets)
    .innerJoin(exercises, eq(workoutSets.exerciseId, exercises.id))
    .where(eq(workoutSets.workoutId, id))
    .orderBy(asc(workoutSets.exerciseId), asc(workoutSets.setNumber));

  // Group sets by exercise
  const exerciseMap = new Map<
    string,
    { exercise: (typeof exercises.$inferSelect); sets: (typeof workoutSets.$inferSelect)[] }
  >();

  for (const row of sets) {
    const key = row.exercise.id;
    if (!exerciseMap.has(key)) {
      exerciseMap.set(key, { exercise: row.exercise, sets: [] });
    }
    exerciseMap.get(key)!.sets.push(row.set);
  }

  const exerciseBlocks = Array.from(exerciseMap.values());

  const totalVolume = sets.reduce((sum, r) => {
    const w = parseFloat(r.set.weightLbs ?? "0");
    const reps = r.set.reps ?? 0;
    return sum + w * reps;
  }, 0);

  return NextResponse.json({
    ...workout,
    exercises: exerciseBlocks,
    totalVolume: Math.round(totalVolume),
  });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { name, notes, durationMin } = body;

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name?.trim() || null;
  if (notes !== undefined) updates.notes = notes?.trim() || null;
  if (durationMin !== undefined) updates.durationMin = durationMin;

  const [updated] = await db
    .update(workouts)
    .set(updates)
    .where(eq(workouts.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  await db.delete(workouts).where(eq(workouts.id, id));

  return new NextResponse(null, { status: 204 });
}
