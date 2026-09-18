import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { children, parents } from "@/db/schema";
import { eq, ilike, desc, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const activeOnly = searchParams.get("activeOnly") !== "false";

    const conditions = [];
    if (activeOnly) conditions.push(eq(children.isActive, true));
    if (search) conditions.push(ilike(children.fullName, `%${search}%`));

    const result = await db.query.children.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: { parents: true },
      orderBy: [desc(children.createdAt)],
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/children error:", error);
    return NextResponse.json({ error: "Failed to fetch children" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fullName, fullNameAr, age, dateOfBirth, skillLevel,
      avatarColor, notes, tags,
      parentName, parentNameAr, parentPhone, parentRelationship,
      homeAddress, locationNotes,
    } = body;

    const [child] = await db.insert(children).values({
      fullName,
      fullNameAr,
      age: age ? parseInt(age) : null,
      dateOfBirth,
      skillLevel: skillLevel || "beginner",
      avatarColor: avatarColor || "#f59e0b",
      notes,
      tags: tags || [],
    }).returning();

    if (parentName && parentPhone) {
      await db.insert(parents).values({
        childId: child.id,
        name: parentName,
        nameAr: parentNameAr,
        phone: parentPhone,
        relationship: parentRelationship || "parent",
        homeAddress,
        locationNotes,
      });
    }

    const fullChild = await db.query.children.findFirst({
      where: eq(children.id, child.id),
      with: { parents: true },
    });

    return NextResponse.json(fullChild, { status: 201 });
  } catch (error) {
    console.error("POST /api/children error:", error);
    return NextResponse.json({ error: "Failed to create child" }, { status: 500 });
  }
}
