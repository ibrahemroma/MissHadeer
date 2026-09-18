"use client";
import { useState, useEffect } from "react";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import type { Child, Parent, Session } from "@/db/schema";
import toast from "react-hot-toast";

interface ChildWithParent extends Child {
  parents: Parent[];
}

interface SessionFormProps {
  children: ChildWithParent[];
  session?: Session;
  defaultChildId?: string;
  defaultDate?: string;
  onSuccess: (session: Session) => void;
  onCancel: () => void;
}

export function SessionForm({
  children,
  session,
  defaultChildId,
  defaultDate,
  onSuccess,
  onCancel,
}: SessionFormProps) {
  const [loading, setLoading] = useState(false);

  const getDefaultDateTime = () => {
    if (session?.scheduledAt) {
      const d = new Date(session.scheduledAt);
      return {
        date: d.toISOString().slice(0, 10),
        time: d.toTimeString().slice(0, 5),
      };
    }
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    return {
      date: defaultDate || now.toISOString().slice(0, 10),
      time: now.toTimeString().slice(0, 5),
    };
  };

  const { date: initDate, time: initTime } = getDefaultDateTime();

  const [form, setForm] = useState({
    childId: session?.childId || defaultChildId || children[0]?.id || "",
    date: initDate,
    time: initTime,
    durationMinutes: session?.durationMinutes?.toString() || "60",
    address: session?.address || "",
    locationNotes: session?.locationNotes || "",
    sessionPrice: session?.sessionPrice?.toString() || "",
    currency: session?.currency || "EGP",
    recurrenceType: session?.recurrenceType || "none",
    status: session?.status || "scheduled",
  });

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const selectedChild = children.find((c) => c.id === form.childId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.childId) {
      toast.error("اختر الطفل");
      return;
    }

    setLoading(true);
    try {
      const scheduledAt = new Date(`${form.date}T${form.time}`).toISOString();
      const payload = {
        childId: form.childId,
        scheduledAt,
        durationMinutes: parseInt(form.durationMinutes),
        address: form.address,
        locationNotes: form.locationNotes,
        sessionPrice: form.sessionPrice || null,
        currency: form.currency,
        recurrenceType: form.recurrenceType,
        status: form.status,
      };

      const res = await fetch(
        session ? `/api/sessions/${session.id}` : "/api/sessions",
        {
          method: session ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Failed");
      const data = await res.json();

      if (data.hasConflict) {
        toast("⚠️ تحذير: يوجد تعارض مع حصة أخرى في هذا الوقت", {
          duration: 5000,
          style: { background: "#f59e0b", color: "#fff" },
        });
      } else {
        toast.success(session ? "تم تحديث الحصة ✓" : "تمت إضافة الحصة ✓");
      }

      onSuccess(data);
    } catch {
      toast.error("حدث خطأ، يرجى المحاولة مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Child selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">الطفل *</label>
        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
          {children.map((child) => (
            <button
              key={child.id}
              type="button"
              onClick={() => {
                update("childId", child.id);
                const parent = child.parents[0];
                if (parent?.homeAddress && !form.address) {
                  update("address", parent.homeAddress);
                }
              }}
              className={`flex items-center gap-2 p-2 rounded-xl border-2 transition-all ${
                form.childId === child.id
                  ? "border-violet-400 bg-violet-50"
                  : "border-gray-100 bg-gray-50 hover:border-gray-200"
              }`}
            >
              <Avatar name={child.fullName} color={child.avatarColor} size="xs" />
              <span className="text-xs font-medium text-gray-800 truncate">
                {child.fullName}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="التاريخ *"
          type="date"
          value={form.date}
          onChange={(e) => update("date", e.target.value)}
          required
        />
        <Input
          label="الوقت *"
          type="time"
          value={form.time}
          onChange={(e) => update("time", e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="المدة"
          value={form.durationMinutes}
          onChange={(e) => update("durationMinutes", e.target.value)}
          options={[
            { value: "30", label: "30 دقيقة" },
            { value: "45", label: "45 دقيقة" },
            { value: "60", label: "ساعة واحدة" },
            { value: "90", label: "ساعة ونصف" },
            { value: "120", label: "ساعتان" },
          ]}
        />
        <Select
          label="التكرار"
          value={form.recurrenceType}
          onChange={(e) => update("recurrenceType", e.target.value)}
          options={[
            { value: "none", label: "مرة واحدة" },
            { value: "weekly", label: "أسبوعياً" },
            { value: "biweekly", label: "كل أسبوعين" },
            { value: "monthly", label: "شهرياً" },
          ]}
        />
      </div>

      <Textarea
        label="العنوان"
        value={form.address}
        onChange={(e) => update("address", e.target.value)}
        placeholder="عنوان الزيارة..."
        rows={2}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="سعر الحصة"
          type="number"
          value={form.sessionPrice}
          onChange={(e) => update("sessionPrice", e.target.value)}
          placeholder="150"
          min="0"
        />
        <Select
          label="العملة"
          value={form.currency}
          onChange={(e) => update("currency", e.target.value)}
          options={[
            { value: "EGP", label: "جنيه (EGP)" },
            { value: "SAR", label: "ريال (SAR)" },
            { value: "AED", label: "درهم (AED)" },
            { value: "USD", label: "دولار (USD)" },
          ]}
        />
      </div>

      {session && (
        <Select
          label="الحالة"
          value={form.status}
          onChange={(e) => update("status", e.target.value)}
          options={[
            { value: "scheduled", label: "مجدولة" },
            { value: "completed", label: "مكتملة" },
            { value: "cancelled", label: "ملغاة" },
            { value: "rescheduled", label: "معادة جدولة" },
          ]}
        />
      )}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
          إلغاء
        </Button>
        <Button type="submit" className="flex-1" loading={loading}>
          {session ? "حفظ التعديلات" : "إضافة الحصة"}
        </Button>
      </div>
    </form>
  );
}
