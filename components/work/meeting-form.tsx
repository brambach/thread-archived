"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { WorkMeeting } from "@/types";

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

interface MeetingFormProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  meeting?: WorkMeeting;
  onCreate?: (meeting: WorkMeeting) => void;
  onUpdate?: (meeting: WorkMeeting) => void;
  onDelete?: (meetingId: string) => void;
}

export function MeetingForm({
  open,
  onClose,
  projectId,
  meeting,
  onCreate,
  onUpdate,
  onDelete,
}: MeetingFormProps) {
  const isEditing = !!meeting;
  const [date, setDate] = useState(getToday());
  const [title, setTitle] = useState("");
  const [attendees, setAttendees] = useState("");
  const [notes, setNotes] = useState("");
  const [actionItems, setActionItems] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (meeting) {
        setDate(meeting.date);
        setTitle(meeting.title);
        setAttendees(meeting.attendees ?? "");
        setNotes(meeting.notes ?? "");
        setActionItems(meeting.actionItems ?? "");
      } else {
        setDate(getToday());
        setTitle("");
        setAttendees("");
        setNotes("");
        setActionItems("");
      }
      setTimeout(() => titleRef.current?.focus(), 350);
    }
  }, [open, meeting]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || submitting) return;

    setSubmitting(true);
    try {
      if (isEditing && meeting) {
        const res = await fetch(`/api/work/meetings/${meeting.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date,
            title: title.trim(),
            attendees: attendees.trim() || null,
            notes: notes.trim() || null,
            actionItems: actionItems.trim() || null,
          }),
        });
        if (!res.ok) throw new Error("Failed");
        const updated = await res.json();
        onUpdate?.(updated);
      } else {
        const res = await fetch("/api/work/meetings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            date,
            title: title.trim(),
            attendees: attendees.trim() || null,
            notes: notes.trim() || null,
            actionItems: actionItems.trim() || null,
          }),
        });
        if (!res.ok) throw new Error("Failed");
        const created = await res.json();
        onCreate?.(created);
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!meeting || deleting) return;
    setDeleting(true);
    try {
      await fetch(`/api/work/meetings/${meeting.id}`, { method: "DELETE" });
      onDelete?.(meeting.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-[15px] text-text placeholder-text-muted focus:outline-none focus:border-accent";
  const labelCls =
    "text-[11px] font-semibold tracking-wider uppercase text-text-muted block mb-1.5";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-surface rounded-t-2xl max-h-[90dvh]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-9 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-2 pb-4 flex-shrink-0">
              <h2 className="text-[17px] font-semibold text-text">
                {isEditing ? "Edit Meeting" : "Log Meeting"}
              </h2>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-surface-2 flex items-center justify-center text-text-secondary"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] space-y-4"
            >
              {/* Date + Title row */}
              <div className="flex gap-3">
                <div className="w-36 flex-shrink-0">
                  <label className={labelCls}>Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={cn(inputCls, "text-[14px]")}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <label className={labelCls}>Title</label>
                  <input
                    ref={titleRef}
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Kickoff call"
                    className={inputCls}
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Attendees */}
              <div>
                <label className={labelCls}>Attendees</label>
                <input
                  type="text"
                  value={attendees}
                  onChange={(e) => setAttendees(e.target.value)}
                  placeholder="John, Sarah, Mike"
                  className={inputCls}
                  autoComplete="off"
                />
              </div>

              {/* Notes */}
              <div>
                <label className={labelCls}>Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Key discussion points…"
                  rows={4}
                  className={cn(inputCls, "resize-none leading-relaxed")}
                />
              </div>

              {/* Action Items */}
              <div>
                <label className={labelCls}>Action Items</label>
                <textarea
                  value={actionItems}
                  onChange={(e) => setActionItems(e.target.value)}
                  placeholder={"Follow up with client\nSend proposal draft\nSchedule next call"}
                  rows={4}
                  className={cn(inputCls, "resize-none leading-relaxed font-mono text-[13px]")}
                />
                <p className="text-[11px] text-text-muted mt-1">
                  One item per line
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!title.trim() || submitting}
                className={cn(
                  "w-full py-3 rounded-xl text-[15px] font-semibold transition-colors",
                  title.trim()
                    ? "bg-accent text-white"
                    : "bg-surface-2 text-text-muted"
                )}
              >
                {submitting
                  ? isEditing
                    ? "Saving…"
                    : "Logging…"
                  : isEditing
                    ? "Save Changes"
                    : "Log Meeting"}
              </button>

              {/* Delete (editing only) */}
              {isEditing && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full py-2.5 rounded-xl text-[14px] font-medium text-danger/70 hover:text-danger transition-colors"
                >
                  {deleting ? "Deleting…" : "Delete Meeting"}
                </button>
              )}
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
