"use client";
import { useState } from "react";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AVATAR_COLORS, SKILL_LEVELS, getRandomAvatarColor } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import type { Child, Parent } from "@/db/schema";
import toast from "react-hot-toast";

interface ChildWithParent extends Child {
  parents: Parent[];
}

interface ChildFormProps {
  child?: ChildWithParent;
  onSuccess: (child: ChildWithParent) => void;
  onCancel: () => void;
}

const LEVEL_OPTIONS = [
  { value: "beginner", label: "مبتدئ (Beginner)" },
  { value: "elementary", label: "أساسي (Elementary)" },
  { value: "intermediate", label: "متوسط (Intermediate)" },
  { value: "advanced", label: "متقدم (Advanced)" },
];

export function ChildForm({ child, onSuccess, onCancel }: ChildFormProps) {
  const parent = child?.parents[0];
  const [loading, setLoading] = useState(false);
  const [avatarColor, setAvatarColor] = useState(child?.avatarColor || getRandomAvatarColor());

  const [form, setForm] = useState({
    fullName: child?.fullName || "",
    fullNameAr: child?.fullNameAr || "",
    age: child?.age?.toString() || "",
    dateOfBirth: child?.dateOfBirth || "",
    skillLevel: child?.skillLevel || "beginner",
    notes: child?.notes || "",
    parentName: parent?.name || "",
    parentNameAr: parent?.nameAr || "",
    parentPhone: parent?.phone || "",
    parentRelationship: parent?.relationship || "parent",
    homeAddress: parent?.homeAddress || "",
    locationNotes: parent?.locationNotes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      toast.error("اسم الطفل مطلوب");
      return;
    }
    if (!form.parentPhone.trim()) {
      toast.error("رقم هاتف ولي الأمر مطلوب");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        avatarColor,
        parentId: parent?.id,
      };

      const res = await fetch(
        child ? `/api/children/${child.id}` : "/api/children",
        {
          method: child ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      toast.success(child ? "تم تحديث بيانات الطفل ✓" : "تمت إضافة الطفل ✓");
      onSuccess(data);
    } catch {
      toast.error("حدث خطأ، يرجى المحاولة مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Avatar Color Picker */}
      <div className="flex flex-col items-center gap-3 pb-4 border-b border-gray-100">
        <Avatar name={form.fullName || "؟"} color={avatarColor} size="xl" />
        <div className="flex gap-2 flex-wrap justify-center">
          {AVATAR_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setAvatarColor(color)}
              className="w-7 h-7 rounded-full transition-transform hover:scale-110 border-2"
              style={{
                backgroundColor: color,
                borderColor: avatarColor === color ? "#1f2937" : "transparent",
              }}
            />
          ))}
        </div>
      </div>

      {/* Child Info */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <span className="text-lg">👦</span> بيانات الطفل
        </h3>
        <Input
          label="الاسم الكامل *"
          value={form.fullName}
          onChange={(e) => update("fullName", e.target.value)}
          placeholder="مثال: أحمد محمد علي"
          required
        />
        <Input
          label="الاسم بالعربي (اختياري)"
          value={form.fullNameAr}
          onChange={(e) => update("fullNameAr", e.target.value)}
          placeholder="أحمد محمد"
          dir="rtl"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="العمر (سنوات)"
            type="number"
            value={form.age}
            onChange={(e) => update("age", e.target.value)}
            placeholder="5"
            min="1"
            max="15"
          />
          <Input
            label="تاريخ الميلاد"
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => update("dateOfBirth", e.target.value)}
          />
        </div>
        <Select
          label="المستوى الدراسي"
          value={form.skillLevel}
          onChange={(e) => update("skillLevel", e.target.value)}
          options={LEVEL_OPTIONS}
        />
        <Textarea
          label="ملاحظات عامة (اختياري)"
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
          placeholder="أي ملاحظات عامة عن الطفل..."
          rows={2}
        />
      </div>

      {/* Parent Info */}
      <div className="space-y-3 pt-2 border-t border-gray-100">
        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <span className="text-lg">👨‍👩‍👧</span> بيانات ولي الأمر
        </h3>
        <Input
          label="اسم ولي الأمر *"
          value={form.parentName}
          onChange={(e) => update("parentName", e.target.value)}
          placeholder="مثال: محمد أحمد"
          required
        />
        <Input
          label="رقم واتساب *"
          value={form.parentPhone}
          onChange={(e) => update("parentPhone", e.target.value)}
          placeholder="مثال: 201001234567+"
          type="tel"
          dir="ltr"
          hint="أدخل الرقم بالصيغة الدولية (مثال: 201001234567+)"
          required
        />
        <Select
          label="صلة القرابة"
          value={form.parentRelationship}
          onChange={(e) => update("parentRelationship", e.target.value)}
          options={[
            { value: "parent", label: "أب / أم" },
            { value: "guardian", label: "ولي أمر" },
            { value: "grandparent", label: "جد / جدة" },
            { value: "other", label: "أخرى" },
          ]}
        />
        <Textarea
          label="العنوان"
          value={form.homeAddress}
          onChange={(e) => update("homeAddress", e.target.value)}
          placeholder="عنوان المنزل للزيارة..."
          rows={2}
        />
        <Textarea
          label="تعليمات الوصول"
          value={form.locationNotes}
          onChange={(e) => update("locationNotes", e.target.value)}
          placeholder="تفاصيل الوصول للمنزل، علامات مميزة..."
          rows={2}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          onClick={onCancel}
        >
          إلغاء
        </Button>
        <Button type="submit" className="flex-1" loading={loading}>
          {child ? "حفظ التعديلات" : "إضافة الطفل"}
        </Button>
      </div>
    </form>
  );
}
