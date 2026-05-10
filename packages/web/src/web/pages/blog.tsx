import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Send, Loader2 } from "lucide-react";

export default function BlogPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    topic: "",
    keywords: "",
    length: "orta",
    telegramChatId: "",
    scheduled: false,
    cronExpression: "",
  });

  const createTask = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentType: "blog",
          title: `Blog: ${form.topic}`,
          input: { topic: form.topic, keywords: form.keywords, length: form.length },
          telegramChatId: form.telegramChatId || null,
          cronExpression: form.scheduled ? form.cronExpression : null,
        }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setForm(f => ({ ...f, topic: "", keywords: "" }));
    },
  });

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 animate-fade-up">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.15)" }}>
          <FileText size={20} style={{ color: "#7c3aed" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "Syne, sans-serif" }}>Blog Yazarı</h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>SEO uyumlu, AI destekli blog içeriği</p>
        </div>
      </div>

      <div className="rounded-xl border p-6 animate-fade-up" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="space-y-4">
          {/* Topic */}
          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-muted)" }}>
              Blog Konusu *
            </label>
            <input
              value={form.topic}
              onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
              placeholder="Örn: 2025 yılında en iyi SEO teknikleri"
              className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            />
          </div>

          {/* Keywords */}
          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-muted)" }}>
              Hedef Anahtar Kelimeler
            </label>
            <input
              value={form.keywords}
              onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))}
              placeholder="Örn: SEO, anahtar kelime araştırması, Google sıralaması"
              className="w-full px-4 py-3 rounded-lg text-sm outline-none"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
          </div>

          {/* Length */}
          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-muted)" }}>
              İçerik Uzunluğu
            </label>
            <div className="flex gap-2">
              {["kısa", "orta", "uzun"].map(len => (
                <button
                  key={len}
                  onClick={() => setForm(f => ({ ...f, length: len }))}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all capitalize"
                  style={{
                    background: form.length === len ? "rgba(124,58,237,0.2)" : "var(--bg)",
                    border: `1px solid ${form.length === len ? "#7c3aed" : "var(--border)"}`,
                    color: form.length === len ? "#7c3aed" : "var(--text-muted)",
                  }}
                >
                  {len} {len === "kısa" ? "(~500)" : len === "orta" ? "(~1000)" : "(~2000)"}
                </button>
              ))}
            </div>
          </div>

          {/* Telegram */}
          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-muted)" }}>
              Telegram Chat ID (opsiyonel)
            </label>
            <input
              value={form.telegramChatId}
              onChange={e => setForm(f => ({ ...f, telegramChatId: e.target.value }))}
              placeholder="Örn: 123456789"
              className="w-full px-4 py-3 rounded-lg text-sm outline-none"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
          </div>

          {/* Submit */}
          <button
            onClick={() => createTask.mutate()}
            disabled={!form.topic || createTask.isPending}
            className="w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all"
            style={{
              background: !form.topic ? "var(--border)" : "linear-gradient(135deg, #7c3aed, #5b21b6)",
              color: !form.topic ? "var(--text-muted)" : "white",
              cursor: !form.topic ? "not-allowed" : "pointer",
            }}
          >
            {createTask.isPending ? (
              <><Loader2 size={16} className="animate-spin" /> Ajan başlatılıyor...</>
            ) : (
              <><Send size={16} /> Blog Yaz</>
            )}
          </button>

          {createTask.isSuccess && (
            <div className="rounded-lg p-3 text-xs text-center animate-fade-up" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>
              ✓ Ajan başlatıldı! Dashboard'dan takip edebilirsin.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
