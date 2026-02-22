"use client";

import { useRef, useState } from "react";
import { getLocalToday } from "@/lib/utils";

interface TaskFormProps {
  onAdd: (title: string, date?: string) => Promise<void>;
}

function formatDateLabel(dateStr: string): string {
  const today = getLocalToday();
  if (dateStr === today) return "Today";

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
  if (dateStr === tomorrowStr) return "Tomorrow";

  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function TaskForm({ onAdd }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || submitting) return;

    const date = selectedDate || undefined;
    setTitle("");
    setSelectedDate(null);
    setShowDatePicker(false);
    setSubmitting(true);
    try {
      await onAdd(trimmed, date);
    } finally {
      setSubmitting(false);
      inputRef.current?.focus();
    }
  };

  const handleDateTap = () => {
    if (showDatePicker) {
      setSelectedDate(null);
      setShowDatePicker(false);
    } else {
      // Open native date picker
      dateInputRef.current?.showPicker?.();
      setShowDatePicker(true);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      setSelectedDate(val);
      setShowDatePicker(true);
    } else {
      setSelectedDate(null);
      setShowDatePicker(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <div className="flex items-center gap-3.5 px-4 py-3 rounded-xl border border-border bg-surface transition-colors duration-150 focus-within:border-accent/40">
        {/* Plus icon — mirrors the checkbox shape */}
        <div className="w-[22px] h-[22px] rounded-[6px] border-[1.5px] border-border flex items-center justify-center text-text-muted flex-shrink-0">
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task..."
          className="flex-1 bg-transparent text-[15px] text-text placeholder:text-text-muted focus:outline-none"
          autoComplete="off"
          autoCorrect="off"
        />

        {/* Date picker button */}
        <button
          type="button"
          onClick={handleDateTap}
          className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
            selectedDate
              ? "text-accent bg-accent/10"
              : "text-text-muted hover:text-text-secondary"
          }`}
          aria-label="Pick date"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </button>

        {/* Hidden native date input */}
        <input
          ref={dateInputRef}
          type="date"
          value={selectedDate || ""}
          onChange={handleDateChange}
          min={getLocalToday()}
          className="sr-only absolute"
          tabIndex={-1}
        />
      </div>

      {/* Selected date chip */}
      {selectedDate && (
        <div className="mt-1.5 flex items-center gap-1.5 px-4">
          <span className="text-[11px] font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">
            {formatDateLabel(selectedDate)}
          </span>
          <button
            type="button"
            onClick={() => {
              setSelectedDate(null);
              setShowDatePicker(false);
            }}
            className="text-text-muted hover:text-text-secondary text-[11px]"
          >
            clear
          </button>
        </div>
      )}
    </form>
  );
}
