import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workouts, workoutSets, exercises } from "@/lib/db/schema";
import { eq, desc, gte, lte, and, inArray } from "drizzle-orm";
import { getToday } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let rows;
  if (from && to) {
    rows = await db
      .select()
      .from(workouts)
      .where(and(gte(workouts.date, from), lte(workouts.date, to)))
      .orderBy(desc(workouts.date));
  } else if (from) {
    rows = await db
      .select()
      .from(workouts)
      .where(gte(workouts.date, from))
      .orderBy(desc(workouts.date));
  } else {
    rows = await db
      .select()
      .from(workouts)
      .orderBy(desc(workouts.date));
  }

  // Attach summary stats to each workout
  const results = await Promise.all(
    rows.map(async (w) => {
      const sets = await db
        .select({ exerciseId: workoutSets.exerciseId, weightLbs: workoutSets.weightLbs, reps: workoutSets.reps })
        .from(workoutSets)
        .where(eq(workoutSets.workoutId, w.id));

      const exerciseIds = [...new Set(sets.map((s) => s.exerciseId))];
      const exerciseRows = exerciseIds.length
        ? await db
            .select({ id: exercises.id, name: exercises.name, muscleGroup: exercises.muscleGroup })
            .from(exercises)
            .where(
              exerciseIds.length === 1
                ? eq(exercises.id, exerciseIds[0])
                : inArray(exercises.id, exerciseIds)
            )
        : [];

      const totalVolume = sets.reduce((sum, s) => {
        const w = parseFloat(s.weightLbs ?? "0");
        const r = s.reps ?? 0;
        return sum + w * r;
      }, 0);

      const muscleGroups = [
        ...new Set(
          exerciseRows.map((e) => e.muscleGroup).filter(Boolean) as string[]
        ),
      ];

      return {
        ...w,
        topExercises: exerciseRows.slice(0, 3).map((e) => e.name),
        totalVolume: Math.round(totalVolume),
        muscleGroups,
      };
    })
  );

  return NextResponse.json(results);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, date, notes, durationMin } = body;

  const [workout] = await db
    .insert(workouts)
    .values({
      date: date ?? getToday(),
      name: name?.trim() || null,
      notes: notes?.trim() || null,
      durationMin: durationMin ?? null,
    })
    .returning();

  return NextResponse.json(workout, { status: 201 });
}
