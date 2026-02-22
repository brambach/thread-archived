import { db } from "@/lib/db";
import { googleTokens } from "@/lib/db/schema";
import { getValidToken } from "./auth";
import type { GCalEvent } from "@/types";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const eventCache = new Map<
  string,
  { events: GCalEvent[]; expiry: number }
>();

function toHHMM(isoString: string): string {
  const d = new Date(isoString);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

async function fetchCalendarIds(accessToken: string): Promise<string[]> {
  // Check for stored selection first
  const rows = await db.select().from(googleTokens).limit(1);
  const stored = rows[0]?.selectedCalendarIds;
  if (stored) {
    const ids: string[] = JSON.parse(stored);
    if (ids.length > 0) return ids;
  }

  // No selection saved — fetch all calendars
  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return ["primary"];
  const data = await res.json();
  return (data.items ?? []).map((c: any) => c.id as string);
}

async function fetchEventsFromCalendar(
  accessToken: string,
  calendarId: string,
  date: string
): Promise<GCalEvent[]> {
  const timeMin = `${date}T00:00:00Z`;
  const timeMax = `${date}T23:59:59Z`;

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "50",
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) return [];

  const data = await res.json();
  const items: unknown[] = data.items ?? [];

  return items
    .filter((item: any) => item.status !== "cancelled")
    .map((item: any) => {
      const isAllDay = !!item.start?.date && !item.start?.dateTime;
      return {
        id: item.id,
        summary: item.summary ?? "(No title)",
        startTime: isAllDay ? "00:00" : toHHMM(item.start.dateTime),
        endTime: isAllDay ? "23:59" : toHHMM(item.end.dateTime),
        isAllDay,
      };
    });
}

export async function fetchEventsForDate(date: string): Promise<GCalEvent[]> {
  // Check cache
  const cached = eventCache.get(date);
  if (cached && Date.now() < cached.expiry) {
    return cached.events;
  }

  const accessToken = await getValidToken();
  if (!accessToken) return [];

  try {
    const calendarIds = await fetchCalendarIds(accessToken);

    const results = await Promise.all(
      calendarIds.map((id) => fetchEventsFromCalendar(accessToken, id, date))
    );

    // Merge, deduplicate by id, sort by startTime
    const seen = new Set<string>();
    const events: GCalEvent[] = results
      .flat()
      .filter((e) => {
        if (seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    eventCache.set(date, { events, expiry: Date.now() + CACHE_TTL_MS });
    return events;
  } catch {
    return cached?.events ?? [];
  }
}
