"use client";

import { useRef } from "react";

interface DateScrubberProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  onSettingsTap?: () => void;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function formatDateLabel(dateStr: string): string {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const tomorrow = addDays(today, 1);
  const yesterday = addDays(today, -1);

  const d = new Date(dateStr + "T12:00:00");
  const short = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (dateStr === today) return `${short} — Today`;
  if (dateStr === tomorrow) return `${short} — Tomorrow`;
  if (dateStr === yesterday) return `${short} — Yesterday`;

  const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
  return `${short} — ${dayName}`;
}

export function DateScrubber({ selectedDate, onDateChange, onSettingsTap }: DateScrubberProps) {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    touchStartRef.current = null;
    // Require a clear horizontal swipe: ≥48px wide, and at least 2× the vertical movement
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 2) return;
    onDateChange(addDays(selectedDate, dx < 0 ? 1 : -1));
  };

  return (
    <header
      className="flex items-center justify-between py-2 pb-4"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <h1 className="text-lg font-bold text-text tracking-tight">
        {formatDateLabel(selectedDate)}
      </h1>
      <div className="flex gap-2">
        {onSettingsTap && (
          <button
            onClick={onSettingsTap}
            className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-text-secondary active:bg-border transition-colors"
            aria-label="Calendar settings"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        )}
        <button
          onClick={() => onDateChange(addDays(selectedDate, -1))}
          className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-text-secondary active:bg-border transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          onClick={() => onDateChange(addDays(selectedDate, 1))}
          className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-text-secondary active:bg-border transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </header>
  );
}
