import { db } from "@/lib/db";
import { exercises } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { ProgressView } from "@/components/gym/progress-view";
import type { Exercise } from "@/types";

export default async function ProgressPage() {
  const exerciseList: Exercise[] = await db
    .select()
    .from(exercises)
    .orderBy(asc(exercises.muscleGroup), asc(exercises.name));

  return (
    <div className="pt-2 pb-6">
      <header className="py-2 pb-5">
        <h1 className="text-[26px] font-bold tracking-tight text-text leading-tight">
          Progress
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Weight over time by exercise
        </p>
      </header>

      <ProgressView exercises={exerciseList} />
    </div>
  );
}
