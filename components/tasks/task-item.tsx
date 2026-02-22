"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

interface TaskItemProps {
  task: Task;
  onToggle: (taskId: string, isDone: boolean) => void;
  onDelete: (taskId: string) => void;
  isLast?: boolean;
}

export function TaskItem({ task, onToggle, onDelete, isLast }: TaskItemProps) {
  const isDone = task.isDone ?? false;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={cn(!isLast && "border-b border-border")}
    >
      <div
        onClick={() => onToggle(task.id, !isDone)}
        className="w-full flex items-center gap-3.5 px-4 py-3.5 cursor-pointer transition-colors duration-150 active:bg-surface-2"
      >
        {/* Animated checkbox */}
        <div className="relative flex-shrink-0">
          <motion.div
            className={cn(
              "w-[22px] h-[22px] rounded-[6px] border-[1.5px] flex items-center justify-center transition-colors duration-200",
              isDone
                ? "bg-accent border-accent"
                : "bg-transparent border-border"
            )}
            animate={isDone ? { scale: [1, 0.88, 1.05, 1] } : { scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <AnimatePresence>
              {isDone && (
                <motion.svg
                  key="check"
                  width="12"
                  height="9"
                  viewBox="0 0 12 9"
                  fill="none"
                  initial={{ opacity: 0 }}
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

        {/* Title + notes */}
        <div className="flex-1 min-w-0">
          <span
            className={cn(
              "text-[15px] font-medium leading-snug transition-colors duration-200 block truncate",
              isDone ? "text-text-muted line-through" : "text-text"
            )}
          >
            {task.title}
          </span>
          {task.notes && (
            <span className="text-[12px] text-text-muted block mt-0.5 truncate">
              {task.notes}
            </span>
          )}
        </div>

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-text-muted opacity-30 hover:opacity-100 hover:text-danger transition-all duration-150"
          aria-label="Delete task"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}
