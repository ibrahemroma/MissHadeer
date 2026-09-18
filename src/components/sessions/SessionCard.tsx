"use client";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MessageCircle, Clock, MapPin, CheckCircle, Circle, ChevronLeft } from "lucide-react";
import { formatTime, formatShortDate, getWhatsAppUrl, isToday, isTomorrow } from "@/lib/utils";
import type { Session, Child, Parent, SessionNote } from "@/db/schema";
import toast from "react-hot-toast";

interface SessionWithRelations extends Session {
  child: Child & { parents: Parent[] };
  notes: SessionNote[];
}

interface SessionCardProps {
  session: SessionWithRelations;
  onUpdate?: () => void;
  compact?: boolean;
}

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  scheduled: { label: "مجدولة", color: "#f59e0b", bg: "#fef3c7" },
  completed: { label: "مكتملة", color: "#10b981", bg: "#d1fae5" },
  cancelled: { label: "ملغاة", color: "#ef4444", bg: "#fee2e2" },
  rescheduled: { label: "معادة جدولة", color: "#6366f1", bg: "#ede9fe" },
};

export function SessionCard({ session, onUpdate, compact }: SessionCardProps) {
  const router = useRouter();
  const parent = session.child?.parents?.[0];
  const statusStyle = STATUS_STYLES[session.status] || STATUS_STYLES.scheduled;
  const scheduledDate = new Date(session.scheduledAt);

  const getDayLabel = () => {
    if (isToday(scheduledDate)) return "اليوم";
    if (isTomorrow(scheduledDate)) return "غداً";
    return formatShortDate(scheduledDate);
  };

  const togglePayment = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = session.paymentStatus === "paid" ? "unpaid" : "paid";
    try {
      await fetch(`/api/sessions/${session.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: newStatus }),
      });
      toast.success(newStatus === "paid" ? "تم تسجيل الدفع ✓" : "تم إلغاء تسجيل الدفع");
      onUpdate?.();
    } catch {
      toast.error("حدث خطأ");
    }
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (parent?.phone) {
      window.open(getWhatsAppUrl(parent.phone), "_blank");
    }
  };

  if (compact) {
    return (
      <Card
        hover
        onClick={() => router.push(`/sessions/${session.id}`)}
        className="p-3"
      >
        <div className="flex items-center gap-3">
          <div className="text-center min-w-[44px]">
            <div className="text-xs font-bold text-violet-600">{getDayLabel()}</div>
            <div className="text-sm font-bold text-gray-900">{formatTime(scheduledDate)}</div>
          </div>
          <div className="w-px h-8 bg-gray-100" />
          <Avatar name={session.child.fullName} color={session.child.avatarColor} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{session.child.fullName}</p>
            <div className="flex items-center gap-2">
              <Badge color={statusStyle.color} bg={statusStyle.bg}>{statusStyle.label}</Badge>
              {session.paymentStatus === "unpaid" && session.status === "completed" && (
                <Badge color="#ef4444" bg="#fee2e2">غير مدفوعة</Badge>
              )}
            </div>
          </div>
          <ChevronLeft size={14} className="text-gray-300" />
        </div>
      </Card>
    );
  }

  return (
    <Card
      hover
      onClick={() => router.push(`/sessions/${session.id}`)}
      className="p-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center min-w-[52px] bg-violet-50 rounded-xl p-2">
          <span className="text-xs font-bold text-violet-500">{getDayLabel()}</span>
          <span className="text-lg font-bold text-violet-700 leading-none">
            {formatTime(scheduledDate)}
          </span>
          <span className="text-xs text-violet-400 mt-0.5">
            {session.durationMinutes} د
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Avatar name={session.child.fullName} color={session.child.avatarColor} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{session.child.fullName}</p>
              {parent && (
                <p className="text-xs text-gray-400 truncate">ولي الأمر: {parent.name}</p>
              )}
            </div>
          </div>

          {session.address && (
            <div className="flex items-center gap-1 mt-2">
              <MapPin size={12} className="text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-500 truncate">{session.address}</span>
            </div>
          )}

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge color={statusStyle.color} bg={statusStyle.bg}>{statusStyle.label}</Badge>
            {session.sessionPrice && (
              <Badge color="#6366f1" bg="#ede9fe">
                {session.sessionPrice} {session.currency}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {parent?.phone && (
            <button
              onClick={handleWhatsApp}
              className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-colors"
            >
              <MessageCircle size={16} />
            </button>
          )}
          <button
            onClick={togglePayment}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              session.paymentStatus === "paid"
                ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                : "bg-gray-50 text-gray-400 hover:bg-gray-100"
            }`}
            title={session.paymentStatus === "paid" ? "مدفوعة" : "غير مدفوعة"}
          >
            {session.paymentStatus === "paid" ? (
              <CheckCircle size={16} />
            ) : (
              <Circle size={16} />
            )}
          </button>
        </div>
      </div>
    </Card>
  );
}
