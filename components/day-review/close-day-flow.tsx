"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getEveningQuote } from "@/lib/quotes";
import { getLocalToday } from "@/lib/utils";
import { useSleep } from "@/components/sleep/sleep-provider";
import type { Task, DayReview } from "@/types";

// Warm palette — slightly amber-tinted, winding down
const WARM = {
  bg: "#0F0C09",
  surface: "#171310",
  border: "#2C2520",
  text: "#EDE8E0",
  textMuted: "#7A7068",
  accent: "#C4924F",
  accentDim: "#8B6535",
  success: "#7AAF8D",
} as const;

interface RecapData {
  tasksCompleted: number;
  tasksTotal: number;
  habitsCompleted: number;
  habitsTotal: number;
  hadWorkout: boolean;
  incompleteTasks: Task[];
  existingReview: DayReview | null;
}

type TaskAction = "tomorrow" | "drop" | null;

interface CloseDayFlowProps {
  onClose: () => void;
}

type Step = "recap" | "roll-forward" | "intentions" | "done";

export function CloseDayFlow({ onClose }: CloseDayFlowProps) {
  const [step, setStep] = useState<Step>("recap");
  const [recapData, setRecapData] = useState<RecapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [energyRating, setEnergyRating] = useState<number | null>(null);
  const [taskActions, setTaskActions] = useState<Record<string, TaskAction>>({});
  const [top3, setTop3] = useState(["", "", ""]);
  const [oneLine, setOneLine] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { enterSleep } = useSleep();

  const handleSleep = () => {
    enterSleep();
    onClose();
  };

  const localDate = getLocalToday();

  useEffect(() => {
    fetch(`/api/day-reviews/recap?date=${localDate}`)
      .then((r) => r.json())
      .then((data: RecapData) => {
        setRecapData(data);
        if (data.existingReview?.energyRating) {
          setEnergyRating(data.existingReview.energyRating);
        }
        if (data.existingReview?.tomorrowTop3) {
          const t = data.existingReview.tomorrowTop3;
          setTop3([t[0] ?? "", t[1] ?? "", t[2] ?? ""]);
        }
        if (data.existingReview?.oneLine) {
          setOneLine(data.existingReview.oneLine);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Dismiss on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleRecapNext = async () => {
    if (!energyRating) return;
    await fetch("/api/day-reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: localDate,
        energyRating,
        tasksCompleted: recapData?.tasksCompleted,
        habitsCompleted: recapData?.habitsCompleted,
        hadWorkout: recapData?.hadWorkout,
      }),
    });
    if (recapData && recapData.incompleteTasks.length > 0) {
      setStep("roll-forward");
    } else {
      setStep("intentions");
    }
  };

  const handleRollForwardNext = async () => {
    setSubmitting(true);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

    const ops: Promise<unknown>[] = [];
    for (const [id, action] of Object.entries(taskActions)) {
      if (action === "tomorrow") {
        ops.push(
          fetch(`/api/tasks/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date: tomorrowStr }),
          })
        );
      } else if (action === "drop") {
        ops.push(fetch(`/api/tasks/${id}`, { method: "DELETE" }));
      }
      // null = leave on today (no action)
    }
    await Promise.all(ops);
    setSubmitting(false);
    setStep("intentions");
  };

  const handleIntentionsDone = async () => {
    setSubmitting(true);
    await fetch("/api/day-reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: localDate,
        tomorrowTop3: top3.filter(Boolean),
        oneLine: oneLine.trim() || null,
      }),
    });
    setSubmitting(false);
    setStep("done");
  };

  const stepIndex = step === "recap" ? 1 : step === "roll-forward" ? 2 : step === "intentions" ? 3 : 3;
  const totalSteps = recapData && recapData.incompleteTasks.length > 0 ? 3 : 2;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden"
      style={{ backgroundColor: WARM.bg }}
    >
      {/* Header bar */}
      {step !== "done" && (
        <div
          className="flex items-center justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4"
          style={{ borderBottom: `1px solid ${WARM.border}` }}
        >
          <button
            onClick={onClose}
            className="text-sm transition-opacity opacity-50 hover:opacity-80"
            style={{ color: WARM.text }}
          >
            ✕
          </button>
          <span className="text-xs font-medium tracking-widest uppercase" style={{ color: WARM.textMuted }}>
            Close the Day
          </span>
          {/* Step dots */}
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full transition-all"
                style={{
                  backgroundColor:
                    i < stepIndex ? WARM.accent : WARM.border,
                  width: i + 1 === stepIndex ? "1.25rem" : "0.375rem",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-64"
            >
              <span className="text-sm" style={{ color: WARM.textMuted }}>
                Loading your day...
              </span>
            </motion.div>
          ) : step === "recap" ? (
            <RecapStep
              key="recap"
              data={recapData!}
              energyRating={energyRating}
              onEnergyChange={setEnergyRating}
              onNext={handleRecapNext}
            />
          ) : step === "roll-forward" ? (
            <RollForwardStep
              key="roll-forward"
              tasks={recapData!.incompleteTasks}
              taskActions={taskActions}
              onActionChange={(id, action) =>
                setTaskActions((prev) => ({ ...prev, [id]: action }))
              }
              onNext={handleRollForwardNext}
              submitting={submitting}
            />
          ) : step === "intentions" ? (
            <IntentionsStep
              key="intentions"
              top3={top3}
              oneLine={oneLine}
              onTop3Change={setTop3}
              onOneLineChange={setOneLine}
              onDone={handleIntentionsDone}
              submitting={submitting}
            />
          ) : (
            <DoneStep key="done" onClose={onClose} onSleep={handleSleep} />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Step 1: Recap ───────────────────────────────────────────────────────────

function RecapStep({
  data,
  energyRating,
  onEnergyChange,
  onNext,
}: {
  data: RecapData;
  energyRating: number | null;
  onEnergyChange: (n: number) => void;
  onNext: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="px-5 pt-8 pb-10 max-w-lg mx-auto w-full"
    >
      <h2
        className="text-2xl font-bold tracking-tight mb-1"
        style={{ color: WARM.text }}
      >
        How was your day?
      </h2>
      <p className="text-sm mb-8" style={{ color: WARM.textMuted }}>
        A moment to reflect before you close out.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatCard
          label="Tasks"
          value={`${data.tasksCompleted} / ${data.tasksTotal}`}
          filled={data.tasksCompleted === data.tasksTotal && data.tasksTotal > 0}
        />
        <StatCard
          label="Habits"
          value={`${data.habitsCompleted} / ${data.habitsTotal}`}
          filled={data.habitsCompleted === data.habitsTotal && data.habitsTotal > 0}
        />
        <StatCard
          label="Gym"
          value={data.hadWorkout ? "Done" : "Rest day"}
          filled={data.hadWorkout}
        />
      </div>

      {/* Energy rating */}
      <div
        className="rounded-xl p-5 mb-8"
        style={{ backgroundColor: WARM.surface, border: `1px solid ${WARM.border}` }}
      >
        <p className="text-sm font-medium mb-4" style={{ color: WARM.text }}>
          How was your energy today?
        </p>
        <div className="flex gap-3 justify-between">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => onEnergyChange(n)}
              className="flex-1 flex flex-col items-center gap-1.5 group"
            >
              <span
                className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all"
                style={{
                  backgroundColor:
                    energyRating !== null && n <= energyRating
                      ? WARM.accent
                      : WARM.border,
                  color:
                    energyRating !== null && n <= energyRating
                      ? "#0F0C09"
                      : WARM.textMuted,
                  transform: energyRating === n ? "scale(1.15)" : "scale(1)",
                }}
              >
                {n}
              </span>
            </button>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px]" style={{ color: WARM.textMuted }}>Drained</span>
          <span className="text-[10px]" style={{ color: WARM.textMuted }}>Great</span>
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!energyRating}
        className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all"
        style={{
          backgroundColor: energyRating ? WARM.accent : WARM.border,
          color: energyRating ? "#0F0C09" : WARM.textMuted,
          cursor: energyRating ? "pointer" : "not-allowed",
        }}
      >
        Continue →
      </button>
    </motion.div>
  );
}

function StatCard({
  label,
  value,
  filled,
}: {
  label: string;
  value: string;
  filled: boolean;
}) {
  return (
    <div
      className="rounded-xl p-3.5 flex flex-col gap-1"
      style={{
        backgroundColor: WARM.surface,
        border: `1px solid ${filled ? WARM.accentDim : WARM.border}`,
      }}
    >
      <span className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: WARM.textMuted }}>
        {label}
      </span>
      <span
        className="text-base font-bold"
        style={{ color: filled ? WARM.accent : WARM.text }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Step 2: Roll Forward ────────────────────────────────────────────────────

function RollForwardStep({
  tasks,
  taskActions,
  onActionChange,
  onNext,
  submitting,
}: {
  tasks: Task[];
  taskActions: Record<string, TaskAction>;
  onActionChange: (id: string, action: TaskAction) => void;
  onNext: () => void;
  submitting: boolean;
}) {
  const reviewed = tasks.filter((t) => taskActions[t.id] !== undefined).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="px-5 pt-8 pb-10 max-w-lg mx-auto w-full"
    >
      <h2
        className="text-2xl font-bold tracking-tight mb-1"
        style={{ color: WARM.text }}
      >
        Unfinished tasks
      </h2>
      <p className="text-sm mb-6" style={{ color: WARM.textMuted }}>
        Move to tomorrow, or let them go.{" "}
        {tasks.length - reviewed > 0 && (
          <span style={{ color: WARM.textMuted }}>
            ({tasks.length - reviewed} left to decide)
          </span>
        )}
      </p>

      <div className="flex flex-col gap-3 mb-8">
        {tasks.map((task) => {
          const action = taskActions[task.id] ?? null;
          return (
            <div
              key={task.id}
              className="rounded-xl p-4"
              style={{
                backgroundColor: WARM.surface,
                border: `1px solid ${WARM.border}`,
                opacity: action !== null ? 0.6 : 1,
              }}
            >
              <p
                className="text-sm font-medium mb-3 leading-snug"
                style={{
                  color: WARM.text,
                  textDecoration: action === "drop" ? "line-through" : "none",
                }}
              >
                {task.title}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    onActionChange(task.id, action === "tomorrow" ? null : "tomorrow")
                  }
                  className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    backgroundColor:
                      action === "tomorrow" ? WARM.accent : WARM.border,
                    color: action === "tomorrow" ? "#0F0C09" : WARM.textMuted,
                  }}
                >
                  Tomorrow →
                </button>
                <button
                  onClick={() =>
                    onActionChange(task.id, action === "drop" ? null : "drop")
                  }
                  className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    backgroundColor:
                      action === "drop" ? "#3D2020" : WARM.border,
                    color: action === "drop" ? "#E07070" : WARM.textMuted,
                  }}
                >
                  Let it go
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={onNext}
        disabled={submitting}
        className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all"
        style={{ backgroundColor: WARM.accent, color: "#0F0C09" }}
      >
        {submitting ? "Saving..." : "Continue →"}
      </button>

      <p className="text-center text-xs mt-3" style={{ color: WARM.textMuted }}>
        Unreviewed tasks stay on today&apos;s list.
      </p>
    </motion.div>
  );
}

// ── Step 3: Intentions ──────────────────────────────────────────────────────

function IntentionsStep({
  top3,
  oneLine,
  onTop3Change,
  onOneLineChange,
  onDone,
  submitting,
}: {
  top3: string[];
  oneLine: string;
  onTop3Change: (v: string[]) => void;
  onOneLineChange: (v: string) => void;
  onDone: () => void;
  submitting: boolean;
}) {
  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="px-5 pt-8 pb-10 max-w-lg mx-auto w-full"
    >
      <h2
        className="text-2xl font-bold tracking-tight mb-1"
        style={{ color: WARM.text }}
      >
        Tomorrow
      </h2>
      <p className="text-sm mb-8" style={{ color: WARM.textMuted }}>
        What three things matter most?
      </p>

      {/* Top 3 inputs */}
      <div
        className="rounded-xl overflow-hidden mb-6"
        style={{ border: `1px solid ${WARM.border}` }}
      >
        {top3.map((val, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4"
            style={{
              borderBottom: i < 2 ? `1px solid ${WARM.border}` : "none",
              backgroundColor: WARM.surface,
            }}
          >
            <span
              className="text-xs font-semibold w-4 shrink-0"
              style={{ color: WARM.textMuted }}
            >
              {i + 1}
            </span>
            <input
              ref={refs[i]}
              type="text"
              value={val}
              onChange={(e) => {
                const next = [...top3];
                next[i] = e.target.value;
                onTop3Change(next);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && i < 2) refs[i + 1].current?.focus();
              }}
              placeholder={
                i === 0
                  ? "Most important thing"
                  : i === 1
                  ? "Second priority"
                  : "Third priority"
              }
              className="flex-1 py-4 text-sm bg-transparent outline-none placeholder:opacity-30"
              style={{ color: WARM.text }}
            />
          </div>
        ))}
      </div>

      {/* One line */}
      <div
        className="rounded-xl mb-8"
        style={{
          backgroundColor: WARM.surface,
          border: `1px solid ${WARM.border}`,
        }}
      >
        <p
          className="text-xs font-semibold tracking-wider uppercase px-4 pt-4 pb-2"
          style={{ color: WARM.textMuted }}
        >
          One line about today
        </p>
        <textarea
          value={oneLine}
          onChange={(e) => onOneLineChange(e.target.value)}
          placeholder="Optional — what defined this day?"
          rows={2}
          className="w-full px-4 pb-4 text-sm bg-transparent outline-none resize-none placeholder:opacity-30"
          style={{ color: WARM.text }}
        />
      </div>

      <button
        onClick={onDone}
        disabled={submitting}
        className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all"
        style={{ backgroundColor: WARM.accent, color: "#0F0C09" }}
      >
        {submitting ? "Closing..." : "Close the Day ✓"}
      </button>
    </motion.div>
  );
}

// ── Done ────────────────────────────────────────────────────────────────────

function DoneStep({ onClose, onSleep }: { onClose: () => void; onSleep: () => void }) {
  const quote = getEveningQuote();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
      className="flex flex-col items-center justify-center h-full min-h-[70vh] px-8 select-none"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.15, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
        style={{ backgroundColor: WARM.surface, border: `1px solid ${WARM.accentDim}` }}
      >
        <span className="text-2xl" style={{ color: WARM.accent }}>✓</span>
      </motion.div>

      <p className="text-lg font-semibold" style={{ color: WARM.text }}>
        Day closed.
      </p>
      <p className="text-sm mt-1 mb-10" style={{ color: WARM.textMuted }}>
        Rest well.
      </p>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6, ease: "easeOut" }}
        className="text-center text-sm italic leading-relaxed max-w-xs mb-12"
        style={{ color: WARM.accentDim }}
      >
        &ldquo;{quote}&rdquo;
      </motion.p>

      {/* Sleep mode button */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        onClick={onSleep}
        className="w-full max-w-[260px] py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] mb-3 flex items-center justify-center gap-2"
        style={{ backgroundColor: WARM.accent, color: "#0F0C09" }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
        Enter Sleep Mode
      </motion.button>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        onClick={onClose}
        className="text-xs py-2 px-4 transition-opacity hover:opacity-80"
        style={{ color: WARM.textMuted }}
      >
        or just close
      </motion.button>
    </motion.div>
  );
}
