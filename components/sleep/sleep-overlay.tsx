"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSleep } from "./sleep-provider";
import { getEveningQuote } from "@/lib/quotes";

const SLEEP = {
  bg: "#060508",
  text: "#C8C0D0",
  textMuted: "#534D5A",
  accent: "#7A6F8A",
  glow: "#3D3450",
} as const;

function useCurrentTime() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);
  return time;
}

function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const h = hours % 12 || 12;
  const m = String(minutes).padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";
  return `${h}:${m} ${period}`;
}

export function SleepOverlay() {
  const { isSleeping, isWaking, wake } = useSleep();
  const time = useCurrentTime();
  const quote = getEveningQuote();
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientY;
    // Swipe up to wake
    if (diff > 60) {
      wake();
    }
    setTouchStart(null);
  };

  return (
    <AnimatePresence>
      {isSleeping && (
        <motion.div
          key="sleep-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: isWaking ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: isWaking ? 0.8 : 0.5 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center select-none cursor-pointer overflow-hidden"
          style={{ backgroundColor: SLEEP.bg }}
          onClick={() => wake()}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Subtle ambient glow */}
          <div
            className="absolute w-[300px] h-[300px] rounded-full blur-[120px] opacity-20"
            style={{ backgroundColor: SLEEP.glow, top: "20%", left: "50%", transform: "translateX(-50%)" }}
          />

          {/* Moon icon */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke={SLEEP.accent}
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          </motion.div>

          {/* Time */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-5xl font-light tracking-tight mt-8 mb-2"
            style={{ color: SLEEP.text }}
          >
            {formatTime(time)}
          </motion.p>

          {/* Status */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="text-sm font-medium tracking-widest uppercase mb-12"
            style={{ color: SLEEP.textMuted }}
          >
            Sleep Mode
          </motion.p>

          {/* Quote */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.8 }}
            className="text-center text-sm italic leading-relaxed max-w-[260px] px-4"
            style={{ color: SLEEP.accent }}
          >
            &ldquo;{quote}&rdquo;
          </motion.p>

          {/* Wake hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.0, duration: 0.6 }}
            className="absolute bottom-0 left-0 right-0 pb-[calc(2rem+env(safe-area-inset-bottom))] flex flex-col items-center gap-2"
          >
            {/* Swipe up chevron */}
            <motion.svg
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={SLEEP.textMuted}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="18 15 12 9 6 15" />
            </motion.svg>
            <span className="text-[11px] tracking-wider" style={{ color: SLEEP.textMuted }}>
              tap or swipe to wake
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
