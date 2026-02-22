import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workProjects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// PATCH /api/work/projects/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { name, client, description, status, color, sortOrder } = body;

  const updateData: Partial<{
    name: string;
    client: string | null;
    description: string | null;
    status: string;
    color: string | null;
    sortOrder: number;
    updatedAt: Date;
  }> = { updatedAt: new Date() };

  if (name !== undefined) updateData.name = name.trim();
  if (client !== undefined) updateData.client = client?.trim() || null;
  if (description !== undefined)
    updateData.description = description?.trim() || null;
  if (status !== undefined) updateData.status = status;
  if (color !== undefined) updateData.color = color;
  if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

  const [updated] = await db
    .update(workProjects)
    .set(updateData)
    .where(eq(workProjects.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

// DELETE /api/work/projects/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(workProjects).where(eq(workProjects.id, id));
  return NextResponse.json({ success: true });
}
