"use client";

import { useRef, useCallback } from "react";
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
  const pointerStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const didDragRef = useRef(false);

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  // Track pointer to distinguish tap from drag.
  // dnd-kit's PointerSensor swallows click events, so we detect taps via pointerup.
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      pointerStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
      didDragRef.current = false;
      // Forward to dnd-kit
      listeners?.onPointerDown?.(e as never);
    },
    [listeners]
  );

  const handlePointerMove = useCallback(() => {
    // If pointer moved, mark as drag so pointerup doesn't fire tap
    didDragRef.current = true;
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!pointerStartRef.current || didDragRef.current) {
        pointerStartRef.current = null;
        return;
      }

      const { x, y, time } = pointerStartRef.current;
      const dx = Math.abs(e.clientX - x);
      const dy = Math.abs(e.clientY - y);
      const elapsed = Date.now() - time;

      // Tap: small movement + quick release
      if (dx < 6 && dy < 6 && elapsed < 400 && onTap) {
        e.preventDefault();
        e.stopPropagation();
        onTap(task);
      }

      pointerStartRef.current = null;
    },
    [task, onTap]
  );

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
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
