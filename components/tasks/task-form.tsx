"use client";

import { useRef, useState } from "react";

interface TaskFormProps {
  onAdd: (title: string) => Promise<void>;
}

export function TaskForm({ onAdd }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || submitting) return;

    setTitle(""); // Clear immediately so you can queue next task while this one saves
    setSubmitting(true);
    try {
      await onAdd(trimmed);
    } finally {
      setSubmitting(false);
      inputRef.current?.focus();
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
      </div>
    </form>
  );
}
