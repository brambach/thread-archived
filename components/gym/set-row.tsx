"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface SetData {
  id?: string;
  setNumber: number;
  weightLbs: string;
  reps: string;
  isPR?: boolean;
  saved?: boolean;
}

interface SetRowProps {
  set: SetData;
  prevWeight?: number | null; // previous best for this exercise
  onSave: (data: { weightLbs: number | null; reps: number | null }) => Promise<void>;
  onDelete: () => void;
}

export function SetRow({ set, prevWeight, onSave, onDelete }: SetRowProps) {
  const [weight, setWeight] = useState(set.weightLbs);
  const [reps, setReps] = useState(set.reps);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(set.saved ?? false);
  const [isPR, setIsPR] = useState(set.isPR ?? false);

  const hasValues = weight.trim() !== "" || reps.trim() !== "";

  async function handleSave() {
    if (!hasValues) return;
    setSaving(true);
    try {
      const w = weight.trim() ? parseFloat(weight) : null;
      const r = reps.trim() ? parseInt(reps, 10) : null;
      await onSave({ weightLbs: w, reps: r });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  const weightNum = weight.trim() ? parseFloat(weight) : null;
  const showPR = isPR || (weightNum !== null && prevWeight !== null && prevWeight !== undefined && weightNum > prevWeight);

  return (
    <div className="flex items-center gap-2">
      {/* Set number */}
      <div className="w-6 text-center text-[13px] text-text-muted font-mono shrink-0">
        {set.setNumber}
      </div>

      {/* Weight input */}
      <div className="flex-1">
        <input
          type="number"
          inputMode="decimal"
          value={weight}
          onChange={(e) => { setWeight(e.target.value); setSaved(false); }}
          placeholder="0"
          className={cn(
            "w-full bg-surface-2 border rounded-[8px] px-2.5 py-2 text-[15px] font-medium text-text text-center outline-none transition-all",
            saved ? "border-border" : "border-border focus:border-accent/60",
            showPR && "border-warning/50 bg-warning/5"
          )}
        />
      </div>

      <span className="text-[12px] text-text-muted shrink-0">lbs</span>

      {/* Reps input */}
      <div className="flex-1">
        <input
          type="number"
          inputMode="numeric"
          value={reps}
          onChange={(e) => { setReps(e.target.value); setSaved(false); }}
          placeholder="0"
          className={cn(
            "w-full bg-surface-2 border rounded-[8px] px-2.5 py-2 text-[15px] font-medium text-text text-center outline-none transition-all",
            saved ? "border-border" : "border-border focus:border-accent/60",
            showPR && "border-warning/50 bg-warning/5"
          )}
        />
      </div>

      <span className="text-[12px] text-text-muted shrink-0">reps</span>

      {/* PR badge or save/delete */}
      <div className="w-10 flex items-center justify-center shrink-0">
        {showPR ? (
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-[11px] font-bold text-warning"
          >
            PR
          </motion.span>
        ) : saved ? (
          <button
            onClick={onDelete}
            className="text-[18px] text-text-muted hover:text-danger transition-colors"
          >
            ×
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={!hasValues || saving}
            className={cn(
              "text-[13px] font-semibold transition-colors",
              hasValues ? "text-accent hover:text-accent/80" : "text-text-muted"
            )}
          >
            {saving ? "…" : "✓"}
          </button>
        )}
      </div>
    </div>
  );
}
