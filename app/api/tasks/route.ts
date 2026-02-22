import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { getToday } from "@/lib/utils";

// GET /api/tasks?date=YYYY-MM-DD — tasks for a given day
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || getToday();

  const result = await db
    .select()
    .from(tasks)
    .where(eq(tasks.date, date))
    .orderBy(asc(tasks.isDone), asc(tasks.sortOrder), asc(tasks.createdAt));

  return NextResponse.json(result);
}

// POST /api/tasks — create a new task
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, notes, date } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const targetDate = date || getToday();

  // Append at end of today's task list
  const existing = await db
    .select({ sortOrder: tasks.sortOrder })
    .from(tasks)
    .where(eq(tasks.date, targetDate))
    .orderBy(desc(tasks.sortOrder))
    .limit(1);

  const maxOrder = existing.length > 0 ? (existing[0].sortOrder ?? 0) : -1;

  const [task] = await db
    .insert(tasks)
    .values({
      title: title.trim(),
      notes: notes?.trim() || null,
      date: targetDate,
      sortOrder: maxOrder + 1,
    })
    .returning();

  return NextResponse.json(task, { status: 201 });
}
