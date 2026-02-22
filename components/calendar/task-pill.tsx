"use client";

import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

interface TaskPillProps {
  task: Task;
  isDragging?: boolean;
}

export function TaskPill({ task, isDragging }: TaskPillProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      suppressHydrationWarning
      className={cn(
        "inline-flex items-center rounded-full border border-border px-3 py-1.5 text-[13px] font-medium touch-none select-none",
        isDragging
          ? "bg-accent/20 border-accent text-text shadow-lg scale-105"
          : "bg-surface-2 text-text-secondary active:bg-border transition-colors"
      )}
    >
      <span className="truncate max-w-[160px]">{task.title}</span>
    </div>
  );
}
