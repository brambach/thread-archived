"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Exercise } from "@/types";

const MUSCLE_GROUP_ORDER = ["chest", "back", "legs", "shoulders", "arms", "core"];

const MUSCLE_EMOJI: Record<string, string> = {
  chest: "💪",
  back: "🔙",
  legs: "🦵",
  shoulders: "🏋️",
  arms: "💪",
  core: "🔥",
};

interface ExercisePickerProps {
  exercises: Exercise[];
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

export function ExercisePicker({ exercises, onSelect, onClose }: ExercisePickerProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = query.trim()
    ? exercises.filter((e) =>
        e.name.toLowerCase().includes(query.toLowerCase()) ||
        e.muscleGroup?.toLowerCase().includes(query.toLowerCase())
      )
    : exercises;

  // Group by muscle group
  const grouped = MUSCLE_GROUP_ORDER.reduce(
    (acc, mg) => {
      const items = filtered.filter((e) => e.muscleGroup === mg);
      if (items.length) acc[mg] = items;
      return acc;
    },
    {} as Record<string, Exercise[]>
  );

  // Custom exercises without muscle group
  const ungrouped = filtered.filter((e) => !e.muscleGroup || !MUSCLE_GROUP_ORDER.includes(e.muscleGroup));
  if (ungrouped.length) grouped["other"] = ungrouped;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col bg-bg"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-[env(safe-area-inset-top)] pt-4 pb-3 border-b border-border">
        <button
          onClick={onClose}
          className="text-[15px] text-text-secondary hover:text-text transition-colors py-1"
        >
          Cancel
        </button>
        <h2 className="flex-1 text-center text-[16px] font-semibold text-text">
          Add Exercise
        </h2>
        <div className="w-16" />
      </div>

      {/* Search */}
      <div className="px-5 py-3 border-b border-border">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises…"
          className="w-full bg-surface-2 rounded-[8px] px-3.5 py-2.5 text-[15px] text-text placeholder:text-text-muted outline-none border border-border focus:border-accent/50 transition-colors"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-5 py-3">
        {Object.keys(grouped).length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-text-secondary text-[15px]">No exercises found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([mg, items]) => (
              <div key={mg}>
                <p className="text-[11px] font-semibold tracking-wider uppercase text-text-muted mb-2 flex items-center gap-1.5">
                  <span>{MUSCLE_EMOJI[mg] ?? "•"}</span>
                  {mg === "other" ? "Other" : mg.charAt(0).toUpperCase() + mg.slice(1)}
                </p>
                <div className="space-y-1">
                  {items.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => onSelect(ex)}
                      className="w-full text-left px-3.5 py-3 rounded-[10px] bg-surface hover:bg-surface-2 border border-border transition-colors active:scale-[0.99] flex items-center justify-between"
                    >
                      <span className="text-[15px] text-text font-medium">{ex.name}</span>
                      {ex.isCustom && (
                        <span className="text-[10px] text-text-muted bg-surface-2 px-1.5 py-0.5 rounded-full">
                          custom
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
