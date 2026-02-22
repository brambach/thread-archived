"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WorkTaskItem } from "./work-task-item";
import { WorkTaskForm } from "./work-task-form";
import type { WorkTask } from "@/types";

interface WorkTaskListProps {
  projectId: string;
  initialTasks: WorkTask[];
  onTasksChange?: (tasks: WorkTask[]) => void;
}

export function WorkTaskList({ projectId, initialTasks, onTasksChange }: WorkTaskListProps) {
  const [tasks, setTasks] = useState<WorkTask[]>(initialTasks);

  const updateTasks = useCallback((updater: (prev: WorkTask[]) => WorkTask[]) => {
    setTasks((prev) => {
      const next = updater(prev);
      onTasksChange?.(next);
      return next;
    });
  }, [onTasksChange]);

  const doneCount = tasks.filter((t) => t.status === "done").length;
  const total = tasks.length;
  const allDone = total > 0 && doneCount === total;

  const handleStatusCycle = useCallback(
    async (taskId: string, nextStatus: string) => {
      // Optimistic update
      updateTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: nextStatus } : t
        )
      );

      try {
        await fetch(`/api/work/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        });
      } catch {
        // Revert
        updateTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, status: tasks.find((x) => x.id === taskId)?.status ?? "todo" }
              : t
          )
        );
      }
    },
    [tasks, updateTasks]
  );

  const handleDelete = useCallback(async (taskId: string) => {
    updateTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await fetch(`/api/work/tasks/${taskId}`, { method: "DELETE" });
    } catch {
      // Silent — rare, reload will restore
    }
  }, [updateTasks]);

  const handleAdd = useCallback(
    async (title: string) => {
      const tempId = `optimistic-${Date.now()}`;
      const optimistic: WorkTask = {
        id: tempId,
        projectId,
        title,
        notes: null,
        status: "todo",
        dueDate: null,
        sortOrder: tasks.length,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      updateTasks((prev) => [...prev, optimistic]);

      try {
        const res = await fetch("/api/work/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, title }),
        });
        if (!res.ok) throw new Error("Failed");
        const newTask = await res.json();
        updateTasks((prev) =>
          prev.map((t) => (t.id === tempId ? newTask : t))
        );
      } catch {
        updateTasks((prev) => prev.filter((t) => t.id !== tempId));
      }
    },
    [projectId, tasks.length, updateTasks]
  );

  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-text-muted">
          Tasks
        </span>
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
      </div>

      <AnimatePresence mode="wait">
        {tasks.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-border bg-surface p-6 text-center"
          >
            <p className="text-text-secondary text-sm">No tasks yet.</p>
            <p className="text-text-muted text-xs mt-1">
              Add your first task below.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            layout
            className={`rounded-xl border overflow-hidden ${
              allDone ? "border-success/30 bg-surface" : "border-border bg-surface"
            }`}
          >
            <AnimatePresence initial={false}>
              {tasks.map((task, i) => (
                <WorkTaskItem
                  key={task.id}
                  task={task}
                  onStatusCycle={handleStatusCycle}
                  onDelete={handleDelete}
                  isLast={i === tasks.length - 1}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

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
              ✦ All tasks done
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <WorkTaskForm onAdd={handleAdd} />
    </section>
  );
}
