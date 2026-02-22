"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TaskPill } from "./task-pill";
import type { Task } from "@/types";

interface TaskDrawerProps {
  tasks: Task[];
  onTaskTap?: (task: Task) => void;
}

export function TaskDrawer({ tasks, onTaskTap }: TaskDrawerProps) {
  const [expanded, setExpanded] = useState(false);

  if (tasks.length === 0) return null;

  return (
    <div className="mt-3">
      {/* Header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-1 mb-2"
      >
        <span className="text-[11px] font-semibold tracking-wider uppercase text-text-muted">
          Unscheduled
        </span>
        <span className="text-[11px] font-medium text-text-secondary">
          {tasks.length} task{tasks.length !== 1 ? "s" : ""}
        </span>
      </button>

      {/* Pills */}
      <motion.div
        animate={{ height: expanded ? "auto" : 44 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="overflow-hidden"
      >
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
              >
                <TaskPill task={task} onTap={onTaskTap} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
