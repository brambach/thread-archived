# Thread — Personal Life Management PWA
> *Your life is a thread you're weaving. This app ties it together.*

---

## Open Questions (to resolve before building)

| # | Question | Status | Decision |
|---|----------|--------|----------|
| 1 | Auth / multi-device? | ✅ Resolved | Single device, no auth. No `users` table needed. |
| 2 | Calendar time block granularity? | ✅ Resolved | 30-minute slots (default, easy to adjust) |
| 3 | Morning routine history / streaks? | ✅ Resolved | Yes — streaks. Track consecutive completion days. |
| 4 | Work section shape? | ✅ Resolved | Projects → Tasks + Meeting Notes + Status overview. Personal tasks can be tagged to a work project. |
| 5 | Journal voice input? | ✅ Resolved | No custom API. Wispr Flow works natively on Mac desktop. iOS uses system dictation (mic button on keyboard). |
| 6 | Google Cal sync — read-only or two-way? | ✅ Resolved | Two-way: read events from Google Cal + create/update events from Thread |
| 7 | Offline-first priority? | ✅ Resolved | Practical offline: cache today's view, habits, and journal. Not full offline-first engineering. |

---

## Design System (North Star)

**Aesthetic:** Linear meets Apple Notes. Dark mode first. Premium, native-feeling.

### Tokens (to define before building)
```
Colors:
  background:    #0A0A0A  (near black)
  surface:       #111111  (card/panel)
  surface-2:     #1A1A1A  (elevated surface)
  border:        #2A2A2A  (subtle dividers)
  text-primary:  #F5F5F5
  text-secondary:#888888
  accent:        #7C6FCD  (purple-ish — "thread" color, TBD)
  success:       #4ADE80

Typography:
  font-sans: 'Inter' or SF Pro fallback stack
  font-mono: 'JetBrains Mono' (for timestamps, etc.)

Spacing: 4px base unit
Radius:  12px cards, 8px inputs, 999px pills
Motion:  spring-based, 200-300ms, subtle — not flashy
```

---

## Data Model

### Tables

> **No auth / no `users` table.** Single device, single user. All rows are implicitly owned by the one user.

#### `habits`
> The template — what habits exist. User-defined, orderable.
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
label       text NOT NULL              -- "Gone outside", "Took meds", "Gym"
emoji       text                       -- optional icon
sort_order  integer NOT NULL DEFAULT 0
is_active   boolean DEFAULT true
created_at  timestamptz DEFAULT now()
```

#### `habit_completions`
> Daily check-off records. One row per habit per day.
```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
habit_id     uuid REFERENCES habits(id) ON DELETE CASCADE
date         date NOT NULL              -- the calendar day this belongs to
completed    boolean DEFAULT false
completed_at timestamptz
UNIQUE(habit_id, date)
```

> **Streaks** are computed on read: query `habit_completions` ordered by date DESC,
> count consecutive days where `completed = true`. No stored streak column needed —
> avoids drift if you edit past entries.

#### `tasks`
> Personal daily tasks. Can be placed on the time-block calendar and optionally tagged to a work project.
```sql
id             uuid PRIMARY KEY DEFAULT gen_random_uuid()
title          text NOT NULL
notes          text
date           date                        -- which day this task is "for"
is_done        boolean DEFAULT false
done_at        timestamptz
time_block_id  uuid REFERENCES time_blocks(id) ON DELETE SET NULL
work_project_id uuid REFERENCES work_projects(id) ON DELETE SET NULL  -- optional project tag
sort_order     integer DEFAULT 0
created_at     timestamptz DEFAULT now()
```

#### `time_blocks`
> 30-minute slots on the daily calendar view. Tasks get dragged onto these.
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
date        date NOT NULL
start_time  time NOT NULL              -- e.g. 09:00
end_time    time NOT NULL              -- e.g. 09:30  (always start + 30min)
label       text                       -- optional override label
color       text                       -- optional color tag
created_at  timestamptz DEFAULT now()
```

