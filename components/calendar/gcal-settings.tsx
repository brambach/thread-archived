"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CalendarListItem } from "@/types";

interface GCalSettingsProps {
  open: boolean;
  onClose: () => void;
  onConnectionChange: () => void;
}

export function GCalSettings({ open, onClose, onConnectionChange }: GCalSettingsProps) {
  const [status, setStatus] = useState<{
    connected: boolean;
    email: string | null;
  } | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [calendars, setCalendars] = useState<CalendarListItem[] | null>(null);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  const fetchStatus = useCallback(() => {
    fetch("/api/google/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ connected: false, email: null }));
  }, []);

  const fetchCalendars = useCallback(() => {
    fetch("/api/google/calendars")
      .then((r) => r.json())
      .then((data) => setCalendars(Array.isArray(data) ? data : []))
      .catch(() => setCalendars([]));
  }, []);

  useEffect(() => {
    if (open) {
      fetchStatus();
    } else {
      // Reset calendar list when closed so it re-fetches fresh next open
      setCalendars(null);
    }
  }, [open, fetchStatus]);

  useEffect(() => {
    if (status?.connected) {
      fetchCalendars();
    }
  }, [status?.connected, fetchCalendars]);

  const handleToggleCalendar = async (id: string, currentSelected: boolean) => {
    if (!calendars) return;

    const next = calendars.map((c) =>
      c.id === id ? { ...c, selected: !currentSelected } : c
    );
    setCalendars(next);

    setSavingIds((s) => new Set(s).add(id));
    try {
      const selectedIds = next.filter((c) => c.selected).map((c) => c.id);
      await fetch("/api/google/calendars", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedIds }),
      });
      onConnectionChange(); // refresh events on the calendar
    } catch {
      // Revert on error
      setCalendars(calendars);
    } finally {
      setSavingIds((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await fetch("/api/google/status", { method: "DELETE" });
      setStatus({ connected: false, email: null });
      setCalendars(null);
      onConnectionChange();
    } catch {
      // ignore
    } finally {
      setDisconnecting(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-surface rounded-t-2xl"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-9 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-2 pb-4">
              <h2 className="text-[17px] font-semibold text-text">
                Google Calendar
              </h2>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-surface-2 flex items-center justify-center text-text-secondary"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div
              className="px-5 overflow-y-auto"
              style={{ paddingBottom: 'calc(50px + max(1.5rem, env(safe-area-inset-bottom)))', maxHeight: '70vh' }}
            >
              {status === null ? (
                <div className="py-6 text-center text-text-secondary text-sm">
                  Loading...
                </div>
              ) : status.connected ? (
                <>
                  {/* Connected account */}
                  <div className="rounded-lg border border-border bg-surface-2 px-4 py-3 mb-5">
                    <p className="text-[11px] font-semibold tracking-wider uppercase text-text-muted mb-1">
                      Connected Account
                    </p>
                    <p className="text-[15px] text-text">{status.email}</p>
                  </div>

                  {/* Calendar list */}
                  <p className="text-[11px] font-semibold tracking-wider uppercase text-text-muted mb-2">
                    Calendars
                  </p>
                  <div className="rounded-lg border border-border bg-surface-2 overflow-hidden mb-5">
                    {calendars === null ? (
                      <div className="py-4 text-center text-text-secondary text-sm">
                        Loading calendars...
                      </div>
                    ) : calendars.length === 0 ? (
                      <div className="py-4 text-center text-text-secondary text-sm">
                        No calendars found
                      </div>
                    ) : (
                      calendars.map((cal, i) => (
                        <button
                          key={cal.id}
                          onClick={() => handleToggleCalendar(cal.id, cal.selected)}
                          disabled={savingIds.has(cal.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors active:bg-border disabled:opacity-60 ${
                            i > 0 ? "border-t border-border" : ""
                          }`}
                        >
                          {/* Calendar color dot */}
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: cal.backgroundColor ?? "#4285f4" }}
                          />
                          <span className="flex-1 text-[14px] text-text truncate">
                            {cal.summary}
                          </span>
                          {/* Toggle */}
                          <span
                            className={`w-10 h-6 rounded-full relative flex-shrink-0 transition-colors ${
                              cal.selected ? "bg-accent" : "bg-border"
                            }`}
                          >
                            <span
                              className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                                cal.selected ? "translate-x-5" : "translate-x-1"
                              }`}
                            />
                          </span>
                        </button>
                      ))
                    )}
                  </div>

                  {/* Disconnect */}
                  <button
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="w-full rounded-lg border border-danger/20 bg-danger/[0.08] py-2.5 text-[14px] font-medium text-danger transition-colors active:bg-danger/20 disabled:opacity-50"
                  >
                    {disconnecting ? "Disconnecting..." : "Disconnect"}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-[13px] text-text-secondary mb-4">
                    Connect your Google Calendar to see events overlaid on your daily view. Thread only reads your events — nothing is written back.
                  </p>
                  <a
                    href="/api/google/auth"
                    className="block w-full rounded-lg bg-gcal py-2.5 text-center text-[14px] font-medium text-white transition-colors active:bg-gcal/80"
                  >
                    Connect Google Calendar
                  </a>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
