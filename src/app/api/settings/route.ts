import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { settings, customLevels, messageTemplates } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const allSettings = await db.select().from(settings);
    const levels = await db.select().from(customLevels).orderBy(customLevels.order);
    const templates = await db.select().from(messageTemplates);

    const settingsMap: Record<string, string> = {};
    for (const s of allSettings) {
      settingsMap[s.key] = s.value;
    }

    return NextResponse.json({ settings: settingsMap, customLevels: levels, messageTemplates: templates });
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { settings: settingsData } = body;

    for (const [key, value] of Object.entries(settingsData as Record<string, string>)) {
      await db
        .insert(settings)
        .values({ key, value: value.toString() })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value: value.toString(), updatedAt: new Date() },
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/settings error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
