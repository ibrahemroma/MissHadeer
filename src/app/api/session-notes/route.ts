import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sessionNotes, sessions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sessionId, childId,
      topicsCovered, topicsPending,
      strengths, strengthsText, weaknesses, weaknessesText,
      nextSessionFocus, reviewItems, freeNotes,
      strengthTags, weaknessTags,
    } = body;

    // Mark session as completed when notes are added
    await db.update(sessions)
      .set({ status: "completed", updatedAt: new Date() })
      .where(eq(sessions.id, sessionId));

    const [note] = await db.insert(sessionNotes).values({
      sessionId,
      childId,
      topicsCovered,
      topicsPending,
      strengths: strengths || [],
      strengthsText,
      weaknesses: weaknesses || [],
      weaknessesText,
      nextSessionFocus,
      reviewItems,
      freeNotes,
      strengthTags: strengthTags || [],
      weaknessTags: weaknessTags || [],
    }).returning();

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("POST /api/session-notes error:", error);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}
