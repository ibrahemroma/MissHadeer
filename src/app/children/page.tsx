"use client";
import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ChildCard } from "@/components/children/ChildCard";
import { ChildForm } from "@/components/children/ChildForm";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, Search, Users, UserCheck, Filter } from "lucide-react";
import type { Child, Parent } from "@/db/schema";

interface ChildWithParent extends Child {
  parents: Parent[];
}

export default function ChildrenPage() {
  const [children, setChildren] = useState<ChildWithParent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterLevel, setFilterLevel] = useState("all");

  const fetchChildren = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (showInactive) params.set("activeOnly", "false");
      const res = await fetch(`/api/children?${params}`);
      const data = await res.json();
      setChildren(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, showInactive]);

  useEffect(() => {
    const timer = setTimeout(fetchChildren, 300);
    return () => clearTimeout(timer);
  }, [fetchChildren]);

  const filtered = filterLevel === "all"
    ? children
    : children.filter((c) => c.skillLevel === filterLevel);

  const LEVEL_FILTERS = [
    { value: "all", label: "الكل" },
    { value: "beginner", label: "مبتدئ" },
    { value: "elementary", label: "أساسي" },
    { value: "intermediate", label: "متوسط" },
    { value: "advanced", label: "متقدم" },
  ];

  return (
    <AppShell>
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 px-5 pt-12 pb-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-black text-white">الأطفال</h1>
            <p className="text-blue-200 text-sm mt-0.5">
              {filtered.length} طفل {filterLevel !== "all" ? "محدد" : "مسجل"}
            </p>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-white text-indigo-600 hover:bg-blue-50 shadow-lg"
            size="md"
          >
            <Plus size={18} />
            إضافة
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم الطفل..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-white/90 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
            dir="rtl"
          />
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {LEVEL_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilterLevel(value)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                filterLevel === value
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-gray-500 border border-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => setShowInactive(!showInactive)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
              showInactive
                ? "bg-gray-700 text-white"
                : "bg-white text-gray-500 border border-gray-200"
            }`}
          >
            <Filter size={12} />
            {showInactive ? "إخفاء غير النشطين" : "عرض غير النشطين"}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users size={18} className="text-blue-600" />
            </div>
            <div>
              <div className="text-xl font-black text-gray-900">{children.filter(c => c.isActive).length}</div>
              <div className="text-xs text-gray-400">طفل نشط</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <UserCheck size={18} className="text-emerald-600" />
            </div>
            <div>
              <div className="text-xl font-black text-gray-900">
                {children.filter(c => c.skillLevel === "advanced" || c.skillLevel === "intermediate").length}
              </div>
              <div className="text-xs text-gray-400">متوسط/متقدم</div>
            </div>
          </div>
        </div>

        {/* Children List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">👦</div>
            <p className="text-gray-500 font-bold">لا يوجد أطفال مسجلون</p>
            <p className="text-gray-400 text-sm mt-1">ابدئي بإضافة طفلك الأول!</p>
            <Button
              onClick={() => setShowAddModal(true)}
              className="mt-4"
            >
              <Plus size={16} />
              إضافة طفل
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((child) => (
              <ChildCard key={child.id} child={child} />
            ))}
          </div>
        )}
      </div>

      {/* Add Child Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="إضافة طفل جديد"
        size="lg"
      >
        <ChildForm
          onSuccess={() => {
            setShowAddModal(false);
            fetchChildren();
          }}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>
    </AppShell>
  );
}
