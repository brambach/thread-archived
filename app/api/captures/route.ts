import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { captures } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

// GET /api/captures?processed=false — list captures, optionally filtered
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const processedParam = searchParams.get("processed");

  let result;
  if (processedParam === "false") {
    result = await db
      .select()
      .from(captures)
      .where(eq(captures.processed, false))
      .orderBy(asc(captures.createdAt));
  } else if (processedParam === "true") {
    result = await db
      .select()
      .from(captures)
      .where(eq(captures.processed, true))
      .orderBy(asc(captures.createdAt));
  } else {
    result = await db
      .select()
      .from(captures)
      .orderBy(asc(captures.createdAt));
  }

  return NextResponse.json(result);
}

// POST /api/captures — create a new capture
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { content } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const [capture] = await db
    .insert(captures)
    .values({ content: content.trim() })
    .returning();

  return NextResponse.json(capture, { status: 201 });
}
