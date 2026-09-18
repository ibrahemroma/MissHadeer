import { NextResponse } from "next/server";
import { db } from "@/db";
import { sessions, children, sessionNotes } from "@/db/schema";
import { eq, and, gte, lte, count, sum } from "drizzle-orm";

export async function GET() {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const upcomingEnd = new Date(now);
    upcomingEnd.setDate(now.getDate() + 7);

    // Today's sessions
    const todaySessions = await db.query.sessions.findMany({
      where: and(
        gte(sessions.scheduledAt, todayStart),
        lte(sessions.scheduledAt, todayEnd),
        eq(sessions.status, "scheduled")
      ),
      with: { child: { with: { parents: true } }, notes: true },
      orderBy: (s, { asc }) => [asc(s.scheduledAt)],
    });

    // Upcoming sessions (next 7 days, excluding today)
    const tomorrowStart = new Date(todayEnd);
    tomorrowStart.setSeconds(tomorrowStart.getSeconds() + 1);
    const upcomingSessions = await db.query.sessions.findMany({
      where: and(
        gte(sessions.scheduledAt, tomorrowStart),
        lte(sessions.scheduledAt, upcomingEnd),
        eq(sessions.status, "scheduled")
      ),
      with: { child: { with: { parents: true } }, notes: true },
      orderBy: (s, { asc }) => [asc(s.scheduledAt)],
    });

    // Unpaid sessions
    const unpaidSessions = await db.query.sessions.findMany({
      where: and(
        eq(sessions.paymentStatus, "unpaid"),
        eq(sessions.status, "completed")
      ),
      with: { child: { with: { parents: true } } },
      orderBy: (s, { desc }) => [desc(s.scheduledAt)],
    });

    // Active children count
    const [activeChildrenResult] = await db
      .select({ count: count() })
      .from(children)
      .where(eq(children.isActive, true));

    // Sessions this week
    const [weekSessionsResult] = await db
      .select({ count: count() })
      .from(sessions)
      .where(and(
        gte(sessions.scheduledAt, weekStart),
        lte(sessions.scheduledAt, weekEnd),
        eq(sessions.status, "completed")
      ));

    // Sessions this month
    const [monthSessionsResult] = await db
      .select({ count: count() })
      .from(sessions)
      .where(and(
        gte(sessions.scheduledAt, monthStart),
        lte(sessions.scheduledAt, monthEnd),
        eq(sessions.status, "completed")
      ));

    // Income this month (paid sessions)
    const paidThisMonth = await db.query.sessions.findMany({
      where: and(
        gte(sessions.scheduledAt, monthStart),
        lte(sessions.scheduledAt, monthEnd),
        eq(sessions.paymentStatus, "paid")
      ),
    });

    const monthlyIncome = paidThisMonth.reduce((sum, s) => {
      return sum + (parseFloat(s.sessionPrice || "0") || 0);
    }, 0);

    return NextResponse.json({
      todaySessions,
      upcomingSessions,
      unpaidSessions,
      stats: {
        activeChildren: activeChildrenResult.count,
        weekSessions: weekSessionsResult.count,
        monthSessions: monthSessionsResult.count,
        monthlyIncome,
        unpaidCount: unpaidSessions.length,
      },
    });
  } catch (error) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
