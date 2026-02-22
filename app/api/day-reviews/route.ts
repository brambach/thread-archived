import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dayReviews } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getToday } from "@/lib/utils";

// GET /api/day-reviews?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || getToday();

  const [review] = await db
    .select()
    .from(dayReviews)
    .where(eq(dayReviews.date, date))
    .limit(1);

  return NextResponse.json(review ?? null);
}

// POST /api/day-reviews — create or update (upsert by date)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { date, energyRating, oneLine, tomorrowTop3, tasksCompleted, habitsCompleted, hadWorkout } = body;

  const targetDate = date || getToday();

  const [existing] = await db
    .select({ id: dayReviews.id })
    .from(dayReviews)
    .where(eq(dayReviews.date, targetDate))
    .limit(1);

  type UpdateFields = {
    energyRating?: number | null;
    oneLine?: string | null;
    tomorrowTop3?: string[] | null;
    tasksCompleted?: number | null;
    habitsCompleted?: number | null;
    hadWorkout?: boolean;
  };
  const updateData: UpdateFields = {};
  if (energyRating !== undefined) updateData.energyRating = energyRating;
  if (oneLine !== undefined) updateData.oneLine = oneLine || null;
  if (tomorrowTop3 !== undefined) updateData.tomorrowTop3 = tomorrowTop3;
  if (tasksCompleted !== undefined) updateData.tasksCompleted = tasksCompleted;
  if (habitsCompleted !== undefined) updateData.habitsCompleted = habitsCompleted;
  if (hadWorkout !== undefined) updateData.hadWorkout = hadWorkout;

  let review;
  if (existing) {
    [review] = await db
      .update(dayReviews)
      .set(updateData)
      .where(eq(dayReviews.date, targetDate))
      .returning();
  } else {
    [review] = await db
      .insert(dayReviews)
      .values({
        date: targetDate,
        energyRating: energyRating ?? null,
        oneLine: oneLine || null,
        tomorrowTop3: tomorrowTop3 ?? null,
        tasksCompleted: tasksCompleted ?? null,
        habitsCompleted: habitsCompleted ?? null,
        hadWorkout: hadWorkout ?? false,
      })
      .returning();
  }

  return NextResponse.json(review);
}
