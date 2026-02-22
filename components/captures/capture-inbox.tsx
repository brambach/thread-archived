"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CaptureItem } from "./capture-item";
import { getLocalToday } from "@/lib/utils";
import type { Capture } from "@/types";

interface CaptureInboxProps {
  initialCaptures: Capture[];
}

export function CaptureInbox({ initialCaptures }: CaptureInboxProps) {
  const [captures, setCaptures] = useState<Capture[]>(initialCaptures);
  const today = getLocalToday();

  const removeCapture = useCallback((captureId: string) => {
    setCaptures((prev) => prev.filter((c) => c.id !== captureId));
  }, []);

  const markProcessed = useCallback(
    async (
      captureId: string,
      convertedTo: string | null,
      convertedId?: string | null
    ) => {
      await fetch(`/api/captures/${captureId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          processed: true,
          convertedTo,
          convertedId: convertedId ?? null,
        }),
      });
    },
    []
  );

  const handleConvertToTask = useCallback(
    async (capture: Capture) => {
      removeCapture(capture.id);
      try {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: capture.content, date: today }),
        });
        const task = await res.json();
        await markProcessed(capture.id, "task", task.id);
      } catch {
        setCaptures((prev) => [capture, ...prev]);
      }
    },
    [today, removeCapture, markProcessed]
  );

  const handleConvertToJournal = useCallback(
    async (capture: Capture) => {
      removeCapture(capture.id);
      try {
        // Fetch today's journal entry (if any)
        const res = await fetch(`/api/journal?date=${today}`);
        const entries = await res.json();
        const entry = Array.isArray(entries) ? entries[0] : entries;

        let convertedId: string | null = null;

        if (entry?.id) {
          const newContent = entry.content
            ? `${entry.content}\n\n${capture.content}`
            : capture.content;
          const patchRes = await fetch(`/api/journal/${entry.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: newContent }),
          });
          const updated = await patchRes.json();
          convertedId = updated.id;
        } else {
          const postRes = await fetch("/api/journal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date: today, content: capture.content }),
          });
          const created = await postRes.json();
          convertedId = created.id;
        }

        await markProcessed(capture.id, "journal", convertedId);
      } catch {
        setCaptures((prev) => [capture, ...prev]);
      }
    },
    [today, removeCapture, markProcessed]
  );

  const handleConvertToWork = useCallback(
    async (capture: Capture, projectId: string) => {
      removeCapture(capture.id);
      try {
        const res = await fetch("/api/work/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: capture.content,
            projectId,
          }),
        });
        const task = await res.json();
        await markProcessed(capture.id, "work", task.id);
      } catch {
        setCaptures((prev) => [capture, ...prev]);
      }
    },
    [removeCapture, markProcessed]
  );

  const handleDismiss = useCallback(
    async (capture: Capture) => {
      removeCapture(capture.id);
      try {
        await markProcessed(capture.id, null, null);
      } catch {
        setCaptures((prev) => [capture, ...prev]);
      }
    },
    [removeCapture, markProcessed]
  );

  if (captures.length === 0) return null;

  return (
    <section className="mb-6">
      {/* Section header */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-text-muted">
          Inbox
        </span>
        <motion.span
          key={captures.length}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-accent/15 text-accent"
        >
          {captures.length}
        </motion.span>
      </div>

      <motion.div
        layout
        className="rounded-xl border border-border bg-surface overflow-hidden"
      >
        <AnimatePresence initial={false}>
          {captures.map((capture, i) => (
            <CaptureItem
              key={capture.id}
              capture={capture}
              onConvertToTask={handleConvertToTask}
              onConvertToJournal={handleConvertToJournal}
              onConvertToWork={handleConvertToWork}
              onDismiss={handleDismiss}
              isLast={i === captures.length - 1}
            />
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
