import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workTasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// PATCH /api/work/tasks/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { title, notes, status, dueDate, sortOrder } = body;

  const updateData: Partial<{
    title: string;
    notes: string | null;
    status: string;
    dueDate: string | null;
    sortOrder: number;
    updatedAt: Date;
  }> = { updatedAt: new Date() };

  if (title !== undefined) updateData.title = title.trim();
  if (notes !== undefined) updateData.notes = notes?.trim() || null;
  if (status !== undefined) updateData.status = status;
  if (dueDate !== undefined) updateData.dueDate = dueDate || null;
  if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

  const [updated] = await db
    .update(workTasks)
    .set(updateData)
    .where(eq(workTasks.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

// DELETE /api/work/tasks/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(workTasks).where(eq(workTasks.id, id));
  return NextResponse.json({ success: true });
}
