import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { habitCompletions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getToday } from "@/lib/utils";

// POST /api/habits/completions — upsert a completion (toggle)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { habitId, date = getToday(), completed } = body;

  if (!habitId) {
    return NextResponse.json({ error: "habitId is required" }, { status: 400 });
  }

  // Check if a completion row exists for this habit + date
  const existing = await db
    .select()
    .from(habitCompletions)
    .where(
      and(
        eq(habitCompletions.habitId, habitId),
        eq(habitCompletions.date, date)
      )
    )
    .limit(1);

  let result;
  if (existing.length > 0) {
    [result] = await db
      .update(habitCompletions)
      .set({
        completed,
        completedAt: completed ? new Date() : null,
      })
      .where(eq(habitCompletions.id, existing[0].id))
      .returning();
  } else {
    [result] = await db
      .insert(habitCompletions)
      .values({
        habitId,
        date,
        completed,
        completedAt: completed ? new Date() : null,
      })
      .returning();
  }

  return NextResponse.json(result);
}
