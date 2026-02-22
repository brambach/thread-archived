"use client";

import type { GCalEvent } from "@/types";

const SLOT_HEIGHT = 60;
const START_HOUR = 7;

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

interface GCalEventChipProps {
  event: GCalEvent;
}

export function GCalEventChip({ event }: GCalEventChipProps) {
  const originMin = START_HOUR * 60;
  const endBoundary = 22 * 60;

  const startMin = Math.max(timeToMinutes(event.startTime), originMin);
  const endMin = Math.min(timeToMinutes(event.endTime), endBoundary);

  if (endMin <= originMin || startMin >= endBoundary) return null;

  const top = ((startMin - originMin) / 30) * SLOT_HEIGHT;
  const height = Math.max(((endMin - startMin) / 30) * SLOT_HEIGHT, 30);

  return (
    <div
      className="absolute left-0 right-0 mx-1 rounded-md border-l-2 border-gcal bg-gcal-dim px-2.5 py-1.5 overflow-hidden"
      style={{ top, height }}
    >
      <p className="text-[13px] font-medium text-gcal truncate leading-tight">
        {event.summary}
      </p>
      {height >= 45 && (
        <p className="text-[10px] font-mono text-text-secondary mt-0.5">
          {formatTime(event.startTime)} – {formatTime(event.endTime)}
        </p>
      )}
    </div>
  );
}

export function GCalAllDayBanner({ events }: { events: GCalEvent[] }) {
  if (events.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 px-3 py-2 border-b border-border">
      {events.map((event) => (
        <span
          key={event.id}
          className="inline-flex items-center rounded-md bg-gcal-dim border border-gcal/20 px-2 py-0.5 text-[11px] font-medium text-gcal"
        >
          {event.summary}
        </span>
      ))}
    </div>
  );
}
