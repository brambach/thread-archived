import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// PATCH /api/tasks/[id] — update a task
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { title, notes, isDone, sortOrder, timeBlockId } = body;

  const updateData: Partial<{
    title: string;
    notes: string | null;
    isDone: boolean;
    doneAt: Date | null;
    sortOrder: number;
    timeBlockId: string | null;
  }> = {};

  if (title !== undefined) updateData.title = title.trim();
  if (notes !== undefined) updateData.notes = notes?.trim() || null;
  if (isDone !== undefined) {
    updateData.isDone = isDone;
    updateData.doneAt = isDone ? new Date() : null;
  }
  if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
  if (timeBlockId !== undefined) updateData.timeBlockId = timeBlockId;

  const [updated] = await db
    .update(tasks)
    .set(updateData)
    .where(eq(tasks.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

// DELETE /api/tasks/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(tasks).where(eq(tasks.id, id));
  return NextResponse.json({ success: true });
}
