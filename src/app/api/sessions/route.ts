import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sessions, children } from "@/db/schema";
import { eq, gte, lte, and, desc, between } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const childId = searchParams.get("childId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const paymentStatus = searchParams.get("paymentStatus");
    const status = searchParams.get("status");

    const conditions = [];

    if (childId) conditions.push(eq(sessions.childId, childId));
    if (paymentStatus) conditions.push(eq(sessions.paymentStatus, paymentStatus as "unpaid" | "paid" | "waived"));
    if (status) conditions.push(eq(sessions.status, status as "scheduled" | "completed" | "cancelled" | "rescheduled"));
    if (startDate) conditions.push(gte(sessions.scheduledAt, new Date(startDate)));
    if (endDate) conditions.push(lte(sessions.scheduledAt, new Date(endDate)));

    const result = await db.query.sessions.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        child: { with: { parents: true } },
        notes: true,
      },
      orderBy: [desc(sessions.scheduledAt)],
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/sessions error:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      childId, scheduledAt, durationMinutes, address, locationNotes,
      sessionPrice, currency, recurrenceType, recurrenceGroupId,
    } = body;

    // Conflict detection: check overlapping sessions
    const startTime = new Date(scheduledAt);
    const endTime = new Date(startTime.getTime() + (durationMinutes || 60) * 60 * 1000);

    const conflicts = await db.query.sessions.findMany({
      where: and(
        eq(sessions.status, "scheduled"),
        gte(sessions.scheduledAt, new Date(startTime.getTime() - 120 * 60 * 1000)),
        lte(sessions.scheduledAt, endTime)
      ),
    });

    const hasConflict = conflicts.some((s) => {
      const sStart = new Date(s.scheduledAt);
      const sEnd = new Date(sStart.getTime() + s.durationMinutes * 60 * 1000);
      return startTime < sEnd && endTime > sStart;
    });

    const [session] = await db.insert(sessions).values({
      childId,
      scheduledAt: new Date(scheduledAt),
      durationMinutes: durationMinutes || 60,
      address,
      locationNotes,
      sessionPrice: sessionPrice ? sessionPrice.toString() : null,
      currency: currency || "EGP",
      recurrenceType: recurrenceType || "none",
      recurrenceGroupId,
      status: "scheduled",
      paymentStatus: "unpaid",
    }).returning();

    return NextResponse.json(
      { ...session, hasConflict },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/sessions error:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
