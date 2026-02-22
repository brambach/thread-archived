"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MeetingCard } from "./meeting-card";
import { MeetingForm } from "./meeting-form";
import type { WorkMeeting } from "@/types";

interface MeetingListProps {
  projectId: string;
  initialMeetings: WorkMeeting[];
}

export function MeetingList({ projectId, initialMeetings }: MeetingListProps) {
  const [meetings, setMeetings] = useState<WorkMeeting[]>(initialMeetings);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WorkMeeting | undefined>();

  const handleCreate = useCallback((meeting: WorkMeeting) => {
    setMeetings((prev) =>
      [meeting, ...prev].sort((a, b) => b.date.localeCompare(a.date))
    );
  }, []);

  const handleUpdate = useCallback((updated: WorkMeeting) => {
    setMeetings((prev) =>
      prev
        .map((m) => (m.id === updated.id ? updated : m))
        .sort((a, b) => b.date.localeCompare(a.date))
    );
  }, []);

  const handleDelete = useCallback((meetingId: string) => {
    setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
  }, []);

  function openEdit(meeting: WorkMeeting) {
    setEditing(meeting);
    setFormOpen(true);
  }

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }

  function handleClose() {
    setFormOpen(false);
    setEditing(undefined);
  }

  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-text-muted">
          Meetings
        </span>
        <button
          onClick={openCreate}
          className="text-[12px] font-medium text-accent"
        >
          + Log Meeting
        </button>
      </div>

      <AnimatePresence mode="wait">
        {meetings.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-border bg-surface p-6 text-center"
          >
            <p className="text-text-secondary text-sm">No meetings logged.</p>
            <p className="text-text-muted text-xs mt-1">
              Log a meeting to keep notes and track action items.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            layout
            className="rounded-xl border border-border bg-surface overflow-hidden"
          >
            <AnimatePresence initial={false}>
              {meetings.map((meeting, i) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  isLast={i === meetings.length - 1}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <MeetingForm
        open={formOpen}
        onClose={handleClose}
        projectId={projectId}
        meeting={editing}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </section>
  );
}
