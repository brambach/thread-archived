"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { TimeBlock, Task } from "@/types";

const COLOR_OPTIONS = [
  { key: "accent", label: "Purple", className: "bg-accent" },
  { key: "success", label: "Green", className: "bg-success" },
  { key: "warning", label: "Amber", className: "bg-warning" },
  { key: "danger", label: "Red", className: "bg-danger" },
];

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

interface BlockEditorProps {
  block: TimeBlock | null;
  task: Task | null;
  onClose: () => void;
  onUpdate: (blockId: string, updates: Partial<TimeBlock>) => void;
  onDelete: (blockId: string) => void;
  onUnlinkTask: (taskId: string) => void;
}

export function BlockEditor({
  block,
  task,
  onClose,
  onUpdate,
  onDelete,
  onUnlinkTask,
}: BlockEditorProps) {
  const [label, setLabel] = useState("");
  const [color, setColor] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (block) {
      setLabel(block.label || "");
      setColor(block.color || "accent");
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [block]);

  if (!block) return null;

  return (
    <AnimatePresence>
      {block && (
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
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-surface rounded-t-2xl"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-9 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-2 pb-4">
              <h2 className="text-[17px] font-semibold text-text">
                Edit Block
              </h2>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-surface-2 flex items-center justify-center text-text-secondary"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              {/* Time display */}
              <p className="text-[12px] font-mono text-text-secondary mb-4">
                {formatTime(block.startTime)} – {formatTime(block.endTime)}
              </p>

              {/* Label */}
              <input
                ref={inputRef}
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Label (optional)"
                className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-[15px] text-text placeholder-text-muted focus:outline-none focus:border-accent mb-4"
                onBlur={() => {
                  if (label !== (block.label || "")) {
                    onUpdate(block.id, { label: label || null });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onUpdate(block.id, { label: label || null, color });
                  }
                }}
              />

              {/* Color picker */}
              <p className="text-[11px] font-semibold tracking-wider uppercase text-text-muted mb-2">
                Color
              </p>
              <div className="flex gap-3 mb-5">
                {COLOR_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => {
                      setColor(opt.key);
                      onUpdate(block.id, { color: opt.key });
                    }}
                    className={cn(
                      "w-7 h-7 rounded-full transition-all",
                      opt.className,
                      color === opt.key
                        ? "ring-2 ring-offset-2 ring-offset-surface scale-110"
                        : "opacity-50"
                    )}
                    style={
                      color === opt.key
                        ? { "--tw-ring-color": "currentColor" } as React.CSSProperties
                        : undefined
                    }
                    aria-label={opt.label}
                  />
                ))}
              </div>

              {/* Assigned task */}
              {task && (
                <div className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 flex items-center justify-between mb-5">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold tracking-wider uppercase text-text-muted mb-0.5">
                      Linked Task
                    </p>
                    <p className="text-[14px] text-text truncate">{task.title}</p>
                  </div>
                  <button
                    onClick={() => onUnlinkTask(task.id)}
                    className="text-[12px] text-danger/70 hover:text-danger font-medium ml-3 flex-shrink-0"
                  >
                    Unlink
                  </button>
                </div>
              )}

              {/* Delete */}
              <button
                onClick={() => onDelete(block.id)}
                className="w-full rounded-lg border border-danger/20 bg-danger/[0.08] py-2.5 text-[14px] font-medium text-danger transition-colors active:bg-danger/20"
              >
                Delete Block
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
