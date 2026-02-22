"use client";

import { useState, useCallback, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HabitItem } from "./habit-item";
import { HabitEditor } from "./habit-editor";
import { getLocalToday } from "@/lib/utils";
import type { HabitWithCompletion } from "@/types";

interface HabitListProps {
  initialHabits: HabitWithCompletion[];
}

export function HabitList({ initialHabits }: HabitListProps) {
  const [habits, setHabits] = useState<HabitWithCompletion[]>(initialHabits);
  const [editorOpen, setEditorOpen] = useState(false);
  const [, startTransition] = useTransition();

  const today = getLocalToday();

  const doneCount = habits.filter((h) => h.completion?.completed).length;
  const total = habits.length;
  const allDone = total > 0 && doneCount === total;

  const handleToggle = useCallback(
    async (habitId: string, completed: boolean) => {
      // Optimistic update
      setHabits((prev) =>
        prev.map((h) => {
          if (h.id !== habitId) return h;
          return {
            ...h,
            streak: completed
              ? h.streak === 0
                ? 1
                : h.streak
              : Math.max(0, h.streak - 1),
            completion: h.completion
              ? { ...h.completion, completed, completedAt: completed ? new Date() : null }
              : {
                  id: "optimistic",
                  habitId,
                  date: today,
                  completed,
                  completedAt: completed ? new Date() : null,
                },
          };
        })
      );

      try {
        await fetch("/api/habits/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ habitId, date: today, completed }),
        });
      } catch {
        // Revert on error
        setHabits((prev) =>
          prev.map((h) => {
            if (h.id !== habitId) return h;
            return {
              ...h,
              completion: h.completion
                ? { ...h.completion, completed: !completed }
                : null,
            };
          })
        );
      }
    },
    [today]
  );

  const handleAdd = useCallback(async (label: string, emoji: string) => {
    const res = await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, emoji }),
    });
    if (!res.ok) return;
    const newHabit = await res.json();
    startTransition(() => {
      setHabits((prev) => [
        ...prev,
        { ...newHabit, completion: null, streak: 0 },
      ]);
    });
  }, []);

  const handleDelete = useCallback(async (habitId: string) => {
    // Optimistic remove
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    try {
      await fetch(`/api/habits/${habitId}`, { method: "DELETE" });
    } catch {
      // Could revert here, but deletion is usually fine
    }
  }, []);

  const handleReorder = useCallback(
    async (habitId: string, direction: "up" | "down") => {
      const idx = habits.findIndex((h) => h.id === habitId);
      if (idx === -1) return;
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= habits.length) return;

      const newHabits = [...habits];
      [newHabits[idx], newHabits[targetIdx]] = [
        newHabits[targetIdx],
        newHabits[idx],
      ];

      // Update sort orders
      newHabits[idx] = { ...newHabits[idx], sortOrder: idx };
      newHabits[targetIdx] = { ...newHabits[targetIdx], sortOrder: targetIdx };

      setHabits(newHabits);

      // Persist both updated sort orders
      await Promise.all([
        fetch(`/api/habits/${newHabits[idx].id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: idx }),
        }),
        fetch(`/api/habits/${newHabits[targetIdx].id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: targetIdx }),
        }),
      ]);
    },
    [habits]
  );

  return (
    <>
      <section>
        {/* Section header */}
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-text-muted">
            Habits
          </span>
          <div className="flex items-center gap-2">
            {total > 0 && (
              <motion.span
                key={`${doneCount}-${total}`}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                  allDone
                    ? "bg-success/15 text-success"
                    : "bg-surface-2 text-text-secondary"
                }`}
              >
                {allDone ? "✓ All done" : `${doneCount} of ${total}`}
              </motion.span>
            )}
            <button
              onClick={() => setEditorOpen(true)}
              className="w-6 h-6 rounded-full bg-surface-2 flex items-center justify-center text-text-muted hover:text-text transition-colors"
              aria-label="Manage habits"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Habit list or empty state */}
        <AnimatePresence mode="wait">
          {habits.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-border bg-surface p-8 text-center"
            >
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
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                </svg>
              </div>
              <p className="text-text-secondary text-sm font-medium">
                Build your morning routine.
              </p>
              <p className="text-text-muted text-xs mt-1">
                Small daily habits compound into real change.
              </p>
              <button
                onClick={() => setEditorOpen(true)}
                className="mt-4 px-4 py-2 bg-accent text-white rounded-lg text-[13px] font-medium"
              >
                Add First Habit
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              layout
              className={`rounded-xl border overflow-hidden ${
                allDone ? "border-success/30 bg-surface" : "border-border bg-surface"
              }`}
            >
              {habits.map((habit, i) => (
                <HabitItem
                  key={habit.id}
                  habit={habit}
                  onToggle={handleToggle}
                  isLast={i === habits.length - 1}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* All done message */}
        <AnimatePresence>
          {allDone && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ delay: 0.15 }}
              className="mt-3 text-center"
            >
              <p className="text-[13px] text-text-secondary">
                ✦ Perfect morning · keep it up
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <HabitEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        habits={habits}
        onAdd={handleAdd}
        onDelete={handleDelete}
        onReorder={handleReorder}
      />
    </>
  );
}
