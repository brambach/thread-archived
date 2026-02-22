import { db } from "@/lib/db";
import { tasks, captures, dayReviews } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { getToday } from "@/lib/utils";
import { TaskList } from "@/components/tasks/task-list";
import { CaptureInbox } from "@/components/captures/capture-inbox";
import { TomorrowTop3 } from "@/components/day-review/tomorrow-top3";
import { LocalDate } from "@/components/ui/local-date";
import type { Task, Capture } from "@/types";

async function getTodaysTasks(): Promise<Task[]> {
  const today = getToday();
  return db
    .select()
    .from(tasks)
    .where(eq(tasks.date, today))
    .orderBy(asc(tasks.isDone), asc(tasks.sortOrder), asc(tasks.createdAt));
}

async function getUnprocessedCaptures(): Promise<Capture[]> {
  return db
    .select()
    .from(captures)
    .where(eq(captures.processed, false))
    .orderBy(asc(captures.createdAt));
}

async function getYesterdayTop3(): Promise<string[]> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  const [review] = await db
    .select({ tomorrowTop3: dayReviews.tomorrowTop3 })
    .from(dayReviews)
    .where(eq(dayReviews.date, yesterdayStr))
    .limit(1);
  return review?.tomorrowTop3 ?? [];
}

export default async function TasksPage() {
  const [todaysTasks, unprocessedCaptures, top3] = await Promise.all([
    getTodaysTasks(),
    getUnprocessedCaptures(),
    getYesterdayTop3(),
  ]);

  return (
    <div className="pt-2 pb-6">
      <header className="py-2 pb-5">
        <h1 className="text-[26px] font-bold tracking-tight text-text leading-tight">
          Tasks
        </h1>
        <LocalDate className="text-sm text-text-secondary mt-0.5" />
      </header>

      <TomorrowTop3 items={top3} />
      <CaptureInbox initialCaptures={unprocessedCaptures} />
      <TaskList initialTasks={todaysTasks} />
    </div>
  );
}
