"use client";
import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SessionCard } from "@/components/sessions/SessionCard";
import { Modal } from "@/components/ui/Modal";
import { SessionForm } from "@/components/sessions/SessionForm";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Users, Calendar, TrendingUp, DollarSign,
  Plus, Bell, Clock, AlertCircle, BookOpen,
  Star
} from "lucide-react";
import type { Session, Child, Parent, SessionNote } from "@/db/schema";

interface SessionWithRelations extends Session {
  child: Child & { parents: Parent[] };
  notes: SessionNote[];
}

interface DashboardData {
  todaySessions: SessionWithRelations[];
  upcomingSessions: SessionWithRelations[];
  unpaidSessions: SessionWithRelations[];
  stats: {
    activeChildren: number;
    weekSessions: number;
    monthSessions: number;
    monthlyIncome: number;
    unpaidCount: number;
  };
}

interface ChildWithParent extends Child {
  parents: Parent[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [children, setChildren] = useState<ChildWithParent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSession, setShowAddSession] = useState(false);
  const [teacherName, setTeacherName] = useState("مس هدير");

  const fetchDashboard = useCallback(async () => {
    try {
      const [dashRes, childrenRes, settingsRes] = await Promise.all([
        fetch("/api/dashboard"),
        fetch("/api/children"),
        fetch("/api/settings"),
      ]);
      const dash = await dashRes.json();
      const kids = await childrenRes.json();
      const settings = await settingsRes.json();
      setData(dash);
      setChildren(kids);
      if (settings.settings?.teacher_name_ar) {
        setTeacherName(settings.settings.teacher_name_ar);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "صباح الخير";
    if (h < 17) return "مساء الخير";
    return "مساء النور";
  };

  const getDayName = () => {
    return new Date().toLocaleDateString("ar-EG", {
      weekday: "long", day: "numeric", month: "long"
    });
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shadow-lg">
            <BookOpen className="text-white" size={28} />
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-700 animate-pulse">جاري التحميل...</div>
          </div>
        </div>
      </AppShell>
    );
  }

  const stats = data?.stats;

  return (
    <AppShell>
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 px-5 pt-12 pb-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm">{getGreeting()} 👋</p>
              <h1 className="text-2xl font-black text-white mt-1">{teacherName}</h1>
              <p className="text-purple-200 text-xs mt-1">{getDayName()}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Star className="text-yellow-300" size={24} fill="currentColor" />
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-2 mt-6">
            {[
              { icon: Users, value: stats?.activeChildren || 0, label: "طفل", color: "text-blue-200" },
              { icon: Calendar, value: stats?.weekSessions || 0, label: "هذا الأسبوع", color: "text-emerald-200" },
              { icon: TrendingUp, value: stats?.monthSessions || 0, label: "هذا الشهر", color: "text-yellow-200" },
              { icon: DollarSign, value: `${stats?.monthlyIncome || 0}`, label: "إيراد الشهر", color: "text-pink-200" },
            ].map(({ icon: Icon, value, label, color }) => (
              <div key={label} className="bg-white/15 rounded-2xl p-3 text-center backdrop-blur-sm">
                <Icon size={16} className={`${color} mx-auto mb-1`} />
                <div className="text-white font-black text-lg leading-none">{value}</div>
                <div className="text-white/60 text-[10px] mt-0.5 leading-tight">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-16 space-y-5 relative z-10">

        {/* Quick Add Session */}
        <Button
          onClick={() => setShowAddSession(true)}
          className="w-full"
          size="lg"
        >
          <Plus size={20} />
          إضافة حصة جديدة
        </Button>

        {/* Unpaid Alert */}
        {(stats?.unpaidCount || 0) > 0 && (
          <Card className="p-4 border-l-4 border-l-amber-400 bg-amber-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <AlertCircle size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-800">
                  {stats?.unpaidCount} حصة غير مدفوعة
                </p>
                <p className="text-xs text-amber-600">تحقق من الدفعات المعلقة</p>
              </div>
            </div>
          </Card>
        )}

        {/* Today's Sessions */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <Clock size={18} className="text-violet-600" />
              حصص اليوم
            </h2>
            <span className="text-sm font-bold text-violet-600 bg-violet-100 px-3 py-1 rounded-full">
              {data?.todaySessions.length || 0}
            </span>
          </div>

          {data?.todaySessions.length === 0 ? (
            <Card className="p-6 text-center">
              <div className="text-4xl mb-2">🌟</div>
              <p className="text-sm text-gray-500">لا توجد حصص اليوم</p>
              <p className="text-xs text-gray-400 mt-1">استمتعي بيومك! 😊</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {data?.todaySessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onUpdate={fetchDashboard}
                />
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Sessions */}
        {(data?.upcomingSessions.length || 0) > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                <Bell size={18} className="text-indigo-600" />
                الحصص القادمة
              </h2>
              <span className="text-sm font-bold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">
                {data?.upcomingSessions.length}
              </span>
            </div>
            <div className="space-y-2">
              {data?.upcomingSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onUpdate={fetchDashboard}
                  compact
                />
              ))}
            </div>
          </section>
        )}

        {/* Unpaid Sessions */}
        {(data?.unpaidSessions.length || 0) > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                <DollarSign size={18} className="text-rose-600" />
                دفعات معلقة
              </h2>
            </div>
            <div className="space-y-2">
              {data?.unpaidSessions.slice(0, 3).map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onUpdate={fetchDashboard}
                  compact
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Add Session Modal */}
      <Modal
        isOpen={showAddSession}
        onClose={() => setShowAddSession(false)}
        title="إضافة حصة جديدة"
        size="lg"
      >
        <SessionForm
          children={children}
          onSuccess={() => {
            setShowAddSession(false);
            fetchDashboard();
          }}
          onCancel={() => setShowAddSession(false)}
        />
      </Modal>
    </AppShell>
  );
}
