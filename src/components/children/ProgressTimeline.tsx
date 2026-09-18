"use client";
import { formatShortDate, formatTime } from "@/lib/utils";
import type { Session, SessionNote } from "@/db/schema";

interface SessionWithNotes extends Session {
  notes: SessionNote[];
}

interface ProgressTimelineProps {
  sessions: SessionWithNotes[];
}

const STATUS_COLORS: Record<string, string> = {
  completed: "#10b981",
  scheduled: "#6366f1",
  cancelled: "#ef4444",
  rescheduled: "#f59e0b",
};

const STATUS_LABELS: Record<string, string> = {
  completed: "مكتملة",
  scheduled: "مجدولة",
  cancelled: "ملغاة",
  rescheduled: "معادة جدولة",
};

export function ProgressTimeline({ sessions }: ProgressTimelineProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <div className="text-4xl mb-2">📅</div>
        <p className="text-sm">لا توجد حصص بعد</p>
      </div>
    );
  }

  const sorted = [...sessions].sort(
    (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
  );

  const completed = sorted.filter((s) => s.status === "completed");
  const scheduled = sorted.filter((s) => s.status === "scheduled");

  return (
    <div className="space-y-4">
      {/* Summary Bar */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-violet-50 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-violet-600">{sessions.length}</div>
          <div className="text-xs text-violet-400">إجمالي الحصص</div>
        </div>
        <div className="bg-emerald-50 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-emerald-600">{completed.length}</div>
          <div className="text-xs text-emerald-400">مكتملة</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{scheduled.length}</div>
          <div className="text-xs text-blue-400">مجدولة</div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {sorted.map((session, index) => {
          const note = session.notes?.[0];
          const color = STATUS_COLORS[session.status] || "#6366f1";
          const isLast = index === sorted.length - 1;

          return (
            <div key={session.id} className="flex gap-3 relative">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5"
                  style={{ backgroundColor: color }}
                />
                {!isLast && (
                  <div className="w-0.5 flex-1 bg-gray-100 mt-1" style={{ minHeight: "24px" }} />
                )}
              </div>

              {/* Content */}
              <div className={`flex-1 pb-4 ${isLast ? "" : ""}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-gray-700">
                    {formatShortDate(session.scheduledAt)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatTime(session.scheduledAt)}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ color, backgroundColor: `${color}20` }}
                  >
                    {STATUS_LABELS[session.status]}
                  </span>
                  {session.paymentStatus === "paid" && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-600">
                      ✓ مدفوعة
                    </span>
                  )}
                  {session.paymentStatus === "unpaid" && session.status === "completed" && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-500">
                      غير مدفوعة
                    </span>
                  )}
                </div>

                {note && (
                  <div className="mt-2 bg-gray-50 rounded-xl p-3 space-y-1.5">
                    {note.topicsCovered && (
                      <div>
                        <span className="text-xs font-bold text-blue-600">📚 درسنا: </span>
                        <span className="text-xs text-gray-600">{note.topicsCovered}</span>
                      </div>
                    )}
                    {(note.strengthTags as string[])?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {(note.strengthTags as string[]).map((tag: string) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full"
                          >
                            ⭐ {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {(note.weaknessTags as string[])?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {(note.weaknessTags as string[]).map((tag: string) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full"
                          >
                            🎯 {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {note.nextSessionFocus && (
                      <div>
                        <span className="text-xs font-bold text-violet-600">🔮 القادم: </span>
                        <span className="text-xs text-gray-600">{note.nextSessionFocus}</span>
                      </div>
                    )}
                  </div>
                )}

                {!note && session.status === "scheduled" && (
                  <p className="text-xs text-gray-400 mt-1 italic">حصة مجدولة - في انتظار الملاحظات</p>
                )}
                {!note && session.status === "completed" && (
                  <p className="text-xs text-gray-400 mt-1 italic">لم تُضف ملاحظات لهذه الحصة</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
