import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { googleTokens } from "@/lib/db/schema";

export async function GET() {
  const rows = await db.select().from(googleTokens).limit(1);
  if (rows.length === 0) {
    return NextResponse.json({ connected: false, email: null });
  }
  return NextResponse.json({ connected: true, email: rows[0].email });
}

export async function DELETE() {
  await db.delete(googleTokens);
  return NextResponse.json({ success: true });
}
