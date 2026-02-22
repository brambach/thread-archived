import { db } from "@/lib/db";
import { workProjects, workTasks, workMeetings } from "@/lib/db/schema";
import { asc, desc } from "drizzle-orm";
import { ProjectList } from "@/components/work/project-list";
import type { WorkProjectWithStats } from "@/types";

async function getProjects(): Promise<WorkProjectWithStats[]> {
  const [projects, allTasks, allMeetings] = await Promise.all([
    db
      .select()
      .from(workProjects)
      .orderBy(asc(workProjects.sortOrder), desc(workProjects.createdAt)),
    db
      .select({ projectId: workTasks.projectId, status: workTasks.status })
      .from(workTasks),
    db
      .select({ projectId: workMeetings.projectId, date: workMeetings.date })
      .from(workMeetings)
      .orderBy(desc(workMeetings.date)),
  ]);

  return projects.map((p) => {
    const pTasks = allTasks.filter((t) => t.projectId === p.id);
    const pMeetings = allMeetings.filter((m) => m.projectId === p.id);
    return {
      ...p,
      totalTasks: pTasks.length,
      doneTasks: pTasks.filter((t) => t.status === "done").length,
      lastMeetingDate: pMeetings[0]?.date ?? null,
    };
  });
}

export default async function WorkPage() {
  const projects = await getProjects();

  return (
    <div className="pt-2 pb-6">
      <ProjectList initialProjects={projects} />
    </div>
  );
}
