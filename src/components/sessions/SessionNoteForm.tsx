"use client";
import { useState } from "react";
import { Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { STRENGTH_TAGS, WEAKNESS_TAGS } from "@/lib/utils";
import toast from "react-hot-toast";
import type { SessionNote } from "@/db/schema";

interface SessionNoteFormProps {
  sessionId: string;
  childId: string;
  existingNote?: SessionNote;
  onSuccess: (note: SessionNote) => void;
  onCancel: () => void;
}

interface TagSelectorProps {
  tags: string[];
  selected: string[];
  onChange: (tags: string[]) => void;
  color: "emerald" | "rose";
}

function TagSelector({ tags, selected, onChange, color }: TagSelectorProps) {
  const toggle = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => toggle(tag)}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
            selected.includes(tag)
              ? color === "emerald"
                ? "bg-emerald-500 text-white"
                : "bg-rose-500 text-white"
              : color === "emerald"
              ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
              : "bg-rose-50 text-rose-600 hover:bg-rose-100"
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}

export function SessionNoteForm({
  sessionId,
  childId,
  existingNote,
  onSuccess,
  onCancel,
}: SessionNoteFormProps) {
  const [loading, setLoading] = useState(false);
  const [strengthTags, setStrengthTags] = useState<string[]>(
    (existingNote?.strengthTags as string[]) || []
  );
  const [weaknessTags, setWeaknessTags] = useState<string[]>(
    (existingNote?.weaknessTags as string[]) || []
  );

  const [form, setForm] = useState({
    topicsCovered: existingNote?.topicsCovered || "",
    topicsPending: existingNote?.topicsPending || "",
    strengthsText: existingNote?.strengthsText || "",
    weaknessesText: existingNote?.weaknessesText || "",
    nextSessionFocus: existingNote?.nextSessionFocus || "",
    reviewItems: existingNote?.reviewItems || "",
    freeNotes: existingNote?.freeNotes || "",
  });

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        sessionId,
        childId,
        ...form,
        strengthTags,
        weaknessTags,
        strengths: strengthTags,
        weaknesses: weaknessTags,
      };

      const res = await fetch(
        existingNote
          ? `/api/session-notes/${existingNote.id}`
          : "/api/session-notes",
        {
          method: existingNote ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      toast.success("تم حفظ ملاحظات الحصة ✓");
      onSuccess(data);
    } catch {
      toast.error("حدث خطأ، يرجى المحاولة مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Topics Covered */}
      <div className="space-y-3 p-3 bg-blue-50 rounded-xl">
        <h4 className="text-sm font-bold text-blue-700 flex items-center gap-2">
          📚 ما تم تدريسه
        </h4>
        <Textarea
          label="المواضيع التي تم تناولها"
          value={form.topicsCovered}
          onChange={(e) => update("topicsCovered", e.target.value)}
          placeholder="المواضيع والمهارات التي تم تدريسها في هذه الحصة..."
          rows={3}
        />
        <Textarea
          label="ما لم يتم تناوله / معلق"
          value={form.topicsPending}
          onChange={(e) => update("topicsPending", e.target.value)}
          placeholder="المواضيع التي لم يتسع لها الوقت أو تحتاج حصة أخرى..."
          rows={2}
        />
      </div>

      {/* Strengths */}
      <div className="space-y-3 p-3 bg-emerald-50 rounded-xl">
        <h4 className="text-sm font-bold text-emerald-700 flex items-center gap-2">
          ⭐ نقاط القوة
        </h4>
        <TagSelector
          tags={STRENGTH_TAGS}
          selected={strengthTags}
          onChange={setStrengthTags}
          color="emerald"
        />
        <Textarea
          label="ملاحظات القوة (اختياري)"
          value={form.strengthsText}
          onChange={(e) => update("strengthsText", e.target.value)}
          placeholder="وصف تفصيلي لنقاط القوة..."
          rows={2}
        />
      </div>

      {/* Weaknesses */}
      <div className="space-y-3 p-3 bg-rose-50 rounded-xl">
        <h4 className="text-sm font-bold text-rose-700 flex items-center gap-2">
          🎯 نقاط تحتاج تحسين
        </h4>
        <TagSelector
          tags={WEAKNESS_TAGS}
          selected={weaknessTags}
          onChange={setWeaknessTags}
          color="rose"
        />
        <Textarea
          label="ملاحظات تفصيلية (اختياري)"
          value={form.weaknessesText}
          onChange={(e) => update("weaknessesText", e.target.value)}
          placeholder="وصف المجالات التي تحتاج مزيداً من التركيز..."
          rows={2}
        />
      </div>

      {/* Next Session */}
      <div className="space-y-3 p-3 bg-violet-50 rounded-xl">
        <h4 className="text-sm font-bold text-violet-700 flex items-center gap-2">
          🔮 الحصة القادمة
        </h4>
        <Textarea
          label="التركيز في الحصة القادمة"
          value={form.nextSessionFocus}
          onChange={(e) => update("nextSessionFocus", e.target.value)}
          placeholder="ما يجب التركيز عليه في الحصة القادمة..."
          rows={2}
        />
        <Textarea
          label="ما يجب مراجعته"
          value={form.reviewItems}
          onChange={(e) => update("reviewItems", e.target.value)}
          placeholder="المواضيع التي تحتاج مراجعة في الحصة القادمة..."
          rows={2}
        />
      </div>

      {/* Free Notes */}
      <Textarea
        label="ملاحظات حرة"
        value={form.freeNotes}
        onChange={(e) => update("freeNotes", e.target.value)}
        placeholder="أي ملاحظات إضافية عن الحصة..."
        rows={3}
      />

      <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
          إلغاء
        </Button>
        <Button type="submit" className="flex-1" loading={loading}>
          حفظ الملاحظات
        </Button>
      </div>
    </form>
  );
}
