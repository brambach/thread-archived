"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { ExerciseBlock } from "./exercise-block";
import { ExercisePicker } from "./exercise-picker";
import { cn, getLocalToday } from "@/lib/utils";
import type { Exercise } from "@/types";

interface WorkoutExercise {
  exercise: Exercise;
  historicalMax: number | null;
}

interface WorkoutLoggerProps {
  exercises: Exercise[];
}

function useElapsedTime(startTime: Date | null) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function WorkoutLogger({ exercises }: WorkoutLoggerProps) {
  const router = useRouter();
  const [workoutId, setWorkoutId] = useState<string | null>(null);
  const [workoutName, setWorkoutName] = useState("");
  const [startTime] = useState<Date>(new Date());
  const [started, setStarted] = useState(false);
  const [exerciseBlocks, setExerciseBlocks] = useState<WorkoutExercise[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const elapsed = useElapsedTime(started ? startTime : null);

  async function startWorkout() {
    const res = await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: workoutName.trim() || null,
        date: getLocalToday(),
      }),
    });
    if (res.ok) {
      const workout = await res.json();
      setWorkoutId(workout.id);
      setStarted(true);
    }
  }

  async function addExercise(exercise: Exercise) {
    setShowPicker(false);

    // Get historical max for this exercise
    const res = await fetch(`/api/exercises/${exercise.id}/history`);
    let historicalMax: number | null = null;
    if (res.ok) {
      const data = await res.json();
      historicalMax = data.pr ?? null;
    }

    setExerciseBlocks((prev) => {
      if (prev.some((b) => b.exercise.id === exercise.id)) return prev;
      return [...prev, { exercise, historicalMax }];
    });
  }

  function removeExercise(exerciseId: string) {
    setExerciseBlocks((prev) => prev.filter((b) => b.exercise.id !== exerciseId));
  }

  async function finishWorkout() {
    if (!workoutId) return;
    setFinishing(true);

    // Update name and duration
    const durationMin = Math.floor(
      (Date.now() - startTime.getTime()) / 60000
    );
    await fetch(`/api/workouts/${workoutId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: workoutName.trim() || null,
        durationMin: durationMin > 0 ? durationMin : null,
      }),
    });

    router.push("/gym");
  }

  async function discardWorkout() {
    if (workoutId) {
      await fetch(`/api/workouts/${workoutId}`, { method: "DELETE" });
    }
    router.push("/gym");
  }

  // Pre-start screen
  if (!started) {
    return (
      <div className="pt-2 pb-6">
        <header className="py-2 pb-5 flex items-center justify-between">
          <h1 className="text-[26px] font-bold tracking-tight text-text leading-tight">
            New Workout
          </h1>
          <button
            onClick={() => router.push("/gym")}
            className="text-[15px] text-text-secondary hover:text-text transition-colors"
          >
            Cancel
          </button>
        </header>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold tracking-wider uppercase text-text-muted block mb-2">
              Workout name (optional)
            </label>
            <input
              ref={nameRef}
              type="text"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              placeholder="Push Day, Leg Day, Upper…"
              className="w-full bg-surface border border-border rounded-[10px] px-4 py-3 text-[15px] text-text placeholder:text-text-muted outline-none focus:border-accent/50 transition-colors"
              onKeyDown={(e) => e.key === "Enter" && startWorkout()}
            />
          </div>

          <button
            onClick={startWorkout}
            className="w-full bg-accent text-bg font-semibold text-[15px] rounded-[12px] py-3.5 hover:bg-accent/90 transition-colors active:scale-[0.99]"
          >
            Start Workout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-2 pb-6">
      {/* Header */}
      <header className="py-2 pb-4">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="min-w-0">
            <input
              type="text"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              placeholder="Workout"
              className="text-[22px] font-bold tracking-tight text-text leading-tight bg-transparent outline-none border-none w-full placeholder:text-text-muted"
            />
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[13px] font-mono text-text-secondary">{elapsed}</p>
          </div>
        </div>
        <p className="text-sm text-text-secondary">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </header>

      {/* Exercise blocks */}
      <div className="space-y-3 mb-4">
        {exerciseBlocks.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-[15px] text-text-secondary">No exercises yet.</p>
            <p className="text-[13px] text-text-muted mt-1">Tap below to add your first exercise.</p>
          </div>
        )}
        {exerciseBlocks.map((block) => (
          <ExerciseBlock
            key={block.exercise.id}
            workoutId={workoutId!}
            exercise={block.exercise}
            historicalMax={block.historicalMax}
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

      {/* Finish / Discard */}
      <div className="space-y-2">
        <button
          onClick={finishWorkout}
          disabled={finishing}
          className={cn(
            "w-full bg-accent text-bg font-semibold text-[15px] rounded-[12px] py-3.5 transition-colors active:scale-[0.99]",
            finishing ? "opacity-60" : "hover:bg-accent/90"
          )}
        >
          {finishing ? "Saving…" : "Finish Workout"}
        </button>
        <button
          onClick={discardWorkout}
          className="w-full text-[14px] text-danger/70 hover:text-danger transition-colors py-2"
        >
          Discard workout
        </button>
      </div>

      {/* Exercise picker */}
      <AnimatePresence>
        {showPicker && (
          <ExercisePicker
            exercises={exercises}
            onSelect={addExercise}
            onClose={() => setShowPicker(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
