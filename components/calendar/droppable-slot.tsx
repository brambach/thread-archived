"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface DroppableSlotProps {
  id: string;
  isOccupied: boolean;
  children: React.ReactNode;
}

export function DroppableSlot({ id, isOccupied, children }: DroppableSlotProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    disabled: isOccupied,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        isOver && !isOccupied && "bg-accent/[0.06]",
        "transition-colors duration-150"
      )}
    >
      {children}
    </div>
  );
}
