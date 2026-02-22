"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { TimeBlock, Task } from "@/types";

const SLOT_HEIGHT = 60;
const START_HOUR = 7;
const LONG_PRESS_MS = 500;

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
  onLongPress?: (block: TimeBlock) => void;
}

export function TimeBlockCard({ block, task, onTap, onLongPress }: TimeBlockCardProps) {
  const startMin = timeToMinutes(block.startTime);
  const endMin = timeToMinutes(block.endTime);
  const originMin = START_HOUR * 60;

  const top = ((startMin - originMin) / 30) * SLOT_HEIGHT;
  const height = ((endMin - startMin) / 30) * SLOT_HEIGHT;

  const colorKey = block.color || "accent";
  const colors = COLOR_MAP[colorKey] || COLOR_MAP.accent;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const suppressClickRef = useRef(false);
  const [pressing, setPressing] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!onLongPress) return;
    startPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setPressing(true);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      suppressClickRef.current = true;
      setPressing(false);
      onLongPress(block);
    }, LONG_PRESS_MS);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!timerRef.current || !startPosRef.current) return;
    const dx = e.touches[0].clientX - startPosRef.current.x;
    const dy = e.touches[0].clientY - startPosRef.current.y;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      setPressing(false);
    }
  };

  const handleTouchEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPressing(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    onTap(block);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: pressing ? 0.95 : 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className={cn(
        "absolute left-0 right-0 mx-1 rounded-md border-l-2 px-2.5 py-1.5 cursor-pointer overflow-hidden select-none",
        colors.bg,
        colors.border
      )}
      style={{ top, height: Math.max(height, SLOT_HEIGHT) }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => e.preventDefault()}
      onClick={handleClick}
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
