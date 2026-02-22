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
          <div className="rounded-xl border border-border bg-surface p-8 text-center">
            <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center mx-auto mb-3">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-text-muted"
              >
                <path d="M6.5 6.5h11M6.5 17.5h11" />
                <path d="M4 9v6M20 9v6" />
                <path d="M2 10v4M22 10v4" />
                <line x1="12" y1="6.5" x2="12" y2="17.5" />
              </svg>
            </div>
            <p className="text-text-secondary text-sm font-medium">
              No workouts logged yet.
            </p>
            <p className="text-text-muted text-xs mt-1">
              Your training history will appear here.
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
