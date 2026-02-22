"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { HabitWithCompletion } from "@/types";

interface HabitItemProps {
  habit: HabitWithCompletion;
  onToggle: (habitId: string, completed: boolean) => void;
  isLast?: boolean;
}

export function HabitItem({ habit, onToggle, isLast }: HabitItemProps) {
  const isCompleted = habit.completion?.completed ?? false;

  return (
    <motion.button
      layout
      onClick={() => onToggle(habit.id, !isCompleted)}
      className={cn(
        "w-full flex items-center gap-3.5 px-4 py-3.5 text-left transition-colors duration-150 active:bg-surface-2",
        !isLast && "border-b border-border"
      )}
    >
      {/* Animated Checkbox */}
      <div className="relative flex-shrink-0">
        <motion.div
          className={cn(
            "w-[22px] h-[22px] rounded-[6px] border-[1.5px] flex items-center justify-center transition-colors duration-200",
            isCompleted
              ? "bg-accent border-accent"
              : "bg-transparent border-border"
          )}
          animate={isCompleted ? { scale: [1, 0.88, 1.05, 1] } : { scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <AnimatePresence>
            {isCompleted && (
              <motion.svg
                key="check"
                width="12"
                height="9"
                viewBox="0 0 12 9"
                fill="none"
                initial={{ opacity: 0, pathLength: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.path
                  d="M1 4L4.5 7.5L11 1"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                />
              </motion.svg>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Emoji + Label */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        {habit.emoji && (
          <span className="text-base leading-none flex-shrink-0">
            {habit.emoji}
          </span>
        )}
        <span
          className={cn(
            "text-[15px] font-medium leading-snug transition-colors duration-200 truncate",
            isCompleted ? "text-text-muted line-through" : "text-text"
          )}
        >
          {habit.label}
        </span>
      </div>

      {/* Streak badge */}
      {habit.streak > 1 && (
        <div className="flex-shrink-0 flex items-center gap-1">
          <span className="text-[11px] text-text-muted font-mono">
            {habit.streak}
          </span>
          <span className="text-[11px]">🔥</span>
        </div>
      )}
    </motion.button>
  );
}
