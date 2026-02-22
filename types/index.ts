import type { InferSelectModel } from "drizzle-orm";
import type {
  habits,
  habitCompletions,
  tasks,
  timeBlocks,
  journalEntries,
} from "@/lib/db/schema";

export type Habit = InferSelectModel<typeof habits>;
export type HabitCompletion = InferSelectModel<typeof habitCompletions>;
export type Task = InferSelectModel<typeof tasks>;

export type TimeBlock = InferSelectModel<typeof timeBlocks>;

export type JournalEntry = InferSelectModel<typeof journalEntries>;

export type HabitWithCompletion = Habit & {
  completion: HabitCompletion | null;
  streak: number;
};
