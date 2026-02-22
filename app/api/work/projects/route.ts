import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workProjects, workTasks, workMeetings } from "@/lib/db/schema";
import { asc, desc } from "drizzle-orm";

// GET /api/work/projects — all projects with task stats
export async function GET() {
  const [projects, allTasks, allMeetings] = await Promise.all([
    db
      .select()
      .from(workProjects)
      .orderBy(asc(workProjects.sortOrder), desc(workProjects.createdAt)),
    db
      .select({ projectId: workTasks.projectId, status: workTasks.status })
      .from(workTasks),
    db
      .select({ projectId: workMeetings.projectId, date: workMeetings.date })
      .from(workMeetings)
      .orderBy(desc(workMeetings.date)),
  ]);

  const result = projects.map((p) => {
    const pTasks = allTasks.filter((t) => t.projectId === p.id);
    const pMeetings = allMeetings.filter((m) => m.projectId === p.id);
    return {
      ...p,
      totalTasks: pTasks.length,
      doneTasks: pTasks.filter((t) => t.status === "done").length,
      lastMeetingDate: pMeetings[0]?.date ?? null,
    };
  });

  return NextResponse.json(result);
}

// POST /api/work/projects — create a new project
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, client, description, status, color } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const existing = await db
    .select({ sortOrder: workProjects.sortOrder })
    .from(workProjects)
    .orderBy(desc(workProjects.sortOrder))
    .limit(1);

  const maxOrder = existing.length > 0 ? (existing[0].sortOrder ?? 0) : -1;

  const [project] = await db
    .insert(workProjects)
    .values({
      name: name.trim(),
      client: client?.trim() || null,
      description: description?.trim() || null,
      status: status || "active",
      color: color || "#7C6FCD",
      sortOrder: maxOrder + 1,
    })
    .returning();

  return NextResponse.json(
    { ...project, totalTasks: 0, doneTasks: 0, lastMeetingDate: null },
    { status: 201 }
  );
}
