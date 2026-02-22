import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { habits } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// PATCH /api/habits/[id] — update a habit
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { label, emoji, isActive, sortOrder } = body;

  const updateData: Partial<{
    label: string;
    emoji: string | null;
    isActive: boolean;
    sortOrder: number;
  }> = {};

  if (label !== undefined) updateData.label = label;
  if (emoji !== undefined) updateData.emoji = emoji || null;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

  const [updated] = await db
    .update(habits)
    .set(updateData)
    .where(eq(habits.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

// DELETE /api/habits/[id] — delete a habit
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(habits).where(eq(habits.id, id));
  return NextResponse.json({ success: true });
}
