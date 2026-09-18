import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { messageTemplates } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const templates = await db.select().from(messageTemplates);
    return NextResponse.json(templates);
  } catch (error) {
    console.error("GET /api/templates error:", error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [template] = await db.insert(messageTemplates).values(body).returning();
    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("POST /api/templates error:", error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
