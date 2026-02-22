"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LABELS = ["", "Drained", "Low", "Okay", "Good", "Great"];
const COLORS = ["", "#8B5A5A", "#A07840", "#8A8A5C", "#5C8A6A", "#5C7A8A"];

interface EnergyPromptProps {
  initialRating: number | null;
}

export function EnergyPrompt({ initialRating }: EnergyPromptProps) {
  const [rating, setRating] = useState<number | null>(initialRating);
  const [hovered, setHovered] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(!!initialRating);

  const handleSelect = async (n: number) => {
    if (saving) return;
    setRating(n);
    setSaving(true);
    await fetch("/api/day-reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ energyRating: n }),
    });
    setSaving(false);
    setSaved(true);
  };

  const display = hovered ?? rating;

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-text-secondary shrink-0">Energy</span>

      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => handleSelect(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(null)}
            className="h-5 w-5 rounded-full transition-all active:scale-90"
            style={{
              backgroundColor:
                display !== null && n <= display
                  ? COLORS[display]
                  : "var(--color-border, #2A2A2A)",
              opacity: display !== null && n <= display ? 1 : 0.5,
              transform:
                hovered === n ? "scale(1.2)" : "scale(1)",
            }}
            aria-label={`Energy ${n}: ${LABELS[n]}`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {display !== null ? (
          <motion.span
            key={display}
            initial={{ opacity: 0, x: 4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="text-xs"
            style={{ color: COLORS[display] }}
          >
            {LABELS[display]}
            {saved && rating === display && !hovered && " ✓"}
          </motion.span>
        ) : (
          <motion.span
            key="prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs text-text-secondary"
          >
            How&apos;s your energy?
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
