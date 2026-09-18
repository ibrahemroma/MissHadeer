"use client";
import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import {
  User, Bell, Globe, DollarSign, Tag, MessageCircle,
  ChevronLeft, Plus, Trash2, Star, Info
} from "lucide-react";
import type { MessageTemplate, CustomLevel } from "@/db/schema";
import toast from "react-hot-toast";

interface SettingsData {
  settings: Record<string, string>;
  customLevels: CustomLevel[];
  messageTemplates: MessageTemplate[];
}

const LEVEL_COLORS = [
  "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6",
  "#ec4899", "#ef4444", "#06b6d4", "#f97316"
];

export default function SettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const [profileForm, setProfileForm] = useState({
    teacher_name: "",
    teacher_name_ar: "",
    default_session_duration: "60",
    default_session_price: "150",
    default_currency: "EGP",
  });

  const [newTemplate, setNewTemplate] = useState({
    name: "",
    nameAr: "",
    template: "",
    templateAr: "",
    category: "general",
  });
  const [showAddTemplate, setShowAddTemplate] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      const d = await res.json();
      setData(d);
      setProfileForm({
        teacher_name: d.settings.teacher_name || "Miss Hadeer",
        teacher_name_ar: d.settings.teacher_name_ar || "مس هدير",
        default_session_duration: d.settings.default_session_duration || "60",
        default_session_price: d.settings.default_session_price || "150",
        default_currency: d.settings.default_currency || "EGP",
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: profileForm }),
      });
      toast.success("تم حفظ الإعدادات ✓");
      fetchSettings();
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  const addTemplate = async () => {
    if (!newTemplate.templateAr.trim()) {
      toast.error("محتوى الرسالة مطلوب");
      return;
    }
    try {
      await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newTemplate,
          template: newTemplate.template || newTemplate.templateAr,
        }),
      });
      toast.success("تم إضافة القالب ✓");
      setNewTemplate({ name: "", nameAr: "", template: "", templateAr: "", category: "general" });
      setShowAddTemplate(false);
      fetchSettings();
    } catch {
      toast.error("حدث خطأ");
    }
  };

  const SECTIONS = [
    { id: "profile", label: "الملف الشخصي", icon: User, desc: "اسمك وإعدادات الحصص" },
    { id: "templates", label: "قوالب واتساب", icon: MessageCircle, desc: "رسائل سريعة للأولياء" },
    { id: "about", label: "عن التطبيق", icon: Info, desc: "معلومات التطبيق" },
  ];

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-700 to-gray-900 px-5 pt-12 pb-8">
        <div className="flex items-center gap-4">
          <Avatar
            name={profileForm.teacher_name_ar || profileForm.teacher_name}
            color="#7c3aed"
            size="lg"
          />
          <div>
            <h1 className="text-xl font-black text-white">
              {profileForm.teacher_name_ar || profileForm.teacher_name}
            </h1>
            <p className="text-gray-400 text-sm">معلمة أساسيات تعليمية</p>
            <div className="flex items-center gap-1 mt-1">
              <Star size={12} className="text-yellow-400 fill-yellow-400" />
              <Star size={12} className="text-yellow-400 fill-yellow-400" />
              <Star size={12} className="text-yellow-400 fill-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Sections */}
        {SECTIONS.map(({ id, label, icon: Icon, desc }) => (
          <div key={id}>
            <button
              onClick={() => setActiveSection(activeSection === id ? null : id)}
              className="w-full bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 hover:border-violet-100 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                <Icon size={18} className="text-violet-600" />
              </div>
              <div className="flex-1 text-right">
                <div className="text-sm font-bold text-gray-900">{label}</div>
                <div className="text-xs text-gray-400">{desc}</div>
              </div>
              <ChevronLeft
                size={18}
                className={`text-gray-300 transition-transform ${activeSection === id ? "rotate-90" : ""}`}
              />
            </button>

            {/* Profile Section */}
            {activeSection === "profile" && id === "profile" && (
              <Card className="mt-2 p-4 space-y-3">
                <Input
                  label="الاسم بالعربية"
                  value={profileForm.teacher_name_ar}
                  onChange={(e) => setProfileForm((p) => ({ ...p, teacher_name_ar: e.target.value }))}
                  placeholder="مس هدير"
                  dir="rtl"
                />
                <Input
                  label="الاسم بالإنجليزية"
                  value={profileForm.teacher_name}
                  onChange={(e) => setProfileForm((p) => ({ ...p, teacher_name: e.target.value }))}
                  placeholder="Miss Hadeer"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label="مدة الحصة الافتراضية"
                    value={profileForm.default_session_duration}
                    onChange={(e) => setProfileForm((p) => ({ ...p, default_session_duration: e.target.value }))}
                    options={[
                      { value: "30", label: "30 دقيقة" },
                      { value: "45", label: "45 دقيقة" },
                      { value: "60", label: "ساعة" },
                      { value: "90", label: "ساعة ونصف" },
                    ]}
                  />
                  <Select
                    label="العملة الافتراضية"
                    value={profileForm.default_currency}
                    onChange={(e) => setProfileForm((p) => ({ ...p, default_currency: e.target.value }))}
                    options={[
                      { value: "EGP", label: "جنيه مصري" },
                      { value: "SAR", label: "ريال سعودي" },
                      { value: "AED", label: "درهم" },
                      { value: "USD", label: "دولار" },
                    ]}
                  />
                </div>
                <Input
                  label="سعر الحصة الافتراضي"
                  type="number"
                  value={profileForm.default_session_price}
                  onChange={(e) => setProfileForm((p) => ({ ...p, default_session_price: e.target.value }))}
                  placeholder="150"
                />
                <Button onClick={saveProfile} loading={saving} className="w-full">
                  حفظ الإعدادات
                </Button>
              </Card>
            )}

            {/* Templates Section */}
            {activeSection === "templates" && id === "templates" && (
              <Card className="mt-2 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    يمكنك استخدام المتغيرات: {"{childName}"}, {"{parentName}"}, {"{time}"}
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setShowAddTemplate(true)}
                  >
                    <Plus size={14} />
                    إضافة
                  </Button>
                </div>

                <div className="space-y-2">
                  {data?.messageTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="bg-gray-50 rounded-xl p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-800">
                          {template.nameAr || template.name}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600">
                          {template.category === "reminder" ? "تذكير" :
                           template.category === "update" ? "تحديث" :
                           template.category === "payment" ? "دفع" : "عام"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2" dir="rtl">
                        {template.templateAr || template.template}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* About Section */}
            {activeSection === "about" && id === "about" && (
              <Card className="mt-2 p-4 space-y-3">
                <div className="text-center py-4">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto shadow-lg mb-3">
                    <Star size={32} className="text-yellow-300 fill-yellow-300" />
                  </div>
                  <h3 className="text-lg font-black text-gray-900">تطبيق مس هدير</h3>
                  <p className="text-sm text-gray-500 mt-1">إدارة الحصص التعليمية الخاصة</p>
                  <p className="text-xs text-gray-400 mt-1">الإصدار 1.0.0</p>
                </div>

                <div className="space-y-2">
                  {[
                    { icon: "👦", text: "إدارة ملفات الأطفال ومتابعة تقدمهم" },
                    { icon: "📅", text: "جدولة الحصص التعليمية المنزلية" },
                    { icon: "💬", text: "التواصل مع الأولياء عبر واتساب" },
                    { icon: "💰", text: "متابعة الدفعات النقدية" },
                    { icon: "📊", text: "تقارير التقدم والإحصائيات" },
                  ].map(({ icon, text }) => (
                    <div key={text} className="flex items-center gap-3 py-1">
                      <span className="text-lg">{icon}</span>
                      <span className="text-sm text-gray-600">{text}</span>
                    </div>
                  ))}
                </div>

                <div className="text-center text-xs text-gray-400 pt-2">
                  صُمم بـ 💜 لمس هدير وكل معلمة متميزة
                </div>
              </Card>
            )}
          </div>
        ))}
      </div>

      {/* Add Template Modal */}
      <Modal
        isOpen={showAddTemplate}
        onClose={() => setShowAddTemplate(false)}
        title="إضافة قالب رسالة"
        size="md"
      >
        <div className="space-y-3">
          <Input
            label="اسم القالب"
            value={newTemplate.nameAr}
            onChange={(e) => setNewTemplate((p) => ({ ...p, nameAr: e.target.value, name: e.target.value }))}
            placeholder="مثال: تذكير بالحصة"
          />
          <Select
            label="نوع القالب"
            value={newTemplate.category}
            onChange={(e) => setNewTemplate((p) => ({ ...p, category: e.target.value }))}
            options={[
              { value: "reminder", label: "تذكير" },
              { value: "update", label: "تحديث" },
              { value: "rescheduling", label: "تغيير موعد" },
              { value: "payment", label: "دفع" },
              { value: "general", label: "عام" },
            ]}
          />
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">نص الرسالة</label>
            <textarea
              value={newTemplate.templateAr}
              onChange={(e) => setNewTemplate((p) => ({ ...p, templateAr: e.target.value }))}
              placeholder="مثال: مرحباً {parentName}! حصة {childName} غداً الساعة {time} 📚"
              rows={4}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-violet-300"
              dir="rtl"
            />
            <p className="text-xs text-gray-400">
              يمكن استخدام: {"{childName}"} و {"{parentName}"} و {"{time}"}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowAddTemplate(false)}>
              إلغاء
            </Button>
            <Button className="flex-1" onClick={addTemplate}>
              إضافة القالب
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
