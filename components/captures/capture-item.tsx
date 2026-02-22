"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Capture, WorkProject } from "@/types";

interface CaptureItemProps {
  capture: Capture;
  onConvertToTask: (capture: Capture) => Promise<void>;
  onConvertToJournal: (capture: Capture) => Promise<void>;
  onConvertToWork: (capture: Capture, projectId: string) => Promise<void>;
  onDismiss: (capture: Capture) => Promise<void>;
  isLast?: boolean;
}

function timeAgo(date: Date | null): string {
  if (!date) return "";
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function CaptureItem({
  capture,
  onConvertToTask,
  onConvertToJournal,
  onConvertToWork,
  onDismiss,
  isLast,
}: CaptureItemProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [showProjects, setShowProjects] = useState(false);
  const [projects, setProjects] = useState<WorkProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  const act = async (
    key: string,
    fn: () => Promise<void>
  ) => {
    setLoading(key);
    try {
      await fn();
    } finally {
      setLoading(null);
    }
  };

  const handleWorkClick = async () => {
    if (showProjects) {
      setShowProjects(false);
      return;
    }
    setProjectsLoading(true);
    setShowProjects(true);
    try {
      const res = await fetch("/api/work/projects");
      const data = await res.json();
      setProjects(data.filter((p: WorkProject) => p.status !== "archived"));
    } finally {
      setProjectsLoading(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={!isLast ? "border-b border-border" : undefined}
    >
      <div className="px-4 py-3.5">
        {/* Content */}
        <p className="text-[14px] text-text leading-snug line-clamp-3">
          {capture.content}
        </p>

        {/* Timestamp */}
        <p className="text-[11px] font-mono text-text-muted mt-1">
          {timeAgo(capture.createdAt)}
        </p>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
          {/* → Task */}
          <ActionButton
            label="→ Task"
            colorClass="text-success bg-success/10 hover:bg-success/20"
            loading={loading === "task"}
            onClick={() => act("task", () => onConvertToTask(capture))}
          />

          {/* → Journal */}
          <ActionButton
            label="→ Journal"
            colorClass="text-accent bg-accent/10 hover:bg-accent/20"
            loading={loading === "journal"}
            onClick={() => act("journal", () => onConvertToJournal(capture))}
          />

          {/* → Work */}
          <ActionButton
            label={showProjects ? "↑ Work" : "→ Work"}
            colorClass="text-amber-400 bg-amber-400/10 hover:bg-amber-400/20"
            loading={loading === "work"}
            onClick={handleWorkClick}
          />

          {/* Dismiss */}
          <button
            onClick={() => act("dismiss", () => onDismiss(capture))}
            disabled={loading === "dismiss"}
            className="ml-auto w-6 h-6 flex items-center justify-center text-text-muted opacity-40 hover:opacity-100 hover:text-danger transition-all duration-150"
            aria-label="Dismiss"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Project picker */}
        <AnimatePresence>
          {showProjects && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="mt-2.5 rounded-lg border border-border bg-surface-2 overflow-hidden">
                {projectsLoading ? (
                  <p className="text-[12px] text-text-muted px-3 py-2.5">
                    Loading projects…
                  </p>
                ) : projects.length === 0 ? (
                  <p className="text-[12px] text-text-muted px-3 py-2.5">
                    No active projects
                  </p>
                ) : (
                  projects.map((project, i) => (
                    <button
                      key={project.id}
                      onClick={() => {
                        setShowProjects(false);
                        act("work", () =>
                          onConvertToWork(capture, project.id)
                        );
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-surface transition-colors duration-100 ${
                        i < projects.length - 1 ? "border-b border-border" : ""
                      }`}
                    >
                      {project.color && (
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: project.color }}
                        />
                      )}
                      <span className="text-[13px] text-text truncate">
                        {project.name}
                      </span>
                      {project.client && (
                        <span className="text-[11px] text-text-muted ml-auto flex-shrink-0">
                          {project.client}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function ActionButton({
  label,
  colorClass,
  loading,
  onClick,
}: {
  label: string;
  colorClass: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors duration-150 disabled:opacity-50 ${colorClass}`}
    >
      {loading ? "…" : label}
    </button>
  );
}
