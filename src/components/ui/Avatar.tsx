"use client";
import { cn } from "@/lib/utils";
import { getAvatarInitials } from "@/lib/utils";

interface AvatarProps {
  name: string;
  color?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZES = {
  xs: "w-7 h-7 text-xs",
  sm: "w-9 h-9 text-sm",
  md: "w-12 h-12 text-base",
  lg: "w-16 h-16 text-xl",
  xl: "w-20 h-20 text-2xl",
};

export function Avatar({ name, color = "#6366f1", size = "md", className }: AvatarProps) {
  const initials = getAvatarInitials(name);
  return (
    <div
      className={cn(
        "rounded-2xl flex items-center justify-center font-bold text-white flex-shrink-0 shadow-sm",
        SIZES[size],
        className
      )}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}