#### `journal_entries`
> One entry per day. Plain text content (Wispr Flow / iOS dictation handles voice input natively).
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
date        date UNIQUE NOT NULL        -- one entry per day
content     text                        -- plain text or light markdown
word_count  integer GENERATED ALWAYS AS (array_length(string_to_array(trim(content), ' '), 1)) STORED
created_at  timestamptz DEFAULT now()
updated_at  timestamptz DEFAULT now()
```

#### `work_projects`
> Top-level work containers. Each represents one client integration project.
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
name        text NOT NULL               -- e.g. "Acme Corp — Salesforce Integration"
client      text                        -- client name (separate for display)
description text
status      text DEFAULT 'active'       -- active | paused | blocked | done | archived
color       text                        -- hex, for visual differentiation
sort_order  integer DEFAULT 0
created_at  timestamptz DEFAULT now()
updated_at  timestamptz DEFAULT now()
```

#### `work_tasks`
> Action items within a work project.
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
project_id  uuid REFERENCES work_projects(id) ON DELETE CASCADE
title       text NOT NULL
notes       text                        -- markdown: links, context, blockers
status      text DEFAULT 'todo'         -- todo | in_progress | done | blocked
due_date    date
sort_order  integer DEFAULT 0
created_at  timestamptz DEFAULT now()
updated_at  timestamptz DEFAULT now()
```

#### `work_meetings`
> Meeting notes tied to a project and a date.
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
project_id  uuid REFERENCES work_projects(id) ON DELETE CASCADE
date        date NOT NULL
title       text NOT NULL               -- e.g. "Kickoff call", "Weekly sync"
attendees   text                        -- freeform, comma-separated
notes       text                        -- markdown
action_items text                       -- markdown checklist
created_at  timestamptz DEFAULT now()
updated_at  timestamptz DEFAULT now()
```

#### `exercises`
> Seeded library of common exercises + any user-created ones.
```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
name         text NOT NULL               -- "Bench Press", "Squat", "Deadlift"
muscle_group text                        -- "chest" | "back" | "legs" | "shoulders" | "arms" | "core"
is_custom    boolean DEFAULT false       -- false = pre-seeded, true = user-added
created_at   timestamptz DEFAULT now()
```

#### `workouts`
> A single gym session.
```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
date         date NOT NULL
name         text                        -- optional label: "Push Day", "Leg Day"
notes        text
duration_min integer                     -- optional, in minutes
created_at   timestamptz DEFAULT now()
```

#### `workout_sets`
> Individual sets logged within a workout. This is where progress lives.
```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
workout_id   uuid REFERENCES workouts(id) ON DELETE CASCADE
exercise_id  uuid REFERENCES exercises(id)
set_number   integer NOT NULL            -- 1, 2, 3...
weight_lbs   numeric(6,2)               -- lbs
reps         integer
notes        text                        -- "PR", "form felt off", etc.
created_at   timestamptz DEFAULT now()
```

> **Progress tracking** (all computed on read, no stored columns):
> - **PR per exercise** — `MAX(weight_lbs)` for each `exercise_id`
> - **Volume per session** — `SUM(weight_lbs * reps)` per `workout_id`
> - **Frequency** — `COUNT(workouts)` grouped by month
> - **Improvement** — compare current best set to earliest recorded set for same exercise

#### `captures`
> Quick-capture inbox. Processed = converted to something real or dismissed.
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
content       text NOT NULL
processed     boolean DEFAULT false
converted_to  text                        -- 'task' | 'journal' | 'work_note' | null
converted_id  uuid                        -- fk to whatever it became
created_at    timestamptz DEFAULT now()
```

#### `day_reviews`
> End-of-day recap. One per day. Also stores the daily energy rating.
```sql
id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
date              date UNIQUE NOT NULL
energy_rating     integer CHECK (energy_rating BETWEEN 1 AND 5)
one_line          text                    -- one sentence about the day
tomorrow_top3     text[]                  -- up to 3 intentions for tomorrow
tasks_completed   integer                 -- snapshot at time of close
habits_completed  integer                 -- snapshot at time of close
had_workout       boolean DEFAULT false
created_at        timestamptz DEFAULT now()
```

### Relationships Diagram
```
habits ──────────────── habit_completions

