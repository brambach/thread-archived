"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ExerciseBlock } from "./exercise-block";
import { ExercisePicker } from "./exercise-picker";
import { cn } from "@/lib/utils";
import type { Exercise } from "@/types";

interface SetData {
  id: string;
  setNumber: number;
  weightLbs: string | null;
  reps: number | null;
}

interface ExerciseBlockData {
  exercise: Exercise;
  sets: SetData[];
}

interface WorkoutDetailProps {
  workout: {
    id: string;
    date: string;
    name: string | null;
    durationMin: number | null;
    totalVolume: number;
    exerciseBlocks: ExerciseBlockData[];
  };
  allExercises: Exercise[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function WorkoutDetail({ workout, allExercises }: WorkoutDetailProps) {
  const router = useRouter();
  const [blocks, setBlocks] = useState<ExerciseBlockData[]>(workout.exerciseBlocks);
  const [showPicker, setShowPicker] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function addExercise(exercise: Exercise) {
    setShowPicker(false);
    if (blocks.some((b) => b.exercise.id === exercise.id)) return;
    setBlocks((prev) => [...prev, { exercise, sets: [] }]);
  }

  function removeExercise(exerciseId: string) {
    setBlocks((prev) => prev.filter((b) => b.exercise.id !== exerciseId));
  }

  async function deleteWorkout() {
    setDeleting(true);
    await fetch(`/api/workouts/${workout.id}`, { method: "DELETE" });
    router.push("/gym");
  }

  return (
    <div className="pt-2 pb-6">
      {/* Header */}
      <header className="py-2 pb-5">
        <div className="flex items-center gap-3 mb-3">
          <Link
            href="/gym"
            className="text-[15px] text-text-secondary hover:text-text transition-colors"
          >
            ← Gym
          </Link>
        </div>
        <h1 className="text-[24px] font-bold tracking-tight text-text leading-tight">
          {workout.name ?? "Workout"}
        </h1>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-sm text-text-secondary">{formatDate(workout.date)}</p>
          {workout.durationMin && (
            <span className="text-[12px] text-text-muted">· {workout.durationMin}m</span>
          )}
          {workout.totalVolume > 0 && (
            <span className="text-[12px] text-text-muted">
              · {workout.totalVolume.toLocaleString()} lbs
            </span>
          )}
        </div>
      </header>

      {/* Exercise blocks */}
      <div className="space-y-3 mb-4">
        {blocks.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-[15px] text-text-secondary">No exercises logged.</p>
          </div>
        )}
        {blocks.map((block) => (
          <ExerciseBlock
            key={block.exercise.id}
            workoutId={workout.id}
            exercise={block.exercise}
            initialSets={block.sets.map((s) => ({
              id: s.id,
              setNumber: s.setNumber,
              weightLbs: s.weightLbs ?? "",
              reps: s.reps !== null ? String(s.reps) : "",
              saved: true,
            }))}
            onRemove={() => removeExercise(block.exercise.id)}
          />
        ))}
      </div>

      {/* Add exercise */}
      <button
        onClick={() => setShowPicker(true)}
        className="w-full border border-border rounded-[12px] py-3 text-[14px] font-semibold text-text-secondary hover:text-text hover:border-accent/40 transition-colors mb-6"
      >
        + Add Exercise
      </button>

      {/* Delete */}
      <button
        onClick={deleteWorkout}
        disabled={deleting}
        className={cn(
          "w-full text-[14px] transition-colors py-2",
          deleting ? "text-text-muted" : "text-danger/70 hover:text-danger"
        )}
      >
        {deleting ? "Deleting…" : "Delete workout"}
      </button>

      <AnimatePresence>
        {showPicker && (
          <ExercisePicker
            exercises={allExercises}
            onSelect={addExercise}
            onClose={() => setShowPicker(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
