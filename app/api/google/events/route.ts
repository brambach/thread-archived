import { NextRequest, NextResponse } from "next/server";
import { fetchEventsForDate } from "@/lib/google/calendar";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  if (!date) {
    return NextResponse.json([], { status: 400 });
  }

  const events = await fetchEventsForDate(date);
  return NextResponse.json(events);
}
