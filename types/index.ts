import type { InferSelectModel } from "drizzle-orm";
import type {
  habits,
  habitCompletions,
  tasks,
  timeBlocks,
  journalEntries,
  workProjects,
  workTasks,
  workMeetings,
} from "@/lib/db/schema";

export type Habit = InferSelectModel<typeof habits>;
export type HabitCompletion = InferSelectModel<typeof habitCompletions>;
export type Task = InferSelectModel<typeof tasks>;

export type TimeBlock = InferSelectModel<typeof timeBlocks>;

export type JournalEntry = InferSelectModel<typeof journalEntries>;

export type WorkProject = InferSelectModel<typeof workProjects>;
export type WorkTask = InferSelectModel<typeof workTasks>;
export type WorkMeeting = InferSelectModel<typeof workMeetings>;

export type WorkProjectWithStats = WorkProject & {
  totalTasks: number;
  doneTasks: number;
  lastMeetingDate: string | null;
};

export type HabitWithCompletion = Habit & {
  completion: HabitCompletion | null;
  streak: number;
};
