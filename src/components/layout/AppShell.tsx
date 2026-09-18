"use client";
import { BottomNav } from "./BottomNav";
import { Toaster } from "react-hot-toast";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto relative">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: "16px",
            background: "#1f2937",
            color: "#fff",
            fontSize: "14px",
          },
        }}
      />
      <main className="pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}
