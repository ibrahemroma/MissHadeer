"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Calendar, Settings, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "الرئيسية", labelEn: "Home" },
  { href: "/children", icon: Users, label: "الأطفال", labelEn: "Children" },
  { href: "/schedule", icon: Calendar, label: "الجدول", labelEn: "Schedule" },
  { href: "/search", icon: Search, label: "بحث", labelEn: "Search" },
  { href: "/settings", icon: Settings, label: "الإعدادات", labelEn: "Settings" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-lg safe-area-pb">
      <div className="flex items-center justify-around px-2 pt-2 pb-3 max-w-md mx-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200",
                isActive
                  ? "text-violet-600"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              <div className={cn(
                "w-10 h-10 flex items-center justify-center rounded-2xl transition-all duration-200",
                isActive ? "bg-violet-100" : "hover:bg-gray-100"
              )}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={cn(
                "text-[10px] font-medium",
                isActive ? "text-violet-600" : "text-gray-400"
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
