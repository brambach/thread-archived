import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { timeBlocks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// PATCH /api/time-blocks/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { startTime, endTime, label, color } = body;

  const updateData: Partial<{
    startTime: string;
    endTime: string;
    label: string | null;
    color: string | null;
  }> = {};

  if (startTime !== undefined) updateData.startTime = startTime;
  if (endTime !== undefined) updateData.endTime = endTime;
  if (label !== undefined) updateData.label = label?.trim() || null;
  if (color !== undefined) updateData.color = color || null;

  const [updated] = await db
    .update(timeBlocks)
    .set(updateData)
    .where(eq(timeBlocks.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

// DELETE /api/time-blocks/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(timeBlocks).where(eq(timeBlocks.id, id));
  return NextResponse.json({ success: true });
}
