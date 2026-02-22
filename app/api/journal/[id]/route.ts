import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { journalEntries } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

function countWords(text: string): number {
  const trimmed = text?.trim() ?? "";
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

// PATCH /api/journal/[id] — update entry content
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { content } = body;

  const updateData: Partial<{
    content: string;
    wordCount: number;
    updatedAt: Date;
  }> = { updatedAt: new Date() };

  if (content !== undefined) {
    updateData.content = content;
    updateData.wordCount = countWords(content);
  }

  const [updated] = await db
    .update(journalEntries)
    .set(updateData)
    .where(eq(journalEntries.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
