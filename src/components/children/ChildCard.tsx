"use client";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { MessageCircle, MapPin, ChevronLeft } from "lucide-react";
import { SKILL_LEVELS, getWhatsAppUrl } from "@/lib/utils";
import type { Child, Parent } from "@/db/schema";

interface ChildWithParent extends Child {
  parents: Parent[];
}

interface ChildCardProps {
  child: ChildWithParent;
}

export function ChildCard({ child }: ChildCardProps) {
  const router = useRouter();
  const parent = child.parents[0];
  const level = SKILL_LEVELS[child.skillLevel] || SKILL_LEVELS.beginner;

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (parent?.phone) {
      window.open(getWhatsAppUrl(parent.phone), "_blank");
    }
  };

  return (
    <Card
      hover
      onClick={() => router.push(`/children/${child.id}`)}
      className="p-4"
    >
      <div className="flex items-center gap-3">
        <Avatar name={child.fullName} color={child.avatarColor} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900 text-sm">{child.fullName}</h3>
            {child.fullNameAr && (
              <span className="text-xs text-gray-400 font-arabic">{child.fullNameAr}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {child.age && (
              <span className="text-xs text-gray-500">{child.age} سنوات</span>
            )}
            <Badge color={level.color} bg={level.bg}>
              {level.labelAr}
            </Badge>
          </div>
          {parent && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-gray-400 truncate">
                ولي الأمر: {parent.name}
              </span>
            </div>
          )}
          {parent?.homeAddress && (
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={10} className="text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-400 truncate">{parent.homeAddress}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {parent?.phone && (
            <button
              onClick={handleWhatsApp}
              className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-colors"
            >
              <MessageCircle size={16} />
            </button>
          )}
          <ChevronLeft size={16} className="text-gray-300" />
        </div>
      </div>
    </Card>
  );
}
