"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { WorkProjectWithStats } from "@/types";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-accent-dim text-accent",
  blocked: "bg-red-500/10 text-red-400",
  paused: "bg-amber-500/10 text-amber-400",
  done: "bg-green-500/10 text-green-400",
  archived: "bg-surface-2 text-text-muted",
};

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

interface ProjectCardProps {
  project: WorkProjectWithStats;
  isLast?: boolean;
}

export function ProjectCard({ project, isLast }: ProjectCardProps) {
  const { totalTasks, doneTasks, lastMeetingDate } = project;
  const progress = totalTasks > 0 ? doneTasks / totalTasks : 0;
  const statusStyle = STATUS_STYLES[project.status ?? "active"] ?? STATUS_STYLES.active;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={cn(!isLast && "border-b border-border")}
    >
      <Link
        href={`/work/${project.id}`}
        className="flex items-stretch gap-0 active:bg-surface-2 transition-colors duration-150"
      >
        {/* Color bar */}
        <div
          className="w-[3px] rounded-l-none flex-shrink-0 my-3 ml-0 rounded-r-sm"
          style={{ backgroundColor: project.color ?? "#7C6FCD" }}
        />

        {/* Content */}
        <div className="flex-1 min-w-0 px-4 py-3.5">
          {/* Top row: client + status */}
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <span className="text-[11px] font-medium text-text-muted truncate">
              {project.client ?? "—"}
            </span>
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide flex-shrink-0",
                statusStyle
              )}
            >
              {project.status ?? "active"}
            </span>
          </div>

          {/* Project name */}
          <p className="text-[15px] font-semibold text-text leading-snug truncate">
            {project.name}
          </p>

          {/* Progress + last meeting */}
          <div className="mt-2.5 flex items-center gap-3">
            {totalTasks > 0 ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* Progress bar */}
                <div className="flex-1 h-[3px] bg-surface-2 rounded-full overflow-hidden max-w-[80px]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progress * 100}%`,
                      backgroundColor: project.color ?? "#7C6FCD",
                    }}
                  />
                </div>
                <span className="text-[11px] font-mono text-text-muted flex-shrink-0">
                  {doneTasks}/{totalTasks}
                </span>
              </div>
            ) : (
              <span className="text-[11px] text-text-muted flex-1">
                No tasks yet
              </span>
            )}

            {lastMeetingDate && (
              <span className="text-[11px] text-text-muted flex-shrink-0">
                Met {formatDate(lastMeetingDate)}
              </span>
            )}
          </div>
        </div>

        {/* Chevron */}
        <div className="flex items-center pr-4 text-text-muted/30">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </Link>
    </motion.div>
  );
}
