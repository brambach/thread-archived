"use client";

import { cn } from "@/lib/utils";

interface MonthlyHeatmapProps {
  workoutDates: string[]; // YYYY-MM-DD
}

export function MonthlyHeatmap({ workoutDates }: MonthlyHeatmapProps) {
  const dateSet = new Set(workoutDates);

  // Build last 70 days (10 weeks) grid
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start from 10 weeks ago, aligned to Sunday
  const start = new Date(today);
  start.setDate(start.getDate() - 69);
  // Align to Sunday
  const dayOfWeek = start.getDay();
  start.setDate(start.getDate() - dayOfWeek);

  const weeks: { date: string; inRange: boolean }[][] = [];
  const cursor = new Date(start);

  while (cursor <= today) {
    const week: { date: string; inRange: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = cursor.toISOString().split("T")[0];
      const inRange = cursor <= today;
      week.push({ date: dateStr, inRange });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div>
      {/* Day labels */}
      <div className="flex gap-1 mb-1 pl-0">
        {dayLabels.map((d, i) => (
          <div
            key={i}
            className="w-[30px] text-center text-[10px] text-text-muted font-medium"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid — rows are weeks, columns are days */}
      <div className="flex gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map(({ date, inRange }) => {
              const hasWorkout = inRange && dateSet.has(date);
              const isToday = date === today.toISOString().split("T")[0];
              const isFuture = !inRange || date > today.toISOString().split("T")[0];

              return (
                <div
                  key={date}
                  title={date}
                  className={cn(
                    "w-[30px] h-[30px] rounded-[5px] transition-colors",
                    isFuture && "opacity-0 pointer-events-none",
                    !isFuture && !hasWorkout && "bg-surface-2",
                    hasWorkout && "bg-accent",
                    isToday && !hasWorkout && "border border-border ring-1 ring-text-muted/30",
                    isToday && hasWorkout && "ring-2 ring-accent/50"
                  )}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
