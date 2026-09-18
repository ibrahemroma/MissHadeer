import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sessionNotes } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const [updated] = await db.update(sessionNotes)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(sessionNotes.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/session-notes/[id] error:", error);
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
  }
}
