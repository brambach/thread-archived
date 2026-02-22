import { db } from "@/lib/db";
import { tasks, captures } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { getToday } from "@/lib/utils";
import { TaskList } from "@/components/tasks/task-list";
import { CaptureInbox } from "@/components/captures/capture-inbox";
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

export default async function TasksPage() {
  const [todaysTasks, unprocessedCaptures] = await Promise.all([
    getTodaysTasks(),
    getUnprocessedCaptures(),
  ]);

  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="pt-2 pb-6">
      <header className="py-2 pb-5">
        <h1 className="text-[26px] font-bold tracking-tight text-text leading-tight">
          Tasks
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">{dateStr}</p>
      </header>

      <CaptureInbox initialCaptures={unprocessedCaptures} />
      <TaskList initialTasks={todaysTasks} />
    </div>
  );
}
