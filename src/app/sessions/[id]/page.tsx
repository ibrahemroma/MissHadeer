"use client";
import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { SessionNoteForm } from "@/components/sessions/SessionNoteForm";
import { SessionForm } from "@/components/sessions/SessionForm";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import {
  ArrowRight, Clock, MapPin, DollarSign, CheckCircle,
  Circle, Edit, BookOpen, AlertCircle, Star, Target
} from "lucide-react";
import { formatDate, formatTime, SKILL_LEVELS } from "@/lib/utils";
import type { Session, Child, Parent, SessionNote, MessageTemplate } from "@/db/schema";
import toast from "react-hot-toast";

interface SessionDetail extends Session {
  child: Child & { parents: Parent[] };
  notes: SessionNote[];
}

interface ChildWithParent extends Child {
  parents: Parent[];
}

export default function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [allChildren, setAllChildren] = useState<ChildWithParent[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const fetchSession = useCallback(async () => {
    try {
      const [sessRes, childrenRes, templatesRes] = await Promise.all([
        fetch(`/api/sessions/${id}`),
        fetch("/api/children"),
        fetch("/api/templates"),
      ]);
      const sessData = await sessRes.json();
      const childrenData = await childrenRes.json();
      const templatesData = await templatesRes.json();
      setSession(sessData);
      setAllChildren(Array.isArray(childrenData) ? childrenData : []);
      setTemplates(Array.isArray(templatesData) ? templatesData : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const togglePayment = async () => {
    if (!session) return;
    const newStatus = session.paymentStatus === "paid" ? "unpaid" : "paid";
    try {
      await fetch(`/api/sessions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: newStatus }),
      });
      toast.success(newStatus === "paid" ? "تم تسجيل الدفع ✓" : "تم إلغاء تسجيل الدفع");
      fetchSession();
    } catch {
      toast.error("حدث خطأ");
    }
  };

  const markCompleted = async () => {
    try {
      await fetch(`/api/sessions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      toast.success("تم تسجيل الحصة كمكتملة ✓");
      fetchSession();
    } catch {
      toast.error("حدث خطأ");
    }
  };

  const cancelSession = async () => {
    try {
      await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      toast.success("تم إلغاء الحصة");
      router.back();
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

  if (!session) {
    return (
      <AppShell>
        <div className="text-center py-20">
          <p className="text-gray-500">لم يتم العثور على الحصة</p>
          <Button onClick={() => router.back()} className="mt-4">
            العودة
          </Button>
        </div>
      </AppShell>
    );
  }

  const parent = session.child.parents[0];
  const note = session.notes?.[0];
  const level = SKILL_LEVELS[session.child.skillLevel] || SKILL_LEVELS.beginner;

  const STATUS_STYLES: Record<string, { label: string; color: string; bg: string; gradient: string }> = {
    scheduled: { label: "مجدولة", color: "#6366f1", bg: "#ede9fe", gradient: "from-indigo-500 to-violet-600" },
    completed: { label: "مكتملة", color: "#10b981", bg: "#d1fae5", gradient: "from-emerald-500 to-teal-600" },
    cancelled: { label: "ملغاة", color: "#ef4444", bg: "#fee2e2", gradient: "from-red-400 to-rose-600" },
    rescheduled: { label: "معادة جدولة", color: "#f59e0b", bg: "#fef3c7", gradient: "from-amber-400 to-orange-500" },
  };

  const st = STATUS_STYLES[session.status] || STATUS_STYLES.scheduled;

  return (
    <AppShell>
      {/* Header */}
      <div className={`bg-gradient-to-br ${st.gradient} px-5 pt-12 pb-6`}>
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-1 text-white/80 hover:text-white"
        >
          <ArrowRight size={18} />
          <span className="text-sm">العودة</span>
        </button>

        <div className="flex items-center justify-between">
          <div>
            <Badge className="text-xs mb-2" color="white" bg="rgba(255,255,255,0.2)">
              {st.label}
            </Badge>
            <h1 className="text-xl font-black text-white">
              {formatDate(session.scheduledAt)}
            </h1>
            <p className="text-white/70 text-sm">{formatTime(session.scheduledAt)}</p>
            <p className="text-white/60 text-xs mt-0.5">{session.durationMinutes} دقيقة</p>
          </div>
          <button
            onClick={() => setShowEditForm(true)}
            className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white"
          >
            <Edit size={18} />
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Child Info */}
        <Card className="p-4">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => router.push(`/children/${session.child.id}`)}
          >
            <Avatar name={session.child.fullName} color={session.child.avatarColor} size="md" />
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">{session.child.fullName}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge color={level.color} bg={level.bg}>{level.labelAr}</Badge>
                {parent && (
                  <span className="text-xs text-gray-400">ولي: {parent.name}</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Location */}
        {(session.address || session.locationNotes) && (
          <Card className="p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <MapPin size={15} className="text-gray-400" />
              موقع الزيارة
            </h3>
            {session.address && <p className="text-sm text-gray-600">{session.address}</p>}
            {session.locationNotes && (
              <p className="text-xs text-gray-400 mt-1 bg-gray-50 rounded-lg p-2">
                {session.locationNotes}
              </p>
            )}
          </Card>
        )}

        {/* Payment */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <DollarSign size={15} className="text-gray-400" />
                الدفع النقدي
              </h3>
              {session.sessionPrice && (
                <p className="text-lg font-black text-gray-900 mt-1">
                  {session.sessionPrice} {session.currency}
                </p>
              )}
            </div>
            <button
              onClick={togglePayment}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                session.paymentStatus === "paid"
                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {session.paymentStatus === "paid" ? (
                <>
                  <CheckCircle size={16} />
                  مدفوعة
                </>
              ) : (
                <>
                  <Circle size={16} />
                  غير مدفوعة
                </>
              )}
            </button>
          </div>
        </Card>

        {/* Action Buttons */}
        {session.status === "scheduled" && (
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="success"
              onClick={markCompleted}
              className="w-full"
            >
              <CheckCircle size={16} />
              تسجيل كمكتملة
            </Button>
            <Button
              variant="danger"
              onClick={() => setShowCancelConfirm(true)}
              className="w-full"
            >
              <AlertCircle size={16} />
              إلغاء الحصة
            </Button>
          </div>
        )}

        {/* WhatsApp */}
        {parent?.phone && (
          <WhatsAppButton
            phone={parent.phone}
            childName={session.child.fullName}
            parentName={parent.name}
            sessionTime={formatTime(session.scheduledAt)}
            templates={templates}
            className="w-full justify-center"
          />
        )}

        {/* Session Notes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <BookOpen size={16} className="text-violet-600" />
              ملاحظات الحصة
            </h2>
            {session.status === "completed" && (
              <Button
                size="sm"
                variant={note ? "outline" : "primary"}
                onClick={() => setShowNoteForm(true)}
              >
                {note ? (
                  <><Edit size={12} /> تعديل</>
                ) : (
                  <><BookOpen size={12} /> إضافة ملاحظات</>
                )}
              </Button>
            )}
          </div>

          {!note && session.status === "scheduled" && (
            <Card className="p-6 text-center">
              <div className="text-4xl mb-2">📝</div>
              <p className="text-sm text-gray-500">سيتم إضافة الملاحظات بعد اكتمال الحصة</p>
              <Button
                size="sm"
                className="mt-3"
                onClick={() => { markCompleted(); setShowNoteForm(true); }}
              >
                بدء إدخال الملاحظات الآن
              </Button>
            </Card>
          )}

          {!note && session.status === "completed" && (
            <Card className="p-6 text-center border-2 border-dashed border-violet-200">
              <div className="text-4xl mb-2">✍️</div>
              <p className="text-sm text-gray-500">لم تُضف ملاحظات بعد</p>
              <Button size="sm" className="mt-3" onClick={() => setShowNoteForm(true)}>
                إضافة ملاحظات
              </Button>
            </Card>
          )}

          {note && (
            <div className="space-y-3">
              {note.topicsCovered && (
                <Card className="p-4 bg-blue-50 border-blue-100">
                  <h4 className="text-xs font-bold text-blue-600 mb-1 flex items-center gap-1">
                    <BookOpen size={12} /> ما تم تدريسه
                  </h4>
                  <p className="text-sm text-blue-800">{note.topicsCovered}</p>
                </Card>
              )}

              {note.topicsPending && (
                <Card className="p-4 bg-amber-50 border-amber-100">
                  <h4 className="text-xs font-bold text-amber-600 mb-1 flex items-center gap-1">
                    <Clock size={12} /> ما لم يتم تناوله
                  </h4>
                  <p className="text-sm text-amber-800">{note.topicsPending}</p>
                </Card>
              )}

              {((note.strengthTags as string[])?.length > 0 || note.strengthsText) && (
                <Card className="p-4 bg-emerald-50 border-emerald-100">
                  <h4 className="text-xs font-bold text-emerald-600 mb-2 flex items-center gap-1">
                    <Star size={12} /> نقاط القوة
                  </h4>
                  {(note.strengthTags as string[])?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {(note.strengthTags as string[]).map((tag: string) => (
                        <span key={tag} className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                          ⭐ {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {note.strengthsText && (
                    <p className="text-sm text-emerald-800">{note.strengthsText}</p>
                  )}
                </Card>
              )}

              {((note.weaknessTags as string[])?.length > 0 || note.weaknessesText) && (
                <Card className="p-4 bg-rose-50 border-rose-100">
                  <h4 className="text-xs font-bold text-rose-600 mb-2 flex items-center gap-1">
                    <Target size={12} /> نقاط تحتاج تحسين
                  </h4>
                  {(note.weaknessTags as string[])?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {(note.weaknessTags as string[]).map((tag: string) => (
                        <span key={tag} className="text-xs px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full font-medium">
                          🎯 {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {note.weaknessesText && (
                    <p className="text-sm text-rose-800">{note.weaknessesText}</p>
                  )}
                </Card>
              )}

              {note.nextSessionFocus && (
                <Card className="p-4 bg-violet-50 border-violet-100">
                  <h4 className="text-xs font-bold text-violet-600 mb-1">🔮 تركيز الحصة القادمة</h4>
                  <p className="text-sm text-violet-800">{note.nextSessionFocus}</p>
                </Card>
              )}

              {note.reviewItems && (
                <Card className="p-4 bg-indigo-50 border-indigo-100">
                  <h4 className="text-xs font-bold text-indigo-600 mb-1">🔁 للمراجعة</h4>
                  <p className="text-sm text-indigo-800">{note.reviewItems}</p>
                </Card>
              )}

              {note.freeNotes && (
                <Card className="p-4">
                  <h4 className="text-xs font-bold text-gray-500 mb-1">📝 ملاحظات إضافية</h4>
                  <p className="text-sm text-gray-700">{note.freeNotes}</p>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Note Form Modal */}
      <Modal
        isOpen={showNoteForm}
        onClose={() => setShowNoteForm(false)}
        title="ملاحظات الحصة"
        size="xl"
      >
        <SessionNoteForm
          sessionId={session.id}
          childId={session.child.id}
          existingNote={note}
          onSuccess={() => {
            setShowNoteForm(false);
            fetchSession();
          }}
          onCancel={() => setShowNoteForm(false)}
        />
      </Modal>

      {/* Edit Session Modal */}
      <Modal
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        title="تعديل الحصة"
        size="lg"
      >
        <SessionForm
          children={allChildren}
          session={session}
          onSuccess={() => {
            setShowEditForm(false);
            fetchSession();
          }}
          onCancel={() => setShowEditForm(false)}
        />
      </Modal>

      {/* Cancel Confirm */}
      <Modal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        title="إلغاء الحصة"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">هل أنت متأكدة من إلغاء هذه الحصة؟</p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowCancelConfirm(false)}>
              لا
            </Button>
            <Button variant="danger" className="flex-1" onClick={cancelSession}>
              نعم، إلغاء
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
