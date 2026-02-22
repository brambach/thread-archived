"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function CaptureUI() {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Auto-focus textarea when sheet opens
  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 80);
    } else {
      setContent("");
      setJustSaved(false);
    }
  }, [open]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [content]);

  const handleSubmit = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      await fetch("/api/captures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      setContent("");
      setJustSaved(true);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => {
        setJustSaved(false);
        setOpen(false);
      }, 900);
    } finally {
      setSubmitting(false);
    }
  }, [content, submitting]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      {/* Floating + button */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-4 z-40 w-13 h-13 rounded-full bg-accent shadow-lg shadow-accent/30 flex items-center justify-center text-white"
        style={{ width: 52, height: 52 }}
        aria-label="Quick capture (⌘K)"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Sheet */}
            <motion.div
              key="sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 z-50"
            >
              <div className="max-w-lg mx-auto bg-surface border-t border-border rounded-t-2xl px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                {/* Handle */}
                <div className="w-9 h-1 rounded-full bg-border mx-auto mb-4" />

                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-text-muted">
                    Quick Capture
                  </span>
                  <span className="text-[11px] font-mono text-text-muted bg-surface-2 px-1.5 py-0.5 rounded">
                    ⌘K
                  </span>
                </div>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="What's on your mind?"
                  rows={1}
                  className="w-full bg-transparent text-[16px] leading-relaxed text-text placeholder:text-text-muted focus:outline-none resize-none min-h-[2.5rem] max-h-48"
                  style={{ overflow: "hidden" }}
                  autoComplete="off"
                  autoCorrect="off"
                />

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                  <span className="text-[11px] text-text-muted">
                    Enter to save · Shift+Enter for newline
                  </span>
                  <AnimatePresence mode="wait">
                    {justSaved ? (
                      <motion.span
                        key="saved"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-[12px] font-medium text-success"
                      >
                        ✓ Captured
                      </motion.span>
                    ) : (
                      <motion.button
                        key="submit"
                        onClick={handleSubmit}
                        disabled={!content.trim() || submitting}
                        whileTap={{ scale: 0.95 }}
                        className="text-[12px] font-medium text-accent disabled:opacity-30 transition-opacity"
                      >
                        {submitting ? "Saving…" : "Capture"}
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
