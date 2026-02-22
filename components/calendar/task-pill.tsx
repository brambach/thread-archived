"use client";

import { useRef } from "react";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

interface TaskPillProps {
  task: Task;
  isDragging?: boolean;
  onTap?: (task: Task) => void;
}

export function TaskPill({ task, isDragging, onTap }: TaskPillProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  // Track pointer start position to distinguish tap from drag
  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    listeners?.onPointerDown?.(e as never);
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only fire tap if the pointer didn't move much (not a drag)
    if (pointerStartRef.current) {
      const dx = Math.abs(e.clientX - pointerStartRef.current.x);
      const dy = Math.abs(e.clientY - pointerStartRef.current.y);
      if (dx < 8 && dy < 8 && onTap) {
        onTap(task);
      }
    }
    pointerStartRef.current = null;
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      style={style}
      suppressHydrationWarning
      className={cn(
        "inline-flex items-center rounded-full border border-border px-3 py-1.5 text-[13px] font-medium touch-none select-none cursor-pointer",
        isDragging
          ? "bg-accent/20 border-accent text-text shadow-lg scale-105"
          : "bg-surface-2 text-text-secondary active:bg-border transition-colors"
      )}
    >
      <span className="truncate max-w-[160px]">{task.title}</span>
    </div>
  );
}
