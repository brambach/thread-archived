# Thread (v1, archived)

The first version of Thread. It's a phone-first web app I built to run my own days: morning habits, tasks, a time-blocked calendar with Google Calendar laid over it, a journal, work projects and a gym log.

It's single-user with no sign-in, and it installs to your home screen as a PWA. I stopped here and started over on a different question, which lives in [thread](https://github.com/brambach/thread) now.

## What's in it

| Tab | What it does |
| --- | --- |
| Today | Habits with streaks, the day's tasks and a quick-capture inbox |
| Calendar | 30-minute time blocks you drag tasks into, with your Google Calendar events on top (read-only) |
| Tasks | Personal to-dos, which you can tag to a work project |
| Journal | One entry per day |
| Work | Projects, work tasks and meeting notes |
| Gym | A workout logger, exercise history and progress charts |

At night there's a close-the-day flow where you rate your energy and pick tomorrow's top three.

## Stack

Next.js, TypeScript, Tailwind, Drizzle on Neon Postgres, TanStack Query, dnd-kit, Framer Motion and Recharts.

## Run it

```bash
npm install
npm run dev
```

You'll need a `DATABASE_URL` for Neon. The calendar overlay also wants `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and `GOOGLE_REDIRECT_URI`.
