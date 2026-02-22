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
  exercises,
  workouts,
  workoutSets,
  captures,
  dayReviews,
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

export type Capture = InferSelectModel<typeof captures>;
export type DayReview = InferSelectModel<typeof dayReviews>;

export type Exercise = InferSelectModel<typeof exercises>;
export type Workout = InferSelectModel<typeof workouts>;
export type WorkoutSet = InferSelectModel<typeof workoutSets>;

export type WorkoutSetWithExercise = WorkoutSet & {
  exercise: Exercise;
};

export type ExerciseBlock = {
  exercise: Exercise;
  sets: WorkoutSet[];
};

export type WorkoutWithSets = Workout & {
  exercises: ExerciseBlock[];
  totalVolume: number;
};

export type WorkoutSummary = Workout & {
  topExercises: string[];
  totalVolume: number;
  muscleGroups: string[];
};

export type ExerciseHistory = {
  date: string;
  workoutId: string;
  maxWeight: number | null;
  totalVolume: number | null;
  sets: WorkoutSet[];
};
