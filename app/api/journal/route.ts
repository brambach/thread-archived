import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { journalEntries } from "@/lib/db/schema";
import { eq, isNotNull, lte, desc } from "drizzle-orm";
import { getToday } from "@/lib/utils";

function countWords(text: string): number {
  const trimmed = text?.trim() ?? "";
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

// GET /api/journal?date=YYYY-MM-DD — entry for a given day
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || getToday();

  const [entry] = await db
    .select()
    .from(journalEntries)
    .where(eq(journalEntries.date, date))
    .limit(1);

  return NextResponse.json(entry ?? null);
}

// GET /api/journal/streak helper — exposed as ?streak=true
// POST /api/journal — upsert entry for a date
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { date, content } = body;

  const targetDate = date || getToday();
  const text = content ?? "";
  const wc = countWords(text);

  // Check if entry already exists for this date
  const [existing] = await db
    .select()
    .from(journalEntries)
    .where(eq(journalEntries.date, targetDate))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(journalEntries)
      .set({ content: text, wordCount: wc, updatedAt: new Date() })
      .where(eq(journalEntries.id, existing.id))
      .returning();
    return NextResponse.json(updated);
  }

  const [entry] = await db
    .insert(journalEntries)
    .values({ date: targetDate, content: text, wordCount: wc })
    .returning();

  return NextResponse.json(entry, { status: 201 });
}
