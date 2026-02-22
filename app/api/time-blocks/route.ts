import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { timeBlocks } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { getToday } from "@/lib/utils";

// GET /api/time-blocks?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || getToday();

  const blocks = await db
    .select()
    .from(timeBlocks)
    .where(eq(timeBlocks.date, date))
    .orderBy(asc(timeBlocks.startTime));

  return NextResponse.json(blocks);
}

// POST /api/time-blocks
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { date, startTime, endTime, label, color } = body;

  if (!date || !startTime || !endTime) {
    return NextResponse.json(
      { error: "date, startTime, endTime required" },
      { status: 400 }
    );
  }

  const [block] = await db
    .insert(timeBlocks)
    .values({
      date,
      startTime,
      endTime,
      label: label?.trim() || null,
      color: color || null,
    })
    .returning();

  return NextResponse.json(block, { status: 201 });
}
