import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workMeetings } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getToday } from "@/lib/utils";

// GET /api/work/meetings?projectId=xxx
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
    .from(workMeetings)
    .where(eq(workMeetings.projectId, projectId))
    .orderBy(desc(workMeetings.date), desc(workMeetings.createdAt));

  return NextResponse.json(result);
}

// POST /api/work/meetings
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { projectId, date, title, attendees, notes, actionItems } = body;

  if (!projectId || !title?.trim()) {
    return NextResponse.json(
      { error: "projectId and title are required" },
      { status: 400 }
    );
  }

  const [meeting] = await db
    .insert(workMeetings)
    .values({
      projectId,
      date: date || getToday(),
      title: title.trim(),
      attendees: attendees?.trim() || null,
      notes: notes?.trim() || null,
      actionItems: actionItems?.trim() || null,
    })
    .returning();

  return NextResponse.json(meeting, { status: 201 });
}
