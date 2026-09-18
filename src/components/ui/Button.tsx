"use client";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium rounded-2xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
          {
            "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-purple-200 hover:shadow-purple-300 hover:from-violet-600 hover:to-purple-700":
              variant === "primary",
            "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm":
              variant === "secondary",
            "bg-transparent text-gray-600 hover:bg-gray-100": variant === "ghost",
            "bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-200":
              variant === "danger",
            "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-200":
              variant === "success",
            "border-2 border-violet-300 text-violet-600 hover:bg-violet-50":
              variant === "outline",
          },
          {
            "px-3 py-1.5 text-xs": size === "sm",
            "px-4 py-2.5 text-sm": size === "md",
            "px-6 py-3 text-base": size === "lg",
            "w-10 h-10 rounded-xl": size === "icon",
          },
          className
        )}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
