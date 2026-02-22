import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { googleTokens } from "@/lib/db/schema";
import { getValidToken } from "@/lib/google/auth";

import type { CalendarListItem } from "@/types";

// GET: return all calendars from Google with their selected state
export async function GET(): Promise<NextResponse> {
  const accessToken = await getValidToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Not connected" }, { status: 401 });
  }

  const rows = await db.select().from(googleTokens).limit(1);
  const stored = rows[0]?.selectedCalendarIds;
  const selectedIds: string[] | null = stored ? JSON.parse(stored) : null;

  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    const errBody = await res.text();
    console.error("Google calendarList error:", res.status, errBody);
    return NextResponse.json({ error: "Failed to fetch calendars", status: res.status, detail: errBody }, { status: 502 });
  }

  const data = await res.json();
  const calendars: CalendarListItem[] = (data.items ?? []).map((c: any) => ({
    id: c.id,
    summary: c.summaryOverride ?? c.summary ?? c.id,
    backgroundColor: c.backgroundColor ?? null,
    // If no selection saved yet, all are selected by default
    selected: selectedIds === null ? true : selectedIds.includes(c.id),
  }));

  return NextResponse.json(calendars);
}

// PATCH: update selected calendar IDs
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const { selectedIds }: { selectedIds: string[] } = await request.json();

  await db
    .update(googleTokens)
    .set({ selectedCalendarIds: JSON.stringify(selectedIds), updatedAt: new Date() });

  return NextResponse.json({ success: true });
}
