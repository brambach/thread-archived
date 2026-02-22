"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ProjectCard } from "./project-card";
import { ProjectForm } from "./project-form";
import type { WorkProjectWithStats } from "@/types";

const STATUS_ORDER = ["active", "paused", "blocked", "done", "archived"];

interface ProjectListProps {
  initialProjects: WorkProjectWithStats[];
}

export function ProjectList({ initialProjects }: ProjectListProps) {
  const [projects, setProjects] =
    useState<WorkProjectWithStats[]>(initialProjects);
  const [formOpen, setFormOpen] = useState(false);

  // Status summary counts
  const counts = {
    active: projects.filter((p) => p.status === "active").length,
    blocked: projects.filter((p) => p.status === "blocked").length,
    paused: projects.filter((p) => p.status === "paused").length,
    done: projects.filter((p) => p.status === "done").length,
  };

  // Sort by status priority, then sortOrder
  const sorted = [...projects].sort((a, b) => {
    const ai = STATUS_ORDER.indexOf(a.status ?? "active");
    const bi = STATUS_ORDER.indexOf(b.status ?? "active");
    if (ai !== bi) return ai - bi;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });

  const handleCreate = useCallback((project: WorkProjectWithStats) => {
    setProjects((prev) => [...prev, project]);
  }, []);

  const visibleCount = projects.filter((p) => p.status !== "archived").length;

  return (
    <>
      {/* Header */}
      <header className="flex items-center justify-between py-2 pb-5">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-text leading-tight">
            Work
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {visibleCount} project{visibleCount !== 1 ? "s" : ""}
          </p>
        </div>
        {projects.length > 0 && (
          <button
            onClick={() => setFormOpen(true)}
            className="text-xs font-medium text-accent"
          >
            + New
          </button>
        )}
      </header>

      {/* Status summary */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {counts.active > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-accent-dim text-accent">
            {counts.active} active
          </span>
        )}
        {counts.blocked > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-500/10 text-red-400">
            {counts.blocked} blocked
          </span>
        )}
        {counts.paused > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400">
            {counts.paused} paused
          </span>
        )}
        {counts.done > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-500/10 text-green-400">
            {counts.done} done
          </span>
        )}
        {projects.length === 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-2 text-text-muted">
            No projects
          </span>
        )}
      </div>

      {/* List */}
      <AnimatePresence mode="wait">
        {sorted.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-border bg-surface p-8 text-center"
          >
            <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center mx-auto mb-3">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-text-muted"
              >
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                <line x1="12" y1="12" x2="12" y2="16" />
                <line x1="10" y1="14" x2="14" y2="14" />
              </svg>
            </div>
            <p className="text-text-secondary text-sm font-medium">
              No projects yet.
            </p>
            <p className="text-text-muted text-xs mt-1">
              Create a project to start tracking your work.
            </p>
            <button
              onClick={() => setFormOpen(true)}
              className="mt-4 px-4 py-2 bg-accent text-white rounded-lg text-[13px] font-medium"
            >
              Create Project
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            layout
            className="rounded-xl border border-border bg-surface overflow-hidden"
          >
            <AnimatePresence initial={false}>
              {sorted.map((project, i) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  isLast={i === sorted.length - 1}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <ProjectForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onCreate={handleCreate}
      />
    </>
  );
}
