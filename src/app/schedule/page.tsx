"use client";
import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SessionCard } from "@/components/sessions/SessionCard";
import { Modal } from "@/components/ui/Modal";
import { SessionForm } from "@/components/sessions/SessionForm";
import { Button } from "@/components/ui/Button";
import { ChevronRight, ChevronLeft, Plus, Calendar, List } from "lucide-react";
import { formatShortDate, isToday } from "@/lib/utils";
import type { Session, Child, Parent, SessionNote } from "@/db/schema";

interface SessionWithRelations extends Session {
  child: Child & { parents: Parent[] };
  notes: SessionNote[];
}

interface ChildWithParent extends Child {
  parents: Parent[];
}

type ViewMode = "week" | "month" | "list";

export default function SchedulePage() {
  const [sessions, setSessions] = useState<SessionWithRelations[]>([]);
  const [children, setChildren] = useState<ChildWithParent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSession, setShowAddSession] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(
    new Date().toISOString().slice(0, 10)
  );
  const [filterStatus, setFilterStatus] = useState("all");

  const getDateRange = useCallback(() => {
    if (viewMode === "week") {
      const start = new Date(currentDate);
      start.setDate(currentDate.getDate() - currentDate.getDay());
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      return { start, end };
    } else if (viewMode === "month") {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
      return { start, end };
    } else {
      const start = new Date();
      start.setDate(start.getDate() - 7);
      const end = new Date();
      end.setDate(end.getDate() + 60);
      return { start, end };
    }
  }, [currentDate, viewMode]);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      const params = new URLSearchParams({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });
      if (filterStatus !== "all") params.set("status", filterStatus);

      const [sessRes, childRes] = await Promise.all([
        fetch(`/api/sessions?${params}`),
        fetch("/api/children"),
      ]);
      const sessData = await sessRes.json();
      const childData = await childRes.json();
      setSessions(Array.isArray(sessData) ? sessData : []);
      setChildren(Array.isArray(childData) ? childData : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [getDateRange, filterStatus]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const navigate = (direction: 1 | -1) => {
    const d = new Date(currentDate);
    if (viewMode === "week") d.setDate(d.getDate() + direction * 7);
    else if (viewMode === "month") d.setMonth(d.getMonth() + direction);
    setCurrentDate(d);
  };

  const getPeriodLabel = () => {
    if (viewMode === "week") {
      const { start, end } = getDateRange();
      return `${formatShortDate(start)} — ${formatShortDate(end)}`;
    } else if (viewMode === "month") {
      return currentDate.toLocaleDateString("ar-EG", { month: "long", year: "numeric" });
    }
    return "القائمة الكاملة";
  };

  const getWeekDays = () => {
    const { start } = getDateRange();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  const getSessionsForDate = (date: Date) => {
    const dateStr = date.toISOString().slice(0, 10);
    return sessions.filter(
      (s) => new Date(s.scheduledAt).toISOString().slice(0, 10) === dateStr
    );
  };

  const selectedDateSessions = selectedDate
    ? sessions.filter(
        (s) => new Date(s.scheduledAt).toISOString().slice(0, 10) === selectedDate
      )
    : sessions;

  const sortedSessions = [...(viewMode === "list" ? sessions : selectedDateSessions)].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );

  const filteredDisplay = filterStatus === "all"
    ? sortedSessions
    : sortedSessions.filter((s) => s.status === filterStatus);

  const weekDays = ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"];

  const getMonthCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = Array(firstDay).fill(null);
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  return (
    <AppShell>
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 px-5 pt-12 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-black text-white">الجدول</h1>
          <Button
            onClick={() => setShowAddSession(true)}
            className="bg-white text-indigo-600 hover:bg-indigo-50"
            size="sm"
          >
            <Plus size={16} />
            حصة جديدة
          </Button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex bg-white/10 rounded-xl p-1 gap-1">
          {[
            { id: "week", label: "أسبوع", icon: Calendar },
            { id: "month", label: "شهر", icon: Calendar },
            { id: "list", label: "قائمة", icon: List },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setViewMode(id as ViewMode)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === id
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Navigation */}
        {viewMode !== "list" && (
          <div className="flex items-center justify-between mt-3">
            <button
              onClick={() => navigate(1)}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-white font-bold text-sm">{getPeriodLabel()}</span>
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Week View */}
        {viewMode === "week" && (
          <div className="px-4 pt-4">
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((d, i) => (
                <div key={i} className="text-center text-xs text-gray-400 pb-1 font-medium">
                  {d}
                </div>
              ))}
              {getWeekDays().map((date, i) => {
                const dateStr = date.toISOString().slice(0, 10);
                const daySessions = getSessionsForDate(date);
                const isSelected = selectedDate === dateStr;
                const todayFlag = isToday(date);

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                    className={`flex flex-col items-center py-2 rounded-xl transition-all ${
                      isSelected
                        ? "bg-indigo-600 shadow-md"
                        : todayFlag
                        ? "bg-indigo-50 border border-indigo-200"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <span
                      className={`text-sm font-bold ${
                        isSelected ? "text-white" : todayFlag ? "text-indigo-600" : "text-gray-700"
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {daySessions.length > 0 && (
                      <div className="flex gap-0.5 mt-1">
                        {daySessions.slice(0, 3).map((_, di) => (
                          <div
                            key={di}
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected ? "bg-white" : "bg-indigo-400"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Month View */}
        {viewMode === "month" && (
          <div className="px-4 pt-4">
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((d, i) => (
                <div key={i} className="text-center text-xs text-gray-400 pb-1 font-medium">
                  {d}
                </div>
              ))}
              {getMonthCalendarDays().map((date, i) => {
                if (!date) return <div key={i} />;
                const dateStr = date.toISOString().slice(0, 10);
                const daySessions = getSessionsForDate(date);
                const isSelected = selectedDate === dateStr;
                const todayFlag = isToday(date);

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                    className={`flex flex-col items-center py-1.5 rounded-xl transition-all min-h-[44px] ${
                      isSelected
                        ? "bg-indigo-600"
                        : todayFlag
                        ? "bg-indigo-50 border border-indigo-200"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <span
                      className={`text-xs font-bold ${
                        isSelected ? "text-white" : todayFlag ? "text-indigo-600" : "text-gray-700"
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {daySessions.length > 0 && (
                      <div
                        className={`text-[10px] font-bold mt-0.5 ${
                          isSelected ? "text-white/80" : "text-indigo-500"
                        }`}
                      >
                        {daySessions.length}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="px-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {[
              { value: "all", label: "الكل" },
              { value: "scheduled", label: "مجدولة" },
              { value: "completed", label: "مكتملة" },
              { value: "cancelled", label: "ملغاة" },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilterStatus(value)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  filterStatus === value
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-500 border border-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Sessions List */}
        <div className="px-4 pb-4">
          {selectedDate && viewMode !== "list" && (
            <div className="mb-3">
              <h3 className="text-sm font-bold text-gray-500">
                {new Date(selectedDate + "T12:00:00").toLocaleDateString("ar-EG", {
                  weekday: "long", day: "numeric", month: "long"
                })}
              </h3>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />
              ))}
            </div>
          ) : filteredDisplay.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">📅</div>
              <p className="text-gray-500 font-bold">لا توجد حصص</p>
              <p className="text-gray-400 text-sm mt-1">
                {selectedDate ? "في هذا اليوم" : "في هذه الفترة"}
              </p>
              <Button onClick={() => setShowAddSession(true)} className="mt-4" size="sm">
                <Plus size={14} />
                إضافة حصة
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDisplay.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onUpdate={fetchSessions}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showAddSession}
        onClose={() => setShowAddSession(false)}
        title="إضافة حصة جديدة"
        size="lg"
      >
        <SessionForm
          children={children}
          defaultDate={selectedDate || undefined}
          onSuccess={() => {
            setShowAddSession(false);
            fetchSessions();
          }}
          onCancel={() => setShowAddSession(false)}
        />
      </Modal>
    </AppShell>
  );
}
