"use client";
import { useState } from "react";
import { MessageCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { getWhatsAppUrl, fillTemplate } from "@/lib/utils";
import type { MessageTemplate } from "@/db/schema";

interface WhatsAppButtonProps {
  phone: string;
  childName: string;
  parentName: string;
  sessionTime?: string;
  templates?: MessageTemplate[];
  variant?: "icon" | "button";
  className?: string;
}

export function WhatsAppButton({
  phone,
  childName,
  parentName,
  sessionTime,
  templates = [],
  variant = "button",
  className,
}: WhatsAppButtonProps) {
  const [showTemplates, setShowTemplates] = useState(false);

  const openWhatsApp = (message?: string) => {
    const url = getWhatsAppUrl(phone, message);
    window.open(url, "_blank");
    setShowTemplates(false);
  };

  const applyTemplate = (template: MessageTemplate) => {
    const vars: Record<string, string> = {
      childName,
      parentName,
      time: sessionTime || "",
    };
    const message = fillTemplate(template.templateAr || template.template, vars);
    openWhatsApp(message);
  };

  if (variant === "icon") {
    return (
      <button
        onClick={() => templates.length > 0 ? setShowTemplates(true) : openWhatsApp()}
        className={`w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-colors ${className}`}
      >
        <MessageCircle size={18} />
      </button>
    );
  }

  return (
    <>
      <Button
        variant="success"
        onClick={() => templates.length > 0 ? setShowTemplates(true) : openWhatsApp()}
        className={`flex items-center gap-2 ${className}`}
      >
        <MessageCircle size={16} />
        تواصل عبر واتساب
        {templates.length > 0 && <ChevronDown size={14} />}
      </Button>

      <Modal
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        title="اختر رسالة"
        size="sm"
      >
        <div className="space-y-3">
          <button
            onClick={() => openWhatsApp()}
            className="w-full text-right p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="text-sm font-medium text-gray-800">رسالة فارغة</div>
            <div className="text-xs text-gray-400">افتح واتساب بدون رسالة مسبقة</div>
          </button>

          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => applyTemplate(template)}
              className="w-full text-right p-3 rounded-xl border border-gray-100 hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
            >
              <div className="text-sm font-medium text-gray-800">
                {template.nameAr || template.name}
              </div>
              <div className="text-xs text-gray-400 mt-1 line-clamp-2" dir="rtl">
                {fillTemplate(template.templateAr || template.template, {
                  childName,
                  parentName,
                  time: sessionTime || "[الوقت]",
                })}
              </div>
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}
