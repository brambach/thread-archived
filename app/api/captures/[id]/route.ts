import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { captures } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// PATCH /api/captures/[id] — mark processed, set convertedTo/convertedId
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { processed, convertedTo, convertedId } = body;

  const updateData: Partial<{
    processed: boolean;
    convertedTo: string | null;
    convertedId: string | null;
  }> = {};

  if (processed !== undefined) updateData.processed = processed;
  if (convertedTo !== undefined) updateData.convertedTo = convertedTo;
  if (convertedId !== undefined) updateData.convertedId = convertedId;

  const [updated] = await db
    .update(captures)
    .set(updateData)
    .where(eq(captures.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

// DELETE /api/captures/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(captures).where(eq(captures.id, id));
  return NextResponse.json({ success: true });
}
