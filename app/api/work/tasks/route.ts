import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workTasks } from "@/lib/db/schema";
import { eq, asc, desc } from "drizzle-orm";

// GET /api/work/tasks?projectId=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId is required" },
      { status: 400 }
    );
  }

  const result = await db
    .select()
    .from(workTasks)
    .where(eq(workTasks.projectId, projectId))
    .orderBy(asc(workTasks.sortOrder), asc(workTasks.createdAt));

  return NextResponse.json(result);
}

// POST /api/work/tasks
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { projectId, title, notes, dueDate } = body;

  if (!projectId || !title?.trim()) {
    return NextResponse.json(
      { error: "projectId and title are required" },
      { status: 400 }
    );
  }

  const existing = await db
    .select({ sortOrder: workTasks.sortOrder })
    .from(workTasks)
    .where(eq(workTasks.projectId, projectId))
    .orderBy(desc(workTasks.sortOrder))
    .limit(1);

  const maxOrder = existing.length > 0 ? (existing[0].sortOrder ?? 0) : -1;

  const [task] = await db
    .insert(workTasks)
    .values({
      projectId,
      title: title.trim(),
      notes: notes?.trim() || null,
      dueDate: dueDate || null,
      sortOrder: maxOrder + 1,
    })
    .returning();

  return NextResponse.json(task, { status: 201 });
}
