"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { WorkProject, WorkProjectWithStats } from "@/types";

const COLORS = [
  "#7C6FCD",
  "#4ADE80",
  "#F59E0B",
  "#EF4444",
  "#3B82F6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
];

const STATUSES = ["active", "paused", "blocked", "done", "archived"] as const;

interface ProjectFormProps {
  open: boolean;
  onClose: () => void;
  project?: WorkProject;
  onCreate?: (project: WorkProjectWithStats) => void;
  onUpdate?: (project: WorkProject) => void;
}

export function ProjectForm({
  open,
  onClose,
  project,
  onCreate,
  onUpdate,
}: ProjectFormProps) {
  const isEditing = !!project;
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [status, setStatus] = useState("active");
  const [color, setColor] = useState(COLORS[0]);
  const [submitting, setSubmitting] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  // Populate form when editing
  useEffect(() => {
    if (open) {
      if (project) {
        setName(project.name);
        setClient(project.client ?? "");
        setStatus(project.status ?? "active");
        setColor(project.color ?? COLORS[0]);
      } else {
        setName("");
        setClient("");
        setStatus("active");
        setColor(COLORS[0]);
      }
      setTimeout(() => nameRef.current?.focus(), 350);
    }
  }, [open, project]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || submitting) return;

    setSubmitting(true);
    try {
      if (isEditing && project) {
        const res = await fetch(`/api/work/projects/${project.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            client: client.trim() || null,
            status,
            color,
          }),
        });
        if (!res.ok) throw new Error("Failed");
        const updated = await res.json();
        onUpdate?.(updated);
      } else {
        const res = await fetch("/api/work/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            client: client.trim() || null,
            status,
            color,
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
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-surface rounded-t-2xl max-h-[85dvh]"
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
                {isEditing ? "Edit Project" : "New Project"}
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
              className="flex-1 overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            >
              {/* Project name */}
              <div className="mb-4">
                <label className="text-[11px] font-semibold tracking-wider uppercase text-text-muted block mb-1.5">
                  Project Name
                </label>
                <input
                  ref={nameRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Acme Corp — Salesforce Integration"
                  className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-[15px] text-text placeholder-text-muted focus:outline-none focus:border-accent"
                  autoComplete="off"
                />
              </div>

              {/* Client */}
              <div className="mb-4">
                <label className="text-[11px] font-semibold tracking-wider uppercase text-text-muted block mb-1.5">
                  Client
                </label>
                <input
                  type="text"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="Acme Corp"
                  className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-[15px] text-text placeholder-text-muted focus:outline-none focus:border-accent"
                  autoComplete="off"
                />
              </div>

              {/* Status */}
              <div className="mb-4">
                <label className="text-[11px] font-semibold tracking-wider uppercase text-text-muted block mb-1.5">
                  Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-[12px] font-medium capitalize transition-colors border",
                        status === s
                          ? "bg-accent text-white border-accent"
                          : "bg-surface-2 text-text-secondary border-border"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div className="mb-6">
                <label className="text-[11px] font-semibold tracking-wider uppercase text-text-muted block mb-1.5">
                  Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-95"
                      style={{ backgroundColor: c }}
                    >
                      {color === c && (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!name.trim() || submitting}
                className={cn(
                  "w-full py-3 rounded-xl text-[15px] font-semibold transition-colors",
                  name.trim()
                    ? "bg-accent text-white"
                    : "bg-surface-2 text-text-muted"
                )}
              >
                {submitting
                  ? isEditing
                    ? "Saving…"
                    : "Creating…"
                  : isEditing
                    ? "Save Changes"
                    : "Create Project"}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
