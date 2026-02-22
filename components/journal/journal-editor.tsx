"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { JournalEntry } from "@/types";

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

// Safe date arithmetic that avoids timezone drift
function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().split("T")[0];
}

function formatDateDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface Props {
  initialEntry: JournalEntry | null;
  date: string;
  today: string;
  streak: number;
}

export function JournalEditor({ initialEntry, date, today, streak }: Props) {
  const [content, setContent] = useState(initialEntry?.content ?? "");
  const [entryId, setEntryId] = useState<string | null>(
    initialEntry?.id ?? null
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>(initialEntry?.content ?? "");
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isToday = date === today;
  const prevDate = shiftDate(date, -1);
  const nextDate = shiftDate(date, 1);
  const canGoNext = nextDate <= today;
  const wordCount = countWords(content);

  // Auto-resize textarea to fit content
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [content]);

  const save = useCallback(
    async (text: string) => {
      if (text === lastSavedRef.current) return;
      if (!text.trim() && !entryId) return; // Don't create an entry for empty content

      setSaveStatus("saving");

      try {
        let saved: JournalEntry;

        if (entryId) {
          const res = await fetch(`/api/journal/${entryId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: text }),
          });
          if (!res.ok) throw new Error("Save failed");
          saved = await res.json();
        } else {
          const res = await fetch("/api/journal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date, content: text }),
          });
          if (!res.ok) throw new Error("Save failed");
          saved = await res.json();
          setEntryId(saved.id);
        }

        lastSavedRef.current = text;
        setSaveStatus("saved");

        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
      } catch {
        setSaveStatus("error");
      }
    },
    [date, entryId]
  );

  // Debounced auto-save on content change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(content), 800);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [content, save]);

  return (
    <div className="pt-2 pb-6">
      {/* ── Header ── */}
      <header className="py-2 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-[26px] font-bold tracking-tight text-text leading-tight">
            Journal
          </h1>

          {/* Date navigation */}
          <div className="flex items-center gap-0.5">
            <Link
              href={`/journal/${prevDate}`}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden
              >
                <path
                  d="M10 12L6 8l4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>

            {isToday ? (
              <span className="text-[11px] font-semibold tracking-wider uppercase text-text-muted px-1">
                Today
              </span>
            ) : (
              <Link
                href="/journal"
                className="text-[11px] font-semibold tracking-wider uppercase text-accent px-1 hover:opacity-75 transition-opacity"
              >
                Today
              </Link>
            )}

            <Link
              href={canGoNext ? `/journal/${nextDate}` : "#"}
              aria-disabled={!canGoNext}
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
                canGoNext
                  ? "text-text-muted hover:text-text hover:bg-surface-2"
                  : "text-text-muted/25 pointer-events-none"
              )}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden
              >
                <path
                  d="M6 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </div>

        <p className="text-sm text-text-secondary mt-1">
          {formatDateDisplay(date)}
        </p>

        {/* Streak + save status row */}
        <div className="flex items-center justify-between mt-3 h-4">
          <div>
            {streak > 0 && (
              <span className="text-[11px] font-semibold tracking-wider uppercase text-accent">
                ✦ {streak}-day streak
              </span>
            )}
          </div>

          <AnimatePresence mode="wait">
            {saveStatus === "saving" && (
              <motion.span
                key="saving"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="text-[11px] font-mono text-text-muted"
              >
                Saving…
              </motion.span>
            )}
            {saveStatus === "saved" && (
              <motion.span
                key="saved"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="text-[11px] font-mono text-success"
              >
                Saved ✓
              </motion.span>
            )}
            {saveStatus === "error" && (
              <motion.span
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="text-[11px] font-mono text-danger"
              >
                Failed to save
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* ── Editor ── */}
      <div className="relative mt-1">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          autoFocus={isToday}
          spellCheck
          className={cn(
            "w-full min-h-[60vh] resize-none bg-transparent",
            "text-[15px] leading-[1.8] text-text",
            "placeholder:text-text-muted",
            "border-none outline-none focus:outline-none",
            "font-sans caret-accent"
          )}
          style={{ overflow: "hidden" }}
        />
      </div>

      {/* ── Footer: word count ── */}
      {wordCount > 0 && (
        <div className="flex justify-end mt-6 pt-4 border-t border-border">
          <span className="text-[11px] font-mono text-text-muted">
            {wordCount.toLocaleString()}{" "}
            {wordCount === 1 ? "word" : "words"}
          </span>
        </div>
      )}
    </div>
  );
}
