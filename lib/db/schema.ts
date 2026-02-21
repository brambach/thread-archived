import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  date,
  time,
  timestamp,
  numeric,
  unique,
} from "drizzle-orm/pg-core";

// ── Habits ──────────────────────────────────────────────

export const habits = pgTable("habits", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull(),
  emoji: text("emoji"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const habitCompletions = pgTable(
  "habit_completions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    habitId: uuid("habit_id")
      .references(() => habits.id, { onDelete: "cascade" })
      .notNull(),
    date: date("date").notNull(),
    completed: boolean("completed").default(false),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [unique("habit_date_unique").on(table.habitId, table.date)]
);

// ── Time Blocks ─────────────────────────────────────────

export const timeBlocks = pgTable("time_blocks", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  label: text("label"),
  color: text("color"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── Work Projects ───────────────────────────────────────

export const workProjects = pgTable("work_projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  client: text("client"),
  description: text("description"),
  status: text("status").default("active"),
  color: text("color"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ── Tasks ───────────────────────────────────────────────

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  notes: text("notes"),
  date: date("date"),
  isDone: boolean("is_done").default(false),
  doneAt: timestamp("done_at", { withTimezone: true }),
  timeBlockId: uuid("time_block_id").references(() => timeBlocks.id, {
    onDelete: "set null",
  }),
  workProjectId: uuid("work_project_id").references(() => workProjects.id, {
    onDelete: "set null",
  }),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── Journal ─────────────────────────────────────────────

export const journalEntries = pgTable("journal_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: date("date").unique().notNull(),
  content: text("content"),
  wordCount: integer("word_count"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ── Work Tasks ──────────────────────────────────────────

export const workTasks = pgTable("work_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .references(() => workProjects.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  notes: text("notes"),
  status: text("status").default("todo"),
  dueDate: date("due_date"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ── Work Meetings ───────────────────────────────────────

export const workMeetings = pgTable("work_meetings", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .references(() => workProjects.id, { onDelete: "cascade" })
    .notNull(),
  date: date("date").notNull(),
  title: text("title").notNull(),
  attendees: text("attendees"),
  notes: text("notes"),
  actionItems: text("action_items"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ── Exercises ───────────────────────────────────────────

export const exercises = pgTable("exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  muscleGroup: text("muscle_group"),
  isCustom: boolean("is_custom").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── Workouts ────────────────────────────────────────────

export const workouts = pgTable("workouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: date("date").notNull(),
  name: text("name"),
  notes: text("notes"),
  durationMin: integer("duration_min"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── Workout Sets ────────────────────────────────────────

export const workoutSets = pgTable("workout_sets", {
  id: uuid("id").primaryKey().defaultRandom(),
  workoutId: uuid("workout_id")
    .references(() => workouts.id, { onDelete: "cascade" })
    .notNull(),
  exerciseId: uuid("exercise_id")
    .references(() => exercises.id)
    .notNull(),
  setNumber: integer("set_number").notNull(),
  weightLbs: numeric("weight_lbs", { precision: 6, scale: 2 }),
  reps: integer("reps"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── Captures (Quick Capture Inbox) ──────────────────────

export const captures = pgTable("captures", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  processed: boolean("processed").default(false),
  convertedTo: text("converted_to"),
  convertedId: uuid("converted_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── Day Reviews ─────────────────────────────────────────

export const dayReviews = pgTable("day_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: date("date").unique().notNull(),
  energyRating: integer("energy_rating"),
  oneLine: text("one_line"),
  tomorrowTop3: text("tomorrow_top3").array(),
  tasksCompleted: integer("tasks_completed"),
  habitsCompleted: integer("habits_completed"),
  hadWorkout: boolean("had_workout").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
