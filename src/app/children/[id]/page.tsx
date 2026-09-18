"use client";
import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { ProgressTimeline } from "@/components/children/ProgressTimeline";
import { ChildForm } from "@/components/children/ChildForm";
import { SessionForm } from "@/components/sessions/SessionForm";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import {
  ArrowRight, Edit, Plus, MapPin, Phone, Calendar,
  BookOpen, TrendingUp, DollarSign, Clock, Trash2
} from "lucide-react";
import { SessionNoteForm } from "@/components/sessions/SessionNoteForm";
import { SKILL_LEVELS, formatDate, formatTime } from "@/lib/utils";
import type { Child, Parent, Session, SessionNote, MessageTemplate } from "@/db/schema";
import toast from "react-hot-toast";

interface SessionWithNotes extends Session {
  notes: SessionNote[];
}

interface ChildDetail extends Child {
  parents: Parent[];
  sessions: SessionWithNotes[];
}

interface ChildWithParent extends Child {
  parents: Parent[];
}

export default function ChildDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [child, setChild] = useState<ChildDetail | null>(null);
  const [allChildren, setAllChildren] = useState<ChildWithParent[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "sessions" | "progress">("profile");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddSession, setShowAddSession] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchChild = useCallback(async () => {
    try {
      const [childRes, childrenRes, templatesRes] = await Promise.all([
        fetch(`/api/children/${id}`),
        fetch("/api/children"),
        fetch("/api/templates"),
      ]);
      const childData = await childRes.json();
      const childrenData = await childrenRes.json();
      const templatesData = await templatesRes.json();
      setChild(childData);
      setAllChildren(Array.isArray(childrenData) ? childrenData : []);
      setTemplates(Array.isArray(templatesData) ? templatesData : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchChild();
  }, [fetchChild]);

  const handleDelete = async () => {
    try {
      await fetch(`/api/children/${id}`, { method: "DELETE" });
      toast.success("تم إلغاء تنشيط الطفل");
      router.push("/children");
    } catch {
      toast.error("حدث خطأ");
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full" />
        </div>
      </AppShell>
    );
  }

  if (!child) {
    return (
      <AppShell>
        <div className="text-center py-20">
          <p className="text-gray-500">لم يتم العثور على الطفل</p>
          <Button onClick={() => router.push("/children")} className="mt-4">
            العودة
          </Button>
        </div>
      </AppShell>
    );
  }

  const parent = child.parents[0];
  const level = SKILL_LEVELS[child.skillLevel] || SKILL_LEVELS.beginner;
  const completedSessions = child.sessions.filter((s) => s.status === "completed");
  const upcomingSessions = child.sessions.filter((s) => s.status === "scheduled");
  const totalIncome = child.sessions
    .filter((s) => s.paymentStatus === "paid")
    .reduce((sum, s) => sum + parseFloat(s.sessionPrice || "0"), 0);

  const TABS = [
    { id: "profile", label: "الملف", icon: BookOpen },
    { id: "sessions", label: "الحصص", icon: Calendar },
    { id: "progress", label: "التقدم", icon: TrendingUp },
  ] as const;

  return (
    <AppShell>
      {/* Header */}
      <div
        className="px-5 pt-12 pb-6 relative"
        style={{
          background: `linear-gradient(135deg, ${child.avatarColor}dd 0%, ${child.avatarColor}88 100%)`,
        }}
      >
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-1 text-white/80 hover:text-white transition-colors"
        >
          <ArrowRight size={18} />
          <span className="text-sm">العودة</span>
        </button>

        <div className="flex items-start gap-4">
          <Avatar name={child.fullName} color={child.avatarColor} size="xl" className="shadow-xl" />
          <div className="flex-1">
            <h1 className="text-xl font-black text-white">{child.fullName}</h1>
            {child.fullNameAr && (
              <p className="text-white/70 text-sm">{child.fullNameAr}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              {child.age && (
                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                  {child.age} سنوات
                </span>
              )}
              <Badge color="white" bg={`${level.color}99`} className="text-white">
                {level.labelAr}
              </Badge>
            </div>
          </div>
          <button
            onClick={() => setShowEditModal(true)}
            className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <Edit size={16} />
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { value: completedSessions.length, label: "حصة منجزة", icon: "✅" },
            { value: upcomingSessions.length, label: "قادمة", icon: "📅" },
            { value: `${totalIncome}`, label: "إجمالي محصل", icon: "💰" },
          ].map(({ value, label, icon }) => (
            <div key={label} className="bg-white/20 rounded-xl p-2 text-center">
              <div className="text-lg">{icon}</div>
              <div className="text-white font-black text-lg leading-none">{value}</div>
              <div className="text-white/60 text-[10px] mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 px-4">
        <div className="flex">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-bold border-b-2 transition-all ${
                activeTab === id
                  ? "border-violet-600 text-violet-600"
                  : "border-transparent text-gray-400"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <>
            {parent && (
              <Card className="p-4 space-y-3">
                <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                  <span className="text-lg">👨‍👩‍👧</span> ولي الأمر
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">الاسم:</span>
                    <span className="text-sm font-bold text-gray-800">{parent.name}</span>
                    {parent.nameAr && (
                      <span className="text-xs text-gray-400">({parent.nameAr})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-400" />
                    <span className="text-sm font-mono text-gray-800" dir="ltr">{parent.phone}</span>
                  </div>
                  {parent.homeAddress && (
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{parent.homeAddress}</span>
                    </div>
                  )}
                  {parent.locationNotes && (
                    <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-2">
                      📍 {parent.locationNotes}
                    </div>
                  )}
                </div>

                {parent.phone && (
                  <WhatsAppButton
                    phone={parent.phone}
                    childName={child.fullName}
                    parentName={parent.name}
                    templates={templates}
                    className="w-full justify-center"
                  />
                )}
              </Card>
            )}

            {child.notes && (
              <Card className="p-4">
                <h3 className="text-sm font-black text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-lg">📝</span> ملاحظات عامة
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">{child.notes}</p>
              </Card>
            )}

            {/* Last session note summary */}
            {completedSessions.length > 0 && completedSessions[0].notes.length > 0 && (
              <Card className="p-4">
                <h3 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-lg">🔮</span> آخر ملاحظات - التركيز القادم
                </h3>
                <div className="bg-violet-50 rounded-xl p-3">
                  {completedSessions[0].notes[0].nextSessionFocus && (
                    <p className="text-sm text-violet-800">
                      {completedSessions[0].notes[0].nextSessionFocus}
                    </p>
                  )}
                  {completedSessions[0].notes[0].reviewItems && (
                    <div className="mt-2">
                      <span className="text-xs font-bold text-violet-600">للمراجعة: </span>
                      <span className="text-xs text-violet-700">{completedSessions[0].notes[0].reviewItems}</span>
                    </div>
                  )}
                  <div className="text-xs text-violet-400 mt-2">
                    <Clock size={10} className="inline" /> آخر حصة:{" "}
                    {formatDate(completedSessions[0].scheduledAt)}
                  </div>
                </div>
              </Card>
            )}

            {/* Danger Zone */}
            <Card className="p-4 border border-red-100">
              <h3 className="text-sm font-bold text-red-600 mb-3">منطقة الخطر</h3>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full"
              >
                <Trash2 size={14} />
                إلغاء تنشيط الطفل
              </Button>
            </Card>
          </>
        )}

        {/* SESSIONS TAB */}
        {activeTab === "sessions" && (
          <>
            <Button onClick={() => setShowAddSession(true)} className="w-full">
              <Plus size={16} />
              إضافة حصة جديدة
            </Button>

            {child.sessions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">📅</div>
                <p className="text-gray-500">لا توجد حصص بعد</p>
              </div>
            ) : (
              <div className="space-y-3">
                {child.sessions.map((session) => (
                  <SessionMiniCard
                    key={session.id}
                    session={session}
                    childId={child.id}
                    onRefresh={fetchChild}
                    templates={templates}
                    parent={parent}
                    childName={child.fullName}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* PROGRESS TAB */}
        {activeTab === "progress" && (
          <ProgressTimeline sessions={child.sessions} />
        )}
      </div>

      {/* Modals */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="تعديل بيانات الطفل"
        size="lg"
      >
        <ChildForm
          child={{ ...child, parents: child.parents }}
          onSuccess={() => {
            setShowEditModal(false);
            fetchChild();
          }}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>

      <Modal
        isOpen={showAddSession}
        onClose={() => setShowAddSession(false)}
        title="إضافة حصة"
        size="lg"
      >
        <SessionForm
          children={allChildren}
          defaultChildId={id}
          onSuccess={() => {
            setShowAddSession(false);
            fetchChild();
          }}
          onCancel={() => setShowAddSession(false)}
        />
      </Modal>

      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="تأكيد إلغاء التنشيط"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            هل أنت متأكدة من إلغاء تنشيط {child.fullName}؟ يمكن التراجع عن هذا لاحقاً.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowDeleteConfirm(false)}>
              إلغاء
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleDelete}>
              تأكيد
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}

// Mini Session Card for child detail view
interface SessionMiniCardProps {
  session: SessionWithNotes;
  childId: string;
  onRefresh: () => void;
  templates: MessageTemplate[];
  parent?: Parent;
  childName: string;
}

function SessionMiniCard({
  session,
  childId,
  onRefresh,
  templates,
  parent,
  childName,
}: SessionMiniCardProps) {
  const router = useRouter();
  const [showNoteForm, setShowNoteForm] = useState(false);

  const STATUS_COLORS: Record<string, { color: string; bg: string; label: string }> = {
    scheduled: { color: "#6366f1", bg: "#ede9fe", label: "مجدولة" },
    completed: { color: "#10b981", bg: "#d1fae5", label: "مكتملة" },
    cancelled: { color: "#ef4444", bg: "#fee2e2", label: "ملغاة" },
    rescheduled: { color: "#f59e0b", bg: "#fef3c7", label: "معادة" },
  };
  const st = STATUS_COLORS[session.status] || STATUS_COLORS.scheduled;
  const note = session.notes?.[0];

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-gray-500">
              {formatDate(session.scheduledAt)}
            </span>
            <span className="text-xs text-gray-400">{formatTime(session.scheduledAt)}</span>
            <Badge color={st.color} bg={st.bg}>{st.label}</Badge>
            {session.paymentStatus === "paid" && (
              <Badge color="#10b981" bg="#d1fae5">✓ مدفوعة</Badge>
            )}
            {session.paymentStatus === "unpaid" && session.status === "completed" && (
              <Badge color="#ef4444" bg="#fee2e2">غير مدفوعة</Badge>
            )}
          </div>

          {session.address && (
            <div className="flex items-center gap-1 mt-1.5">
              <MapPin size={11} className="text-gray-400" />
              <span className="text-xs text-gray-400">{session.address}</span>
            </div>
          )}

          {note && (
            <div className="mt-2 space-y-1">
              {note.topicsCovered && (
                <p className="text-xs text-gray-600">
                  <span className="font-bold text-blue-600">📚 </span>
                  {note.topicsCovered}
                </p>
              )}
              {(note.strengthTags as string[])?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {(note.strengthTags as string[]).slice(0, 3).map((tag: string) => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full">
                      ⭐ {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => router.push(`/sessions/${session.id}`)}
            className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600 hover:bg-violet-100"
          >
            <BookOpen size={14} />
          </button>
          {parent?.phone && (
            <button
              onClick={() => window.open(`https://wa.me/${parent.phone.replace(/\D/g, "")}`, "_blank")}
              className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-100"
            >
              <Phone size={14} />
            </button>
          )}
        </div>
      </div>

      {session.status === "completed" && !note && (
        <button
          onClick={() => setShowNoteForm(true)}
          className="mt-3 w-full py-2 rounded-xl border-2 border-dashed border-violet-200 text-violet-400 text-xs font-bold hover:border-violet-400 hover:text-violet-600 transition-colors"
        >
          + إضافة ملاحظات الحصة
        </button>
      )}

      {showNoteForm && (
        <Modal isOpen={showNoteForm} onClose={() => setShowNoteForm(false)} title="ملاحظات الحصة" size="lg">
          <SessionNoteForm
            sessionId={session.id}
            childId={childId}
            onSuccess={() => { setShowNoteForm(false); onRefresh(); }}
            onCancel={() => setShowNoteForm(false)}
          />
        </Modal>
      )}
    </Card>
  );
}
