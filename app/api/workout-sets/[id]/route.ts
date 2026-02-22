import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workoutSets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { weightLbs, reps, notes, setNumber } = body;

  const updates: Record<string, unknown> = {};
  if (weightLbs !== undefined) updates.weightLbs = weightLbs !== null ? String(weightLbs) : null;
  if (reps !== undefined) updates.reps = reps;
  if (notes !== undefined) updates.notes = notes?.trim() || null;
  if (setNumber !== undefined) updates.setNumber = setNumber;

  const [updated] = await db
    .update(workoutSets)
    .set(updates)
    .where(eq(workoutSets.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  await db.delete(workoutSets).where(eq(workoutSets.id, id));

  return new NextResponse(null, { status: 204 });
}