time_blocks ◄────────── tasks ──────────► work_projects
                                               │
                                    ┌──────────┴──────────┐
                                work_tasks          work_meetings

journal_entries  (standalone, one per day)

exercises ◄──── workout_sets ───────────► workouts

captures         (inbox, standalone until processed)
day_reviews      (one per day — energy + recap + tomorrow's top 3)
```

---

## Folder & File Structure

```
Thread/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (PWA meta, fonts, theme)
│   ├── page.tsx                  # Redirect to /morning
│   ├── manifest.ts               # PWA manifest (generated)
│   ├── (app)/                    # Route group: authenticated/main app
│   │   ├── layout.tsx            # Shell with bottom nav, providers
│   │   ├── morning/
│   │   │   └── page.tsx
│   │   ├── tasks/
│   │   │   └── page.tsx
│   │   ├── calendar/
│   │   │   └── page.tsx
│   │   ├── journal/
│   │   │   ├── page.tsx          # Today's entry
│   │   │   └── [date]/
│   │   │       └── page.tsx      # Past entry by date
│   │   └── work/
│   │       ├── page.tsx          # Projects list
│   │       └── [projectId]/
│   │           └── page.tsx      # Project detail
│   └── api/
│       ├── habits/
│       │   └── route.ts
│       ├── tasks/
│       │   └── route.ts
│       ├── time-blocks/
│       │   └── route.ts
│       ├── journal/
│       │   ├── route.ts
│       │   └── transcribe/
│       │       └── route.ts      # Whisper API proxy
│       └── work/
│           ├── projects/
│           │   └── route.ts
│           └── tasks/
│               └── route.ts
│
├── components/
│   ├── ui/                       # Primitives (design system atoms)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── checkbox.tsx
│   │   ├── input.tsx
│   │   ├── badge.tsx
│   │   ├── bottom-sheet.tsx      # Mobile modal pattern
│   │   └── drag-handle.tsx
│   ├── morning/
│   │   ├── habit-list.tsx        # Full habit checklist
│   │   ├── habit-item.tsx        # Single habit row with checkbox
│   │   └── habit-editor.tsx      # Add/edit/reorder habits
│   ├── tasks/
│   │   ├── task-list.tsx
│   │   ├── task-item.tsx
│   │   └── task-form.tsx
│   ├── calendar/
│   │   ├── day-view.tsx          # The main time-block grid
│   │   ├── time-block.tsx        # Individual time slot
│   │   └── task-chip.tsx         # Draggable task chip
│   ├── journal/
│   │   ├── journal-editor.tsx    # Text editing area
│   │   ├── voice-recorder.tsx    # Record + transcribe UI
│   │   └── entry-meta.tsx        # Date, word count, etc.
│   ├── work/
│   │   ├── project-card.tsx
│   │   ├── project-list.tsx
│   │   ├── work-task-item.tsx
│   │   └── work-task-form.tsx
│   └── nav/
│       └── bottom-nav.tsx        # Five-tab bottom bar
│
├── lib/
│   ├── db/
│   │   ├── index.ts              # Drizzle client
│   │   └── schema.ts             # All table definitions
│   ├── api/
│   │   ├── habits.ts             # Typed fetch helpers
│   │   ├── tasks.ts
│   │   ├── journal.ts
│   │   └── work.ts
│   ├── whisper.ts                # OpenAI Whisper client
│   └── utils.ts                  # Date helpers, classnames, etc.
│
├── hooks/
│   ├── use-habits.ts             # Data fetching + optimistic updates
│   ├── use-tasks.ts
│   ├── use-time-blocks.ts
│   ├── use-journal.ts
│   └── use-work.ts
│
├── types/
│   └── index.ts                  # Shared TS types / Drizzle inferred types
│
├── public/
│   ├── icons/                    # PWA icons (192, 512, maskable)
│   └── splash/                   # iOS splash screens
│
├── drizzle/
│   └── migrations/               # Auto-generated migration files
│
├── .claude/
│   └── launch.json               # Dev server config (for Claude preview)
│
├── next.config.ts
├── drizzle.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── PLAN.md                       # This file
```

---

## Component Hierarchy

> **Tabs: Today · Tasks · Calendar · Journal · Work**

### Tab 1: Today (formerly Morning)
```
TodayPage
├── TodayHeader (date, greeting)
│
├── ── Habits ──
├── HabitCompletionCount (e.g. "4 of 6 done")
├── HabitList
│   └── HabitItem × N
│       ├── Checkbox (animated check)
│       ├── EmojiIcon
│       └── Label
├── HabitEditorTrigger → HabitEditor (bottom sheet)
│
├── ── Gym ──
├── TodayGymStatus (did you log a workout today? streak)
├── LogWorkoutButton → WorkoutLogger (full-screen modal)
└── ViewProgressLink → GymProgressPage (full-screen)
```

### Tab 2: Tasks
```
TasksPage
├── TasksHeader (date, task count)
├── TaskList
│   └── TaskItem × N
│       ├── Checkbox
│       ├── Title
│       ├── CalendarChip (if assigned to time block)
│       └── DragHandle
└── AddTaskForm (inline or bottom sheet)
```

### Tab 3: Calendar
```
CalendarPage
├── DateScrubber (swipe between days)
├── DayView
│   ├── TimeAxis (hour labels)
│   ├── TimeBlock × N (droppable)
│   │   ├── TaskChip (draggable, dropped tasks)
│   │   └── EmptySlotHint
│   └── GoogleCalEventChip × N (read-only overlay, future)
└── TaskDrawer (unscheduled tasks, draggable source)
```

### Tab 4: Journal
```
JournalPage
├── JournalHeader (date, streak/word count)
├── JournalEditor
│   ├── ContentArea (textarea or contenteditable)
│   └── Toolbar (formatting hints, char count)
├── VoiceRecorder
│   ├── RecordButton (tap to record)
│   ├── WaveformVisualizer
│   └── TranscribeButton → inserts text into editor
└── EntryMeta (created time, word count)
```

### Tab 5: Work
```
WorkPage (Projects List)
├── WorkHeader
├── StatusSummary (counts by status: active / blocked / done)
├── ProjectList
│   └── ProjectCard × N
│       ├── ColorBar
│       ├── ClientName + ProjectName
│       ├── StatusBadge (active | blocked | paused | done)
│       ├── TaskProgressBar (done/total tasks)
│       └── LastMeetingDate
└── NewProjectButton

WorkProjectPage (Project Detail)
├── ProjectHeader (name, client, status dropdown, color)
├── Tabs: [Tasks] [Meetings] [Notes]
│
├── Tasks Tab
│   ├── WorkTaskList
│   │   └── WorkTaskItem × N
│   │       ├── StatusToggle (todo → in_progress → done → blocked)
│   │       ├── Title
│   │       ├── DueDate chip
│   │       └── NotesPreview
│   └── AddWorkTaskForm
│
├── Meetings Tab
│   ├── MeetingList (sorted by date desc)
│   │   └── MeetingCard × N
│   │       ├── Date + Title
│   │       ├── Attendees
│   │       ├── NotesPreview
│   │       └── ActionItemsCount
│   └── NewMeetingButton → MeetingEditor (bottom sheet)
│       ├── DatePicker
│       ├── TitleInput
│       ├── AttendeesInput
│       ├── NotesArea (markdown)
│       └── ActionItemsArea (checklist)
│
└── Notes Tab
    └── ProjectNotesEditor (freeform markdown — status, context, links)
```

### Gym (navigation placement TBD — see note below)
```
GymPage
├── GymHeader
├── MonthlyHeatmap (workout frequency, GitHub-style)
├── ThisMonthSummary (X sessions, total volume, most trained muscle)
├── RecentWorkouts list
│   └── WorkoutCard × N
│       ├── Date + Name (e.g. "Push Day")
│       ├── ExerciseSummary (top 3 exercises)
│       └── VolumeBadge (total lbs moved)
└── LogWorkoutButton → WorkoutLogger (full-screen)
    ├── WorkoutHeader (name, date, duration timer)
    ├── ExerciseSetList
    │   └── ExerciseBlock × N
    │       ├── ExerciseName + MuscleGroupBadge
    │       ├── SetRow × N
    │       │   ├── SetNumber
    │       │   ├── WeightInput
    │       │   ├── RepsInput
    │       │   └── PRIndicator (🏆 if new personal record)
    │       └── AddSetButton
    └── AddExerciseButton → ExercisePicker (searchable list)

ProgressPage (per-exercise drill-down)
├── ExerciseSelector
├── PRBadge (current best weight × reps)
├── WeightOverTimeChart (line graph — the "before and after")
├── VolumeOverTimeChart
└── RecentSetsTable
```

> **Navigation: "Today" tab** — Morning habits checklist + gym log live together. 5 tabs total: **Today · Tasks · Calendar · Journal · Work**. Gym progress/history accessible from the Today tab (e.g. "View Progress" link → full-screen).

---

## New Features (from brainstorm)

### Quick Capture
> One tap from anywhere in the app → dump a thought before it disappears. Especially useful mid-client-call.

- Persistent floating `+` button visible on every tab (bottom right, above nav)
- Tap → bottom sheet slides up, text field auto-focused, keyboard immediately open
- Hit return → captured. Sheet closes. You're back where you were.
- Captures land in an **Inbox** section at the top of the Tasks tab
- From Inbox you process each one: convert to task, attach to a project, push to journal, or dismiss
- On desktop: keyboard shortcut (e.g. `Cmd+K` or `Cmd+Space`) triggers capture

**Data model:**
```sql
-- captures
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
content       text NOT NULL
processed     boolean DEFAULT false
converted_to  text        -- 'task' | 'journal' | 'work_note' | null
converted_id  uuid        -- fk to whatever it became
created_at    timestamptz DEFAULT now()
```

---

### Close the Day / Day Recap
> A 2-minute end-of-day ritual. Feels like closing a chapter, not filing a report.

**Flow (3 steps, full-screen):**
1. **Recap** — auto-generated summary: tasks completed, habits done, gym status, one notable thing
2. **Roll forward** — unfinished tasks shown one by one. Keep for tomorrow, drop, or reschedule
3. **Tomorrow's top 3** — set 3 intentions for the next day. These surface prominently on the Tasks tab next morning
4. **One line** — optional single sentence about the day. Appended to the journal entry if one exists, standalone if not

**Aesthetic:** slightly warmer, dimmer color temperature than the rest of the app. Feels like winding down. No bright accents.

**Data model — folded into `day_reviews`:**
```sql
id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
date              date UNIQUE NOT NULL
energy_rating     integer CHECK (energy_rating BETWEEN 1 AND 5)  -- 1=drained, 5=great
one_line          text          -- "shipped Acme auth fix, solid gym session"
tomorrow_top3     text[]        -- ['Fix webhook', 'Call Northwind', 'Read 30min']
tasks_completed   integer       -- snapshot count
habits_completed  integer       -- snapshot count
had_workout       boolean
created_at        timestamptz DEFAULT now()
```

---

### Energy Tracking
> Quick daily rating that quietly builds a picture of your patterns over time.

- Logged as part of the Close the Day flow (step 1) — 5 dots or a simple 1–5 tap
- Also visible on the Today tab header as a subtle "how are you feeling today?" prompt in the morning if no rating yet for the day
- Over time: energy rating overlaid on the habit heatmap — darker/brighter based on energy — lets you spot correlations (gym days = higher energy, bad sleep = lower)
- No dedicated page — surfaces as a layer on existing views

---

## Feel-Good Design System

> The app should make you *want* to open it. These mechanics are as important as the features themselves.

### Psychological Principles
| Principle | Implementation |
|-----------|---------------|
| **Identity reinforcement** | Language says who you're *becoming*, not just what you did. "You're a consistent gym-goer." |
| **Loss aversion (streak)** | Streaks drive return visits. Grace freeze removes anxiety without killing motivation. |
| **Progress visibility** | Every section shows forward movement — bars, dots, deltas, trends. |
| **Variable reward** | Most check-ins feel normal. PR moments and milestones feel special. Not every tap is the same. |
| **Forgiveness** | Miss a day → grace freeze (ice crystal, not broken chain). Comeback language is warm, never shaming. |
| **Completion satisfaction** | All-done state transforms the screen — quiet, premium, ceremonial. Not confetti. |

### State Designs

#### Today — All Done State
- Background shifts to `#0D0B12` (barely perceptible warm purple tint)
- Greeting changes: *"All done, Bryce."* in soft lavender
- Subline: *"your day is yours"*
- Hero card: `✦ Perfect morning` + identity copy — *"You've shown up 8 days straight — that's not luck, that's who you are."*
- Week dot row: 7 filled purple dots, today's glowing
- Identity cards: *"You're becoming a consistent gym-goer"* / *"A daily writer"*

#### Streak Grace Day
- Streak number turns blue (not red — blue = frozen, not failed)
- Banner: `🧊 Streak frozen · yesterday was your grace day`
- Copy: *"Complete your habits today to keep the chain going."*
- Week dots: filled = purple, grace day = ice blue, today = blue outline (pending)
- Greeting: *"Back at it, Bryce."*

#### Gym PR Moment
- PR set row gets a warm amber background wash
- Weight/reps inputs turn amber
- `🏆 PR` badge animates in with a spring pop
- Confirmation card beneath: *"New personal record · 190 lbs × 3 · up from 185 lbs on Feb 14"*
- Exercise block header gets a subtle gold border

### Mechanic Map by Tab
| Tab | Mechanics |
|-----|-----------|
| **Today** | All-done transform, streak + grace, week dot row, identity cards |
| **Gym** | PR badge (animated), "stronger than last time" delta, monthly heatmap intensity |
| **Journal** | Writing streak, annual word count milestone, entry length comparison |
| **Tasks** | "Clean day" state when all done, subtle daily completion % |
| **Work** | Project completion glow when all tasks done, "X tasks closed this week" |

---

## Sprint Plan

> **Model guide:**
> - **Opus** — complex architecture, multi-file coordination, tricky integrations, novel logic
> - **Sonnet** — CRUD routes, component building, styling, straightforward implementation

### Sprint 0 — Foundation · `Opus`
> Architecture decisions made here ripple through every sprint. Get it right once.
- Init Next.js 15 + TypeScript + Tailwind
- Configure Drizzle + Neon/Supabase connection
- Run initial migrations (all tables)
- Set up PWA manifest + service worker (next-pwa or custom)
- Define design tokens in tailwind.config
- Build `BottomNav` component + shell layout
- Deploy to Vercel

### Sprint 1 — Morning Routine · `Sonnet`
> Straightforward CRUD + UI. The animated checkbox is the only tricky bit.
- Seed default habits
- `GET/POST /api/habits` and `GET/POST /api/habits/completions`
- `HabitList`, `HabitItem` with animated checkbox
- Daily reset logic (query completions for today's date)
- `HabitEditor` bottom sheet (add, reorder, delete)

### Sprint 2 — Task List · `Sonnet`
> Standard list CRUD with optimistic UI. Well-trodden ground.
- `GET/POST/PATCH/DELETE /api/tasks`
- `TaskList`, `TaskItem`, `AddTaskForm`
- Mark done with optimistic UI
- Date scoping (tasks for today)

### Sprint 3 — Calendar / Time Blocks · `Opus`
> dnd-kit touch drag-and-drop on a time grid is genuinely complex. Needs careful coordination between the task list and calendar state.
- `GET/POST/PATCH/DELETE /api/time-blocks`
- `DayView` grid with time axis
- Drag tasks from list onto time blocks (dnd-kit)
- DateScrubber to navigate days

### Sprint 4 — Journal · `Sonnet`
> Editor + auto-save is standard. Voice handled natively (no API). Past entries are a simple date-param route.
- `GET/POST/PATCH /api/journal`
- `JournalEditor` with auto-save (debounced)
- Past entries via `/journal/[date]`
- Word count display (computed from DB column)

### Sprint 5 — Work Section · `Sonnet`
> Same CRUD patterns as Sprints 1–2, just a different domain. Meeting notes editor is the only new wrinkle.
- Projects CRUD + work tasks CRUD + meeting notes CRUD
- `ProjectList`, `ProjectCard`, `WorkProjectPage` with Tasks/Meetings/Notes tabs
- Status cycling on work tasks
- Personal task → project tagging

### Sprint 5b — Gym · `Sonnet`
> CRUD-heavy with some computed aggregates. Charts are the most involved piece but well-supported by libraries.
- Seed exercise library (~50 common exercises with muscle groups)
- `GET/POST /api/workouts` + `GET/POST/PATCH/DELETE /api/workout-sets`
- `WorkoutLogger` full-screen flow with live PR detection
- `GymPage` with monthly heatmap + recent workouts
- `ProgressPage` per-exercise with weight-over-time chart (Recharts or similar)
- Weight tracked in lbs

### Sprint 5c — Quick Capture · `Sonnet`
> Simple UI, simple data model. The inbox processing UX is the only nuanced piece.
- `POST /api/captures` + `GET /api/captures?processed=false`
- Floating capture button component (persistent across all tabs)
- Inbox section on Tasks tab with process actions (→ task, → journal, → work note, dismiss)
- `Cmd+K` shortcut on desktop

### Sprint 5d — Close the Day + Energy · `Sonnet`
> A multi-step flow but each step is simple. The interesting part is the auto-generated recap pulling from multiple tables.
- `GET/POST /api/day-reviews`
- 3-step close-the-day flow (recap → roll forward → top 3 + one line)
- Tomorrow's top 3 surfaced on Tasks tab header each morning
- Energy dot (1–5) on Today tab morning prompt
- Energy overlay on habit heatmap (future — defer to polish sprint)

### Sprint 6 — Polish & PWA · `Opus`
> Service worker caching strategies, iOS-specific PWA quirks, and coordinating animations across tabs require real judgment calls.
- iOS splash screens + icons
- Offline support (service worker caching strategy)
- Transitions between tabs (slide animation)
- Empty states for every tab
- Pull-to-refresh

### Sprint 7 — Calendar Integrations · `Opus`
> Two-way sync is significantly more complex than read-only: you need OAuth + token refresh, conflict resolution, and a mapping table to track which Thread time blocks correspond to which Google Calendar event IDs.
- Google Calendar OAuth (store refresh token locally — no auth layer needed since single user)
- Read events → overlay on DayView as non-editable chips
- Create Google Cal event when a time block is finalized in Thread
- Update/delete Google Cal event when time block changes
- Store `google_event_id` on `time_blocks` to maintain the mapping
- Outlook/Exchange read-only overlay (two-way Outlook is a separate OAuth flow — defer or do read-only first)

---

## Tech Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js 15 App Router | SSR + API routes in one, Vercel-native |
| ORM | Drizzle | Lightweight, type-safe, great migrations |
| Database | Neon (Postgres) | Serverless Postgres, generous free tier |
| Styling | Tailwind CSS | Utility-first, easy design tokens |
| Drag & Drop | dnd-kit | Best-in-class, accessible, touch support |
| Voice input | None (no API) | Wispr Flow works natively in browser on Mac; iOS uses system dictation |
| Auth | None | Single device, single user — no login needed |
| PWA | next-pwa or custom SW | Needs evaluation for App Router compat |
| State | React hooks + SWR/TanStack Query | Server state via API, minimal client state |
| Animations | Framer Motion | Spring physics, layout animations |
