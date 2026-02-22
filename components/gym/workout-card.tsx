"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { WorkoutSummary } from "@/types";

const MUSCLE_COLORS: Record<string, string> = {
  chest: "bg-blue-500/20 text-blue-300",
  back: "bg-green-500/20 text-green-300",
  legs: "bg-orange-500/20 text-orange-300",
  shoulders: "bg-purple-500/20 text-purple-300",
  arms: "bg-pink-500/20 text-pink-300",
  core: "bg-yellow-500/20 text-yellow-300",
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const d = new Date(dateStr + "T00:00:00");
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

interface WorkoutCardProps {
  workout: WorkoutSummary;
}

export function WorkoutCard({ workout }: WorkoutCardProps) {
  return (
    <Link href={`/gym/${workout.id}`} className="block">
      <div className="rounded-xl border border-border bg-surface p-4 hover:bg-surface-2 transition-colors active:scale-[0.99]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[12px] text-text-muted font-medium">
                {formatDate(workout.date)}
              </span>
              {workout.durationMin && (
                <span className="text-[11px] text-text-muted">
                  · {workout.durationMin}m
                </span>
              )}
            </div>
            <p className="text-[15px] font-semibold text-text truncate">
              {workout.name ?? "Workout"}
            </p>
            {workout.topExercises.length > 0 && (
              <p className="text-[13px] text-text-secondary mt-0.5 truncate">
                {workout.topExercises.join(" · ")}
                {workout.topExercises.length < (workout.muscleGroups.length > 0 ? 1 : 0) && " · …"}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {workout.totalVolume > 0 && (
              <span className="text-[12px] font-semibold text-text-secondary whitespace-nowrap">
                {workout.totalVolume.toLocaleString()} lbs
              </span>
            )}
            <div className="flex gap-1 flex-wrap justify-end">
              {workout.muscleGroups.slice(0, 2).map((mg) => (
                <span
                  key={mg}
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full",
                    MUSCLE_COLORS[mg] ?? "bg-surface-2 text-text-muted"
                  )}
                >
                  {mg}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
