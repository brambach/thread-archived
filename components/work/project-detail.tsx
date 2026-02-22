"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { WorkTaskList } from "./work-task-list";
import { MeetingList } from "./meeting-list";
import { ProjectForm } from "./project-form";
import type { WorkProject, WorkTask, WorkMeeting } from "@/types";

type Tab = "tasks" | "meetings" | "notes";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-accent-dim text-accent",
  blocked: "bg-red-500/10 text-red-400",
  paused: "bg-amber-500/10 text-amber-400",
  done: "bg-green-500/10 text-green-400",
  archived: "bg-surface-2 text-text-muted",
};

const STATUSES = ["active", "paused", "blocked", "done", "archived"] as const;

// Debounced notes auto-save
function NotesEditor({
  project,
  onSave,
}: {
  project: WorkProject;
  onSave: (description: string) => void;
}) {
  const [value, setValue] = useState(project.description ?? "");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef(project.description ?? "");
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (value === lastSavedRef.current) return;
      setSaveStatus("saving");
      try {
        const res = await fetch(`/api/work/projects/${project.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: value }),
        });
        if (!res.ok) throw new Error();
        lastSavedRef.current = value;
        onSave(value);
        setSaveStatus("saved");
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
      } catch {
        setSaveStatus("idle");
      }
    }, 800);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, project.id, onSave]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-text-muted">
          Notes
        </span>
        <AnimatePresence mode="wait">
          {saveStatus === "saving" && (
            <motion.span
              key="saving"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
              className="text-[11px] font-mono text-success"
            >
              Saved ✓
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Context, links, current status, blockers…"
        className={cn(
          "w-full min-h-[50vh] resize-none bg-transparent",
          "text-[15px] leading-[1.8] text-text",
          "placeholder:text-text-muted",
          "border-none outline-none focus:outline-none",
          "font-sans caret-accent"
        )}
        style={{ overflow: "hidden" }}
      />
    </div>
  );
}

interface ProjectDetailProps {
  project: WorkProject;
  initialTasks: WorkTask[];
  initialMeetings: WorkMeeting[];
}

export function ProjectDetail({
  project: initialProject,
  initialTasks,
  initialMeetings,
}: ProjectDetailProps) {
  const router = useRouter();
  const [project, setProject] = useState(initialProject);
  const [activeTab, setActiveTab] = useState<Tab>("tasks");
  const [statusOpen, setStatusOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [liveTasks, setLiveTasks] = useState(initialTasks);

  const taskTotal = liveTasks.length;
  const taskDone = liveTasks.filter((t) => t.status === "done").length;

  const handleTasksChange = useCallback((tasks: WorkTask[]) => {
    setLiveTasks(tasks);
  }, []);

  const handleStatusChange = useCallback(
    async (newStatus: string) => {
      const prev = project.status;
      setProject((p) => ({ ...p, status: newStatus }));
      setStatusOpen(false);
      try {
        await fetch(`/api/work/projects/${project.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
      } catch {
        setProject((p) => ({ ...p, status: prev }));
      }
    },
    [project.id, project.status]
  );

  const handleProjectUpdate = useCallback((updated: WorkProject) => {
    setProject(updated);
  }, []);

  const handleNotesSave = useCallback((description: string) => {
    setProject((p) => ({ ...p, description }));
  }, []);

  const handleDelete = useCallback(async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await fetch(`/api/work/projects/${project.id}`, { method: "DELETE" });
      router.push("/work");
    } catch {
      setDeleting(false);
    }
  }, [project.id, router, deleting]);

  const tabs: { id: Tab; label: string; badge?: string }[] = [
    {
      id: "tasks",
      label: "Tasks",
      badge: taskTotal > 0 ? `${taskDone}/${taskTotal}` : undefined,
    },
    {
      id: "meetings",
      label: "Meetings",
      badge:
        initialMeetings.length > 0
          ? String(initialMeetings.length)
          : undefined,
    },
    { id: "notes", label: "Notes" },
  ];

  return (
    <div className="pt-2 pb-6">
      {/* ── Back nav ── */}
      <div className="flex items-center gap-2 mb-4 -ml-1">
        <Link
          href="/work"
          className="flex items-center gap-1 text-text-secondary hover:text-text transition-colors py-1 px-1"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          <span className="text-[13px] font-medium">Work</span>
        </Link>
      </div>

      {/* ── Project header card ── */}
      <div
        className="rounded-xl border border-border bg-surface overflow-hidden mb-5"
        style={{ borderLeftColor: project.color ?? "#7C6FCD", borderLeftWidth: 3 }}
      >
        <div className="px-4 py-3.5">
          {/* Client + edit button row */}
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[11px] font-medium text-text-muted">
              {project.client ?? "—"}
            </span>
            <button
              onClick={() => setEditFormOpen(true)}
              className="text-[11px] font-medium text-text-muted hover:text-text transition-colors"
            >
              Edit
            </button>
          </div>

          {/* Project name */}
          <h1 className="text-[22px] font-bold tracking-tight text-text leading-tight">
            {project.name}
          </h1>

          {/* Status dropdown */}
          <div className="relative mt-2.5 inline-block">
            <button
              onClick={() => setStatusOpen((o) => !o)}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide transition-opacity active:opacity-70",
                STATUS_STYLES[project.status ?? "active"] ??
                  STATUS_STYLES.active
              )}
            >
              {project.status ?? "active"}
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            <AnimatePresence>
              {statusOpen && (
                <>
                  <motion.div
                    className="fixed inset-0 z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setStatusOpen(false)}
                  />
                  <motion.div
                    className="absolute left-0 top-full mt-1 z-20 bg-surface border border-border rounded-xl overflow-hidden shadow-xl min-w-[120px]"
                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                  >
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        className={cn(
                          "w-full text-left px-3.5 py-2.5 text-[13px] font-medium capitalize hover:bg-surface-2 transition-colors",
                          project.status === s
                            ? "text-accent"
                            : "text-text-secondary"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-0 mb-5 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium border-b-[2px] -mb-px transition-colors",
              activeTab === tab.id
                ? "border-accent text-text"
                : "border-transparent text-text-secondary hover:text-text"
            )}
          >
            {tab.label}
            {tab.badge && (
              <span
                className={cn(
                  "text-[10px] font-mono px-1.5 py-0.5 rounded-full",
                  activeTab === tab.id
                    ? "bg-accent-dim text-accent"
                    : "bg-surface-2 text-text-muted"
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">
        {activeTab === "tasks" && (
          <motion.div
            key="tasks"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            <WorkTaskList
              projectId={project.id}
              initialTasks={initialTasks}
              onTasksChange={handleTasksChange}
            />
          </motion.div>
        )}

        {activeTab === "meetings" && (
          <motion.div
            key="meetings"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            <MeetingList
              projectId={project.id}
              initialMeetings={initialMeetings}
            />
          </motion.div>
        )}

        {activeTab === "notes" && (
          <motion.div
            key="notes"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            <NotesEditor project={project} onSave={handleNotesSave} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Danger zone ── */}
      <div className="mt-12 pt-5 border-t border-border">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-[13px] font-medium text-danger/50 hover:text-danger transition-colors"
        >
          {deleting ? "Deleting project…" : "Delete project"}
        </button>
      </div>

      {/* Edit form */}
      <ProjectForm
        open={editFormOpen}
        onClose={() => setEditFormOpen(false)}
        project={project}
        onUpdate={handleProjectUpdate}
      />
    </div>
  );
}
