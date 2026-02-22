import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, habitCompletions, habits, workouts, dayReviews } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getToday } from "@/lib/utils";

// GET /api/day-reviews/recap?date=YYYY-MM-DD
// Returns aggregated day stats + incomplete tasks for the close-the-day flow
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || getToday();

  const [allTasks, allHabits, todayCompletions, todayWorkouts, existingReview] =
    await Promise.all([
      db.select().from(tasks).where(eq(tasks.date, date)),
      db.select().from(habits).where(eq(habits.isActive, true)),
      db.select().from(habitCompletions).where(eq(habitCompletions.date, date)),
      db.select().from(workouts).where(eq(workouts.date, date)),
      db
        .select()
        .from(dayReviews)
        .where(eq(dayReviews.date, date))
        .limit(1),
    ]);

  const tasksCompleted = allTasks.filter((t) => t.isDone).length;
  const tasksTotal = allTasks.length;
  const incompleteTasks = allTasks.filter((t) => !t.isDone);

  const completionMap = new Map(todayCompletions.map((c) => [c.habitId, c]));
  const habitsCompleted = allHabits.filter(
    (h) => completionMap.get(h.id)?.completed
  ).length;
  const habitsTotal = allHabits.length;

  const hadWorkout = todayWorkouts.length > 0;

  return NextResponse.json({
    date,
    tasksCompleted,
    tasksTotal,
    habitsCompleted,
    habitsTotal,
    hadWorkout,
    incompleteTasks,
    existingReview: existingReview[0] ?? null,
  });
}
