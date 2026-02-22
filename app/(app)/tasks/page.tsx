import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { getToday } from "@/lib/utils";
import { TaskList } from "@/components/tasks/task-list";
import type { Task } from "@/types";

async function getTodaysTasks(): Promise<Task[]> {
  const today = getToday();
  return db
    .select()
    .from(tasks)
    .where(eq(tasks.date, today))
    .orderBy(asc(tasks.isDone), asc(tasks.sortOrder), asc(tasks.createdAt));
}

export default async function TasksPage() {
  const todaysTasks = await getTodaysTasks();
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

      <TaskList initialTasks={todaysTasks} />
    </div>
  );
}
