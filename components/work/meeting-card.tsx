"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { WorkMeeting } from "@/types";

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function countActionItems(actionItems: string | null): number {
  if (!actionItems?.trim()) return 0;
  return actionItems
    .split("\n")
    .filter((line) => line.trim().length > 0).length;
}

interface MeetingCardProps {
  meeting: WorkMeeting;
  onEdit: (meeting: WorkMeeting) => void;
  onDelete: (meetingId: string) => void;
  isLast?: boolean;
}

export function MeetingCard({
  meeting,
  onEdit,
  onDelete,
  isLast,
}: MeetingCardProps) {
  const actionCount = countActionItems(meeting.actionItems);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={cn(!isLast && "border-b border-border")}
    >
      <button
        onClick={() => onEdit(meeting)}
        className="w-full text-left px-4 py-3.5 active:bg-surface-2 transition-colors duration-150"
      >
        {/* Date */}
        <p className="text-[11px] font-mono text-text-muted mb-0.5">
          {formatDate(meeting.date)}
        </p>

        {/* Title */}
        <p className="text-[15px] font-semibold text-text leading-snug truncate">
          {meeting.title}
        </p>

        {/* Attendees */}
        {meeting.attendees && (
          <p className="text-[12px] text-text-secondary mt-0.5 truncate">
            {meeting.attendees}
          </p>
        )}

        {/* Notes preview + action count */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {meeting.notes && (
            <span className="text-[12px] text-text-muted truncate max-w-[200px]">
              {meeting.notes.split("\n")[0]}
            </span>
          )}
          {actionCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-accent bg-accent-dim px-1.5 py-0.5 rounded-full flex-shrink-0">
              <svg
                width="9"
                height="9"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              {actionCount} action{actionCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </button>

      {/* Delete button — positioned in corner */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden" />
    </motion.div>
  );
}
