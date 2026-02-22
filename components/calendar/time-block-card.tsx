"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { TimeBlock, Task } from "@/types";

const SLOT_HEIGHT = 60;
const START_HOUR = 7;

const COLOR_MAP: Record<string, { bg: string; border: string }> = {
  accent: { bg: "bg-accent/[0.12]", border: "border-accent" },
  success: { bg: "bg-success/[0.12]", border: "border-success" },
  warning: { bg: "bg-warning/[0.12]", border: "border-warning" },
  danger: { bg: "bg-danger/[0.12]", border: "border-danger" },
};

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

interface TimeBlockCardProps {
  block: TimeBlock;
  task: Task | null;
  onTap: (block: TimeBlock) => void;
}

export function TimeBlockCard({ block, task, onTap }: TimeBlockCardProps) {
  const startMin = timeToMinutes(block.startTime);
  const endMin = timeToMinutes(block.endTime);
  const originMin = START_HOUR * 60;

  const top = ((startMin - originMin) / 30) * SLOT_HEIGHT;
  const height = ((endMin - startMin) / 30) * SLOT_HEIGHT;

  const colorKey = block.color || "accent";
  const colors = COLOR_MAP[colorKey] || COLOR_MAP.accent;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className={cn(
        "absolute left-0 right-0 mx-1 rounded-md border-l-2 px-2.5 py-1.5 cursor-pointer overflow-hidden",
        colors.bg,
        colors.border
      )}
      style={{ top, height: Math.max(height, SLOT_HEIGHT) }}
      onClick={(e) => {
        e.stopPropagation();
        onTap(block);
      }}
    >
      <p className="text-[13px] font-medium text-text truncate leading-tight">
        {task?.title || block.label || "Time block"}
      </p>
      <p className="text-[10px] font-mono text-text-secondary mt-0.5">
        {formatTime(block.startTime)} – {formatTime(block.endTime)}
      </p>
    </motion.div>
  );
}
