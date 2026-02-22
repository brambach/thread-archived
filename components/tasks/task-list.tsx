"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TaskItem } from "./task-item";
import { TaskForm } from "./task-form";
import { getLocalToday } from "@/lib/utils";
import type { Task } from "@/types";

interface TaskListProps {
  initialTasks: Task[];
}

export function TaskList({ initialTasks }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const today = getLocalToday();

  const doneCount = tasks.filter((t) => t.isDone).length;
  const total = tasks.length;
  const allDone = total > 0 && doneCount === total;

  const handleToggle = useCallback(async (taskId: string, isDone: boolean) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, isDone, doneAt: isDone ? new Date() : null }
          : t
      )
    );

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDone }),
      });
    } catch {
      // Revert on error
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, isDone: !isDone, doneAt: null } : t
        )
      );
    }
  }, []);

  const handleDelete = useCallback(async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    } catch {
      // Silent — deletion failures are rare and a reload will restore state
    }
  }, []);

  const handleAdd = useCallback(
    async (title: string, date?: string) => {
      const targetDate = date || today;
      const isFuture = targetDate !== today;
      const tempId = `optimistic-${Date.now()}`;
      const optimisticTask = {
        id: tempId,
        title,
        notes: null,
        date: targetDate,
        isDone: false,
        doneAt: null,
        timeBlockId: null,
        workProjectId: null,
        sortOrder: 0,
        createdAt: new Date(),
      } as unknown as Task;

      // Only show in today's list if it's for today
      if (!isFuture) {
        setTasks((prev) => [...prev, optimisticTask]);
      }

      try {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, date: targetDate }),
        });
        if (!res.ok) throw new Error("Failed");
        const newTask = await res.json();
        if (!isFuture) {
          setTasks((prev) => prev.map((t) => (t.id === tempId ? newTask : t)));
        }
      } catch {
        if (!isFuture) {
          setTasks((prev) => prev.filter((t) => t.id !== tempId));
        }
      }
    },
    [today]
  );

  return (
    <section>
      {/* Section header */}
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

      {/* Task list or empty state */}
      <AnimatePresence mode="wait">
        {tasks.length === 0 ? (
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
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
            </div>
            <p className="text-text-secondary text-sm font-medium">
              Clean slate.
            </p>
            <p className="text-text-muted text-xs mt-1">
              Add a task below to plan your day.
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
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  isLast={i === tasks.length - 1}
                />
              ))}
            </AnimatePresence>
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
              ✦ Clean day · all tasks done
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add task inline form */}
      <TaskForm onAdd={handleAdd} />
    </section>
  );
}
