"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { WorkTask } from "@/types";

const STATUS_NEXT: Record<string, string> = {
  todo: "in_progress",
  in_progress: "done",
  done: "blocked",
  blocked: "todo",
};

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function StatusIcon({ status }: { status: string }) {
  if (status === "done") {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        className="text-green-400"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="9 12 11.5 14.5 16 9.5" />
      </svg>
    );
  }
  if (status === "in_progress") {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        className="text-accent"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    );
  }
  if (status === "blocked") {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        className="text-red-400"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    );
  }
  // todo
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      className="text-border"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

interface WorkTaskItemProps {
  task: WorkTask;
  onStatusCycle: (taskId: string, nextStatus: string) => void;
  onDelete: (taskId: string) => void;
  isLast?: boolean;
}

export function WorkTaskItem({
  task,
  onStatusCycle,
  onDelete,
  isLast,
}: WorkTaskItemProps) {
  const status = task.status ?? "todo";
  const isDone = status === "done";
  const nextStatus = STATUS_NEXT[status] ?? "todo";

  const isOverdue =
    task.dueDate &&
    !isDone &&
    task.dueDate < new Date().toISOString().split("T")[0];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={cn(!isLast && "border-b border-border")}
    >
      <div className="flex items-center gap-3 px-4 py-3.5 active:bg-surface-2 transition-colors duration-150">
        {/* Status toggle */}
        <button
          onClick={() => onStatusCycle(task.id, nextStatus)}
          className="flex-shrink-0 transition-transform active:scale-90"
          aria-label={`Status: ${status}. Tap to advance.`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={status}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <StatusIcon status={status} />
            </motion.div>
          </AnimatePresence>
        </button>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <span
            className={cn(
              "text-[15px] font-medium leading-snug block truncate transition-colors duration-200",
              isDone ? "text-text-muted line-through" : "text-text"
            )}
          >
            {task.title}
          </span>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {task.notes && (
              <span className="text-[12px] text-text-muted truncate max-w-[180px]">
                {task.notes}
              </span>
            )}
            {task.dueDate && (
              <span
                className={cn(
                  "text-[10px] font-mono px-1.5 py-0.5 rounded",
                  isOverdue
                    ? "bg-red-500/10 text-red-400"
                    : isDone
                      ? "bg-surface-2 text-text-muted"
                      : "bg-accent-dim text-accent"
                )}
              >
                {formatDate(task.dueDate)}
              </span>
            )}
          </div>
        </div>

        {/* Delete */}
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
