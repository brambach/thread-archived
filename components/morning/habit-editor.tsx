"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { HabitWithCompletion } from "@/types";

const DEFAULT_HABITS = [
  { label: "Gone outside", emoji: "🌤️" },
  { label: "Took meds", emoji: "💊" },
  { label: "Gym", emoji: "🏋️" },
  { label: "Read", emoji: "📖" },
  { label: "Meditated", emoji: "🧘" },
  { label: "Cold shower", emoji: "🚿" },
];

interface HabitEditorProps {
  open: boolean;
  onClose: () => void;
  habits: HabitWithCompletion[];
  onAdd: (label: string, emoji: string) => Promise<void>;
  onDelete: (habitId: string) => Promise<void>;
  onReorder: (habitId: string, direction: "up" | "down") => Promise<void>;
}

export function HabitEditor({
  open,
  onClose,
  habits,
  onAdd,
  onDelete,
  onReorder,
}: HabitEditorProps) {
  const [label, setLabel] = useState("");
  const [emoji, setEmoji] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 350);
    } else {
      setLabel("");
      setEmoji("");
    }
  }, [open]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim() || adding) return;
    setAdding(true);
    try {
      await onAdd(label.trim(), emoji.trim());
      setLabel("");
      setEmoji("");
    } finally {
      setAdding(false);
    }
  }

  async function handleSeedDefault(item: { label: string; emoji: string }) {
    if (adding) return;
    setAdding(true);
    try {
      await onAdd(item.label, item.emoji);
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    if (deletingId) return;
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  }

  // Which default habits haven't been added yet
  const existingLabels = new Set(habits.map((h) => h.label.toLowerCase()));
  const availableDefaults = DEFAULT_HABITS.filter(
    (d) => !existingLabels.has(d.label.toLowerCase())
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-surface rounded-t-2xl max-h-[80dvh]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-9 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-2 pb-4 flex-shrink-0">
              <h2 className="text-[17px] font-semibold text-text">
                Manage Habits
              </h2>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-surface-2 flex items-center justify-center text-text-secondary"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              {/* Add habit form */}
              <form onSubmit={handleAdd} className="flex gap-2 mb-5">
                <input
                  ref={inputRef}
                  type="text"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  placeholder="✨"
                  maxLength={2}
                  className="w-12 shrink-0 rounded-lg border border-border bg-surface-2 px-2 py-2.5 text-center text-base text-text placeholder-text-muted focus:outline-none focus:border-accent"
                />
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="New habit…"
                  className="flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-[15px] text-text placeholder-text-muted focus:outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  disabled={!label.trim() || adding}
                  className={cn(
                    "rounded-lg px-4 py-2.5 text-[15px] font-medium transition-colors shrink-0",
                    label.trim()
                      ? "bg-accent text-white"
                      : "bg-surface-2 text-text-muted"
                  )}
                >
                  Add
                </button>
              </form>

              {/* Existing habits */}
              {habits.length > 0 && (
                <div className="mb-5">
                  <p className="text-[11px] font-semibold tracking-wider uppercase text-text-muted mb-2">
                    Your habits
                  </p>
                  <div className="rounded-xl border border-border overflow-hidden">
                    {habits.map((habit, i) => (
                      <div
                        key={habit.id}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3",
                          i < habits.length - 1 && "border-b border-border"
                        )}
                      >
                        {/* Reorder buttons */}
                        <div className="flex flex-col gap-0.5 flex-shrink-0">
                          <button
                            onClick={() => onReorder(habit.id, "up")}
                            disabled={i === 0}
                            className="text-text-muted disabled:opacity-20 p-0.5"
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            >
                              <polyline points="18 15 12 9 6 15" />
                            </svg>
                          </button>
                          <button
                            onClick={() => onReorder(habit.id, "down")}
                            disabled={i === habits.length - 1}
                            className="text-text-muted disabled:opacity-20 p-0.5"
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            >
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </button>
                        </div>

                        {habit.emoji && (
                          <span className="text-base flex-shrink-0">
                            {habit.emoji}
                          </span>
                        )}
                        <span className="flex-1 text-[15px] text-text truncate">
                          {habit.label}
                        </span>

                        <button
                          onClick={() => handleDelete(habit.id)}
                          disabled={deletingId === habit.id}
                          className="text-danger/60 hover:text-danger transition-colors p-1 -mr-1 flex-shrink-0"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4h6v2" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested defaults */}
              {availableDefaults.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold tracking-wider uppercase text-text-muted mb-2">
                    Suggestions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableDefaults.map((d) => (
                      <button
                        key={d.label}
                        onClick={() => handleSeedDefault(d)}
                        className="flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-[13px] text-text-secondary hover:border-accent hover:text-accent transition-colors"
                      >
                        <span>{d.emoji}</span>
                        <span>{d.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
