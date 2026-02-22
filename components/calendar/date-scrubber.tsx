"use client";

interface DateScrubberProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function formatDateLabel(dateStr: string): string {
  const today = new Date().toISOString().split("T")[0];
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

export function DateScrubber({ selectedDate, onDateChange }: DateScrubberProps) {
  return (
    <header className="flex items-center justify-between py-2 pb-4">
      <h1 className="text-lg font-bold text-text tracking-tight">
        {formatDateLabel(selectedDate)}
      </h1>
      <div className="flex gap-2">
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
