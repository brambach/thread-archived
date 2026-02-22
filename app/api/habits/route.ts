import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { habits, habitCompletions } from "@/lib/db/schema";
import { eq, and, gte, asc, desc } from "drizzle-orm";
import { getToday } from "@/lib/utils";
import type { HabitWithCompletion } from "@/types";

function computeStreak(
  completions: { date: string; completed: boolean }[]
): number {
  // completions sorted by date desc
  const sorted = [...completions].sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  const today = getToday();
  let streak = 0;
  let cursor = today;

  for (const c of sorted) {
    if (c.date !== cursor) break;
    if (!c.completed) break;
    streak++;
    // Move cursor back one day
    const d = new Date(cursor);
    d.setDate(d.getDate() - 1);
    cursor = d.toISOString().split("T")[0];
  }

  return streak;
}

// GET /api/habits — active habits with today's completion + streak
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || getToday();

  const allHabits = await db
    .select()
    .from(habits)
    .where(eq(habits.isActive, true))
    .orderBy(asc(habits.sortOrder), asc(habits.createdAt));

  if (allHabits.length === 0) {
    return NextResponse.json([]);
  }

  // Today's completions
  const todayCompletions = await db
    .select()
    .from(habitCompletions)
    .where(eq(habitCompletions.date, date));

  const completionMap = new Map(todayCompletions.map((c) => [c.habitId, c]));

  // Recent completions for streak calculation (last 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const cutoff = ninetyDaysAgo.toISOString().split("T")[0];

  const recentCompletions = await db
    .select()
    .from(habitCompletions)
    .where(gte(habitCompletions.date, cutoff))
    .orderBy(desc(habitCompletions.date));

  // Group by habitId for streak computation
  const completionsByHabit = new Map<
    string,
    { date: string; completed: boolean }[]
  >();
  for (const c of recentCompletions) {
    if (!completionsByHabit.has(c.habitId)) {
      completionsByHabit.set(c.habitId, []);
    }
    completionsByHabit.get(c.habitId)!.push({
      date: c.date,
      completed: c.completed ?? false,
    });
  }

  const result: HabitWithCompletion[] = allHabits.map((habit) => ({
    ...habit,
    completion: completionMap.get(habit.id) ?? null,
    streak: computeStreak(completionsByHabit.get(habit.id) ?? []),
  }));

  return NextResponse.json(result);
}

// POST /api/habits — create a new habit
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { label, emoji } = body;

  if (!label?.trim()) {
    return NextResponse.json({ error: "Label is required" }, { status: 400 });
  }

  const existing = await db
    .select({ sortOrder: habits.sortOrder })
    .from(habits)
    .where(eq(habits.isActive, true))
    .orderBy(desc(habits.sortOrder))
    .limit(1);

  const maxOrder = existing.length > 0 ? (existing[0].sortOrder ?? 0) : -1;

  const [habit] = await db
    .insert(habits)
    .values({
      label: label.trim(),
      emoji: emoji?.trim() || null,
      sortOrder: maxOrder + 1,
    })
    .returning();

  return NextResponse.json(habit, { status: 201 });
}
