"use client";
import { useState, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ChildCard } from "@/components/children/ChildCard";
import { SessionCard } from "@/components/sessions/SessionCard";
import { Input } from "@/components/ui/Input";
import { Search, Users, Calendar } from "lucide-react";
import type { Child, Parent, Session, SessionNote } from "@/db/schema";

interface ChildWithParent extends Child {
  parents: Parent[];
}

interface SessionWithRelations extends Session {
  child: Child & { parents: Parent[] };
  notes: SessionNote[];
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [children, setChildren] = useState<ChildWithParent[]>([]);
  const [sessions, setSessions] = useState<SessionWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<"children" | "sessions">("children");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim() && !dateFrom && !dateTo && paymentFilter === "all") return;
    setLoading(true);
    setHasSearched(true);
    try {
      const childParams = new URLSearchParams({ activeOnly: "false" });
      if (q) childParams.set("search", q);

      const sessParams = new URLSearchParams();
      if (paymentFilter !== "all") sessParams.set("paymentStatus", paymentFilter);
      if (dateFrom) sessParams.set("startDate", new Date(dateFrom).toISOString());
      if (dateTo) sessParams.set("endDate", new Date(dateTo + "T23:59:59").toISOString());

      const [childRes, sessRes] = await Promise.all([
        fetch(`/api/children?${childParams}`),
        fetch(`/api/sessions?${sessParams}`),
      ]);
      const childData = await childRes.json();
      const sessData = await sessRes.json();
      setChildren(Array.isArray(childData) ? childData : []);
      setSessions(Array.isArray(sessData) ? sessData : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, paymentFilter]);

  const handleSearch = (value: string) => {
    setQuery(value);
    const timer = setTimeout(() => performSearch(value), 500);
    return () => clearTimeout(timer);
  };

  const handleFilter = () => performSearch(query);

  const filteredSessions = sessions.filter((s) => {
    if (!query) return true;
    return (
      s.child.fullName.toLowerCase().includes(query.toLowerCase()) ||
      s.child.parents?.[0]?.name?.toLowerCase().includes(query.toLowerCase()) ||
      s.address?.toLowerCase().includes(query.toLowerCase())
    );
  });

  return (
    <AppShell>
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-500 to-emerald-600 px-5 pt-12 pb-6">
        <h1 className="text-2xl font-black text-white mb-4">البحث والتصفية</h1>
        <div className="relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="ابحث باسم الطفل أو ولي الأمر..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-white text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
            dir="rtl"
          />
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <h3 className="text-sm font-bold text-gray-700">فلترة الحصص</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">من تاريخ</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-300"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">إلى تاريخ</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-300"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">حالة الدفع</label>
            <div className="flex gap-2">
              {[
                { value: "all", label: "الكل" },
                { value: "paid", label: "مدفوعة" },
                { value: "unpaid", label: "غير مدفوعة" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setPaymentFilter(value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold flex-1 transition-all ${
                    paymentFilter === value
                      ? "bg-teal-600 text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleFilter}
            className="w-full py-2.5 rounded-xl bg-teal-600 text-white text-sm font-bold hover:bg-teal-700 transition-colors"
          >
            تطبيق الفلترة
          </button>
        </div>

        {/* Tabs */}
        {hasSearched && (
          <>
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              <button
                onClick={() => setActiveTab("children")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === "children" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
                }`}
              >
                <Users size={15} />
                الأطفال ({children.length})
              </button>
              <button
                onClick={() => setActiveTab("sessions")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === "sessions" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
                }`}
              >
                <Calendar size={15} />
                الحصص ({filteredSessions.length})
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                {activeTab === "children" && (
                  <div className="space-y-3">
                    {children.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">🔍</div>
                        <p className="text-gray-400 text-sm">لا توجد نتائج</p>
                      </div>
                    ) : (
                      children.map((child) => (
                        <ChildCard key={child.id} child={child} />
                      ))
                    )}
                  </div>
                )}

                {activeTab === "sessions" && (
                  <div className="space-y-3">
                    {filteredSessions.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">🔍</div>
                        <p className="text-gray-400 text-sm">لا توجد نتائج</p>
                      </div>
                    ) : (
                      filteredSessions.map((session) => (
                        <SessionCard key={session.id} session={session} />
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {!hasSearched && (
          <div className="text-center py-12">
            <div className="text-6xl mb-3">🔍</div>
            <p className="text-gray-500 font-bold">ابدئي البحث</p>
            <p className="text-gray-400 text-sm mt-1">
              ابحثي باسم الطفل أو استخدمي الفلاتر أعلاه
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
