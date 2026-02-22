"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSleep } from "./sleep-provider";
import { getMorningQuote } from "@/lib/quotes";

const WAKE = {
  bg: "#0A0A0A",
  text: "#EDE8E0",
  textMuted: "#7A7068",
  accent: "#C4924F",
} as const;

export function WakeOverlay() {
  const { isWaking } = useSleep();
  const quote = getMorningQuote();

  return (
    <AnimatePresence>
      {isWaking && (
        <motion.div
          key="wake-overlay"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.0, delay: 0.2, ease: "easeOut" }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center select-none overflow-hidden"
          style={{ backgroundColor: WAKE.bg }}
        >
          {/* Sunrise glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.25, scale: 1.2 }}
            transition={{ duration: 1.0 }}
            className="absolute w-[400px] h-[400px] rounded-full blur-[140px]"
            style={{ backgroundColor: WAKE.accent, top: "15%", left: "50%", transform: "translateX(-50%)" }}
          />

          {/* Sun icon */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke={WAKE.accent}
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="text-xl font-semibold mt-6 mb-2"
            style={{ color: WAKE.text }}
          >
            Good morning
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="text-sm max-w-[240px] text-center italic leading-relaxed"
            style={{ color: WAKE.textMuted }}
          >
            {quote}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
