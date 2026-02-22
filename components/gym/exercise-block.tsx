"use client";

import { useState } from "react";
import { SetRow, type SetData } from "./set-row";
import type { Exercise } from "@/types";

const MUSCLE_EMOJI: Record<string, string> = {
  chest: "💪",
  back: "🔙",
  legs: "🦵",
  shoulders: "🏋️",
  arms: "💪",
  core: "🔥",
};

interface ExerciseBlockProps {
  workoutId: string;
  exercise: Exercise;
  initialSets?: SetData[];
  historicalMax?: number | null;
  onRemove: () => void;
}

export function ExerciseBlock({
  workoutId,
  exercise,
  initialSets = [],
  historicalMax,
  onRemove,
}: ExerciseBlockProps) {
  const [sets, setSets] = useState<SetData[]>(
    initialSets.length > 0
      ? initialSets
      : [{ setNumber: 1, weightLbs: "", reps: "", saved: false }]
  );

  async function saveSet(index: number, data: { weightLbs: number | null; reps: number | null }) {
    const set = sets[index];

    const res = await fetch("/api/workout-sets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workoutId,
        exerciseId: exercise.id,
        setNumber: set.setNumber,
        weightLbs: data.weightLbs,
        reps: data.reps,
      }),
    });

    if (res.ok) {
      const saved = await res.json();
      setSets((prev) =>
        prev.map((s, i) =>
          i === index ? { ...s, id: saved.id, saved: true, isPR: saved.isPR } : s
        )
      );
    }
  }

  async function deleteSet(index: number) {
    const set = sets[index];
    if (set.id) {
      await fetch(`/api/workout-sets/${set.id}`, { method: "DELETE" });
    }
    setSets((prev) => {
      const next = prev.filter((_, i) => i !== index);
      // Renumber
      return next.map((s, i) => ({ ...s, setNumber: i + 1 }));
    });
  }

  function addSet() {
    setSets((prev) => [
      ...prev,
      { setNumber: prev.length + 1, weightLbs: "", reps: "", saved: false },
    ]);
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {exercise.muscleGroup && (
            <span className="text-[16px]">{MUSCLE_EMOJI[exercise.muscleGroup] ?? "•"}</span>
          )}
          <div>
            <p className="text-[15px] font-semibold text-text">{exercise.name}</p>
            {historicalMax && (
              <p className="text-[11px] text-text-muted">
                Best: {historicalMax} lbs
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onRemove}
          className="text-[13px] text-text-muted hover:text-danger transition-colors px-2 py-1"
        >
          Remove
        </button>
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-2 mb-2 px-0">
        <div className="w-6" />
        <div className="flex-1 text-center text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          Weight
        </div>
        <div className="w-8" />
        <div className="flex-1 text-center text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          Reps
        </div>
        <div className="w-[38px]" />
        <div className="w-10" />
      </div>

      {/* Sets */}
      <div className="space-y-2">
        {sets.map((set, i) => (
          <SetRow
            key={i}
            set={set}
            prevWeight={historicalMax}
            onSave={(data) => saveSet(i, data)}
            onDelete={() => deleteSet(i)}
          />
        ))}
      </div>

      {/* Add set */}
      <button
        onClick={addSet}
        className="mt-3 w-full text-[13px] font-medium text-text-secondary hover:text-text border border-dashed border-border rounded-[8px] py-2 transition-colors"
      >
        + Add set
      </button>
    </div>
  );
}
