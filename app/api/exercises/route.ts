import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { exercises } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";

const SEED_EXERCISES = [
  // Chest
  { name: "Bench Press", muscleGroup: "chest" },
  { name: "Incline Bench Press", muscleGroup: "chest" },
  { name: "Decline Bench Press", muscleGroup: "chest" },
  { name: "Dumbbell Fly", muscleGroup: "chest" },
  { name: "Cable Fly", muscleGroup: "chest" },
  { name: "Push-Up", muscleGroup: "chest" },
  { name: "Chest Dip", muscleGroup: "chest" },
  // Back
  { name: "Deadlift", muscleGroup: "back" },
  { name: "Pull-Up", muscleGroup: "back" },
  { name: "Chin-Up", muscleGroup: "back" },
  { name: "Lat Pulldown", muscleGroup: "back" },
  { name: "Barbell Row", muscleGroup: "back" },
  { name: "Dumbbell Row", muscleGroup: "back" },
  { name: "Cable Row", muscleGroup: "back" },
  { name: "Face Pull", muscleGroup: "back" },
  { name: "Straight-Arm Pulldown", muscleGroup: "back" },
  // Legs
  { name: "Squat", muscleGroup: "legs" },
  { name: "Front Squat", muscleGroup: "legs" },
  { name: "Leg Press", muscleGroup: "legs" },
  { name: "Romanian Deadlift", muscleGroup: "legs" },
  { name: "Leg Curl", muscleGroup: "legs" },
  { name: "Leg Extension", muscleGroup: "legs" },
  { name: "Calf Raise", muscleGroup: "legs" },
  { name: "Hip Thrust", muscleGroup: "legs" },
  { name: "Bulgarian Split Squat", muscleGroup: "legs" },
  { name: "Lunges", muscleGroup: "legs" },
  { name: "Hack Squat", muscleGroup: "legs" },
  // Shoulders
  { name: "Overhead Press", muscleGroup: "shoulders" },
  { name: "Dumbbell Shoulder Press", muscleGroup: "shoulders" },
  { name: "Arnold Press", muscleGroup: "shoulders" },
  { name: "Lateral Raise", muscleGroup: "shoulders" },
  { name: "Front Raise", muscleGroup: "shoulders" },
  { name: "Rear Delt Fly", muscleGroup: "shoulders" },
  { name: "Upright Row", muscleGroup: "shoulders" },
  { name: "Shrug", muscleGroup: "shoulders" },
  // Arms
  { name: "Barbell Curl", muscleGroup: "arms" },
  { name: "Dumbbell Curl", muscleGroup: "arms" },
  { name: "Hammer Curl", muscleGroup: "arms" },
  { name: "Preacher Curl", muscleGroup: "arms" },
  { name: "Cable Curl", muscleGroup: "arms" },
  { name: "Tricep Pushdown", muscleGroup: "arms" },
  { name: "Skull Crusher", muscleGroup: "arms" },
  { name: "Close-Grip Bench Press", muscleGroup: "arms" },
  { name: "Overhead Tricep Extension", muscleGroup: "arms" },
  { name: "Dips", muscleGroup: "arms" },
  // Core
  { name: "Plank", muscleGroup: "core" },
  { name: "Crunch", muscleGroup: "core" },
  { name: "Russian Twist", muscleGroup: "core" },
  { name: "Leg Raise", muscleGroup: "core" },
  { name: "Ab Rollout", muscleGroup: "core" },
  { name: "Cable Crunch", muscleGroup: "core" },
];

export async function GET() {
  let all = await db
    .select()
    .from(exercises)
    .orderBy(asc(exercises.muscleGroup), asc(exercises.name));

  if (all.length === 0) {
    await db.insert(exercises).values(
      SEED_EXERCISES.map((e) => ({ ...e, isCustom: false }))
    );
    all = await db
      .select()
      .from(exercises)
      .orderBy(asc(exercises.muscleGroup), asc(exercises.name));
  }

  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  const { name, muscleGroup } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const [exercise] = await db
    .insert(exercises)
    .values({ name: name.trim(), muscleGroup: muscleGroup ?? null, isCustom: true })
    .returning();

  return NextResponse.json(exercise, { status: 201 });
}
