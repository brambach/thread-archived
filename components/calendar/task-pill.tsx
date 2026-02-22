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

  // Detect taps alongside dnd-kit — touch-none prevents synthetic clicks,
  // so we track touch manually. If finger lifts within 8px, it's a tap.
  const tapStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    tapStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    // Let dnd-kit's listener run too
    (listeners as Record<string, (e: React.TouchEvent) => void>)?.onTouchStart?.(e);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (tapStartRef.current && onTap) {
      const dx = e.changedTouches[0].clientX - tapStartRef.current.x;
      const dy = e.changedTouches[0].clientY - tapStartRef.current.y;
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
        onTap(task);
      }
    }
    tapStartRef.current = null;
    (listeners as Record<string, (e: React.TouchEvent) => void>)?.onTouchEnd?.(e);
  };

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={() => onTap?.(task)}
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
