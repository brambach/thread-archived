import { db } from "@/lib/db";
import { timeBlocks, tasks } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { getToday } from "@/lib/utils";
import { DayView } from "@/components/calendar/day-view";

async function getTodaysBlocks() {
  const today = getToday();
  return db
    .select()
    .from(timeBlocks)
    .where(eq(timeBlocks.date, today))
    .orderBy(asc(timeBlocks.startTime));
}

async function getTodaysTasks() {
  const today = getToday();
  return db
    .select()
    .from(tasks)
    .where(eq(tasks.date, today))
    .orderBy(asc(tasks.sortOrder), asc(tasks.createdAt));
}

export default async function CalendarPage() {
  const [blocks, dayTasks] = await Promise.all([
    getTodaysBlocks(),
    getTodaysTasks(),
  ]);

  return <DayView initialBlocks={blocks} initialTasks={dayTasks} />;
}
