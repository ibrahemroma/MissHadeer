import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { children, parents } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const child = await db.query.children.findFirst({
      where: eq(children.id, id),
      with: {
        parents: true,
        sessions: {
          with: { notes: true },
          orderBy: (s, { desc }) => [desc(s.scheduledAt)],
        },
      },
    });

    if (!child) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    return NextResponse.json(child);
  } catch (error) {
    console.error("GET /api/children/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch child" }, { status: 500 });
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
      fullName, fullNameAr, age, dateOfBirth, skillLevel,
      avatarColor, notes, tags, isActive,
      parentName, parentNameAr, parentPhone, parentRelationship,
      homeAddress, locationNotes, parentId,
    } = body;

    await db.update(children).set({
      fullName,
      fullNameAr,
      age: age ? parseInt(age) : null,
      dateOfBirth,
      skillLevel,
      avatarColor,
      notes,
      tags: tags || [],
      isActive: isActive !== undefined ? isActive : true,
      updatedAt: new Date(),
    }).where(eq(children.id, id));

    if (parentId && parentName && parentPhone) {
      await db.update(parents).set({
        name: parentName,
        nameAr: parentNameAr,
        phone: parentPhone,
        relationship: parentRelationship || "parent",
        homeAddress,
        locationNotes,
        updatedAt: new Date(),
      }).where(eq(parents.id, parentId));
    } else if (parentName && parentPhone) {
      await db.insert(parents).values({
        childId: id,
        name: parentName,
        nameAr: parentNameAr,
        phone: parentPhone,
        relationship: parentRelationship || "parent",
        homeAddress,
        locationNotes,
      });
    }

    const updated = await db.query.children.findFirst({
      where: eq(children.id, id),
      with: { parents: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/children/[id] error:", error);
    return NextResponse.json({ error: "Failed to update child" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.update(children).set({ isActive: false }).where(eq(children.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/children/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete child" }, { status: 500 });
  }
}
