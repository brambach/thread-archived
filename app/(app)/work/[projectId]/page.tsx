import { db } from "@/lib/db";
import { workProjects, workTasks, workMeetings } from "@/lib/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ProjectDetail } from "@/components/work/project-detail";

export default async function WorkProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const [projectRows, tasks, meetings] = await Promise.all([
    db
      .select()
      .from(workProjects)
      .where(eq(workProjects.id, projectId)),
    db
      .select()
      .from(workTasks)
      .where(eq(workTasks.projectId, projectId))
      .orderBy(asc(workTasks.sortOrder), asc(workTasks.createdAt)),
    db
      .select()
      .from(workMeetings)
      .where(eq(workMeetings.projectId, projectId))
      .orderBy(desc(workMeetings.date), desc(workMeetings.createdAt)),
  ]);

  const project = projectRows[0];
  if (!project) notFound();

  return (
    <ProjectDetail
      project={project}
      initialTasks={tasks}
      initialMeetings={meetings}
    />
  );
}
