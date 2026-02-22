"use client";

import { useState, useEffect } from "react";
import { ProgressChart } from "./progress-chart";
import { cn } from "@/lib/utils";
import type { Exercise, ExerciseHistory } from "@/types";

const MUSCLE_GROUP_ORDER = ["chest", "back", "legs", "shoulders", "arms", "core"];

interface ProgressData {
  exercise: Exercise;
  history: ExerciseHistory[];
  pr: number | null;
}

interface ProgressViewProps {
  exercises: Exercise[];
}

export function ProgressView({ exercises }: ProgressViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(false);
  const [metric, setMetric] = useState<"maxWeight" | "totalVolume">("maxWeight");

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    setData(null);
    fetch(`/api/exercises/${selectedId}/history`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [selectedId]);

  // Group exercises by muscle group for the selector
  const grouped = MUSCLE_GROUP_ORDER.reduce(
    (acc, mg) => {
      const items = exercises.filter((e) => e.muscleGroup === mg);
      if (items.length) acc[mg] = items;
      return acc;
    },
    {} as Record<string, Exercise[]>
  );

  const ungrouped = exercises.filter(
    (e) => !e.muscleGroup || !MUSCLE_GROUP_ORDER.includes(e.muscleGroup)
  );
  if (ungrouped.length) grouped["other"] = ungrouped;

  return (
    <div className="space-y-5">
      {/* Exercise selector */}
      <div>
        <label className="text-[11px] font-semibold tracking-wider uppercase text-text-muted block mb-2">
          Select exercise
        </label>
        <select
          value={selectedId ?? ""}
          onChange={(e) => setSelectedId(e.target.value || null)}
          className="w-full bg-surface border border-border rounded-[10px] px-3.5 py-3 text-[15px] text-text outline-none focus:border-accent/50 transition-colors appearance-none"
        >
          <option value="">Choose an exercise…</option>
          {Object.entries(grouped).map(([mg, items]) => (
            <optgroup
              key={mg}
              label={mg === "other" ? "Other" : mg.charAt(0).toUpperCase() + mg.slice(1)}
            >
              {items.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Progress card */}
      {selectedId && (
        <div className="rounded-xl border border-border bg-surface p-4 space-y-4">
          {loading && (
            <div className="py-8 text-center">
              <p className="text-[13px] text-text-muted">Loading…</p>
            </div>
          )}

          {!loading && data && (
            <>
              {/* PR badge */}
              {data.pr !== null ? (
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-[11px] font-semibold tracking-wider uppercase text-text-muted">
                      Personal Record
                    </p>
                    <p className="text-[28px] font-bold text-warning leading-tight">
                      {data.pr} lbs
                    </p>
                  </div>
                  <div className="text-[36px]">🏆</div>
                </div>
              ) : (
                <div className="rounded-[10px] bg-surface-2 p-3 text-center">
                  <p className="text-[13px] text-text-secondary">
                    No data yet for {data.exercise.name}.
                  </p>
                  <p className="text-[12px] text-text-muted mt-0.5">
                    Log a set to start tracking.
                  </p>
                </div>
              )}

              {/* Metric toggle */}
              {data.history.length > 0 && (
                <>
                  <div className="flex rounded-[8px] bg-surface-2 p-0.5">
                    {(["maxWeight", "totalVolume"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setMetric(m)}
                        className={cn(
                          "flex-1 text-[13px] font-medium rounded-[6px] py-1.5 transition-all",
                          metric === m
                            ? "bg-surface text-text shadow-sm"
                            : "text-text-secondary hover:text-text"
                        )}
                      >
                        {m === "maxWeight" ? "Max Weight" : "Volume"}
                      </button>
                    ))}
                  </div>

                  {/* Chart */}
                  <ProgressChart history={data.history} metric={metric} />

                  {/* Recent sets table */}
                  <div>
                    <p className="text-[11px] font-semibold tracking-wider uppercase text-text-muted mb-2">
                      Recent sessions
                    </p>
                    <div className="space-y-1.5">
                      {data.history
                        .slice()
                        .reverse()
                        .slice(0, 5)
                        .map((entry, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between text-[13px]"
                          >
                            <span className="text-text-secondary">
                              {new Date(entry.date + "T12:00:00").toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-text-muted">
                                {entry.sets.length} set{entry.sets.length !== 1 ? "s" : ""}
                              </span>
                              {entry.maxWeight && (
                                <span className="text-text font-medium">
                                  {entry.maxWeight} lbs
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {!selectedId && (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="text-[15px] text-text-secondary">Select an exercise above</p>
          <p className="text-[13px] text-text-muted mt-1">
            to see your PR and weight-over-time chart.
          </p>
        </div>
      )}
    </div>
  );
}
