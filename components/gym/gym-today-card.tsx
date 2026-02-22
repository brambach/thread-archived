"use client";

import Link from "next/link";
import type { WorkoutSummary } from "@/types";

interface GymTodayCardProps {
  todayWorkout: WorkoutSummary | null;
}

export function GymTodayCard({ todayWorkout }: GymTodayCardProps) {
  if (!todayWorkout) {
    return (
      <Link href="/gym/log" className="block">
        <div className="rounded-xl border border-border border-l-[3px] border-l-text-muted bg-surface p-3.5 px-4 hover:bg-surface-2 transition-colors active:scale-[0.99]">
          <p className="text-[15px] font-semibold text-text">
            No workout logged today
          </p>
          <p className="text-[13px] text-text-secondary mt-1">
            Tap to log a workout
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/gym/${todayWorkout.id}`} className="block">
      <div className="rounded-xl border border-border border-l-[3px] border-l-success bg-surface p-3.5 px-4 hover:bg-surface-2 transition-colors active:scale-[0.99]">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-text">
              {todayWorkout.name ?? "Workout"}
            </p>
            {todayWorkout.topExercises.length > 0 && (
              <p className="text-[13px] text-text-secondary mt-0.5 truncate">
                {todayWorkout.topExercises.join(" · ")}
              </p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[12px] font-semibold text-success">Done ✓</p>
            {todayWorkout.totalVolume > 0 && (
              <p className="text-[11px] text-text-muted mt-0.5">
                {todayWorkout.totalVolume.toLocaleString()} lbs
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
