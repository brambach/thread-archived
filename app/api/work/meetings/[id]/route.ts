import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workMeetings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// PATCH /api/work/meetings/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { date, title, attendees, notes, actionItems } = body;

  const updateData: Partial<{
    date: string;
    title: string;
    attendees: string | null;
    notes: string | null;
    actionItems: string | null;
    updatedAt: Date;
  }> = { updatedAt: new Date() };

  if (date !== undefined) updateData.date = date;
  if (title !== undefined) updateData.title = title.trim();
  if (attendees !== undefined) updateData.attendees = attendees?.trim() || null;
  if (notes !== undefined) updateData.notes = notes?.trim() || null;
  if (actionItems !== undefined)
    updateData.actionItems = actionItems?.trim() || null;

  const [updated] = await db
    .update(workMeetings)
    .set(updateData)
    .where(eq(workMeetings.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

// DELETE /api/work/meetings/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(workMeetings).where(eq(workMeetings.id, id));
  return NextResponse.json({ success: true });
}
