"use client";

import Link from "next/link";
import { MonthlyHeatmap } from "./monthly-heatmap";
import { WorkoutCard } from "./workout-card";
import type { WorkoutSummary } from "@/types";

interface GymOverviewProps {
  workoutDates: string[];
  recentWorkouts: WorkoutSummary[];
  thisMonthCount: number;
}

export function GymOverview({ workoutDates, recentWorkouts, thisMonthCount }: GymOverviewProps) {
  const now = new Date();
  const monthName = now.toLocaleDateString("en-US", { month: "long" });

  return (
    <div className="space-y-6">
      {/* Log workout CTA */}
      <Link
        href="/gym/log"
        className="block w-full rounded-xl bg-accent/10 border border-accent/30 p-4 text-center hover:bg-accent/15 transition-colors active:scale-[0.99]"
      >
        <span className="text-[15px] font-semibold text-accent">
          + Log a workout
        </span>
      </Link>

      {/* Heatmap */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-text-muted">
            Activity
          </span>
          <span className="text-[12px] text-text-secondary">
            {thisMonthCount} session{thisMonthCount !== 1 ? "s" : ""} in {monthName}
          </span>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 overflow-x-auto">
          <MonthlyHeatmap workoutDates={workoutDates} />
        </div>
      </section>

      {/* Recent workouts */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-text-muted">
            Recent
          </span>
          <Link
            href="/gym/progress"
            className="text-[12px] text-accent hover:text-accent/80 transition-colors"
          >
            View progress →
          </Link>
        </div>

        {recentWorkouts.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-6 text-center">
            <p className="text-[15px] text-text-secondary">No workouts logged yet.</p>
            <p className="text-[13px] text-text-muted mt-1">
              Tap &ldquo;Log a workout&rdquo; to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentWorkouts.map((w) => (
              <WorkoutCard key={w.id} workout={w} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
