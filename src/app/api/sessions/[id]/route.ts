import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, id),
      with: {
        child: { with: { parents: true } },
        notes: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("GET /api/sessions/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      scheduledAt, durationMinutes, status, address,
      locationNotes, paymentStatus, sessionPrice, currency,
    } = body;

    const updateData: Partial<typeof sessions.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (scheduledAt !== undefined) updateData.scheduledAt = new Date(scheduledAt);
    if (durationMinutes !== undefined) updateData.durationMinutes = durationMinutes;
    if (status !== undefined) updateData.status = status;
    if (address !== undefined) updateData.address = address;
    if (locationNotes !== undefined) updateData.locationNotes = locationNotes;
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    if (sessionPrice !== undefined) updateData.sessionPrice = sessionPrice?.toString() ?? null;
    if (currency !== undefined) updateData.currency = currency;

    const [updated] = await db.update(sessions)
      .set(updateData)
      .where(eq(sessions.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/sessions/[id] error:", error);
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.update(sessions)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(sessions.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/sessions/[id] error:", error);
    return NextResponse.json({ error: "Failed to cancel session" }, { status: 500 });
  }
}
