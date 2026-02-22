import type { InferSelectModel } from "drizzle-orm";
import type {
  habits,
  habitCompletions,
  tasks,
  timeBlocks,
} from "@/lib/db/schema";

export type Habit = InferSelectModel<typeof habits>;
export type HabitCompletion = InferSelectModel<typeof habitCompletions>;
export type Task = InferSelectModel<typeof tasks>;

export type TimeBlock = InferSelectModel<typeof timeBlocks>;

export type HabitWithCompletion = Habit & {
  completion: HabitCompletion | null;
  streak: number;
};
