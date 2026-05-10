import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Send, Loader2 } from "lucide-react";

export default function SeoPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ url: "", targetKeywords: "", telegramChatId: "" });

  const createTask = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentType: "seo",
          title: `SEO: ${form.url}`,
          input: { url: form.url, targetKeywords: form.targetKeywords },
          telegramChatId: form.telegramChatId || null,
        }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setForm(f => ({ ...f, url: "" }));
    },
  });

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8 animate-fade-up">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(6,214,160,0.15)" }}>
          <Search size={20} style={{ color: "#06d6a0" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "Syne, sans-serif" }}>SEO Analizi</h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Google'da 1. sıraya çıkma planı</p>
        </div>
      </div>

      <div className="rounded-xl border p-6 animate-fade-up" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-muted)" }}>Web Sitesi URL *</label>
            <input
              value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              placeholder="https://example.com/blog-yazisi"
              className="w-full px-4 py-3 rounded-lg text-sm outline-none"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-muted)" }}>Hedef Anahtar Kelimeler</label>
            <input
              value={form.targetKeywords}
              onChange={e => setForm(f => ({ ...f, targetKeywords: e.target.value }))}
              placeholder="Örn: SEO ajansı istanbul, dijital pazarlama"
              className="w-full px-4 py-3 rounded-lg text-sm outline-none"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-muted)" }}>Telegram Chat ID (opsiyonel)</label>
            <input
              value={form.telegramChatId}
              onChange={e => setForm(f => ({ ...f, telegramChatId: e.target.value }))}
              placeholder="123456789"
              className="w-full px-4 py-3 rounded-lg text-sm outline-none"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
          </div>

          {/* Info box */}
          <div className="rounded-lg p-3" style={{ background: "rgba(6,214,160,0.05)", border: "1px solid rgba(6,214,160,0.15)" }}>
            <p className="text-xs" style={{ color: "#06d6a0" }}>
              🔍 Ajan sayfanı analiz eder, teknik SEO sorunlarını tespit eder ve 1. sayfaya çıkma için adım adım plan hazırlar.
            </p>
          </div>

          <button
            onClick={() => createTask.mutate()}
            disabled={!form.url || createTask.isPending}
            className="w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all"
            style={{
              background: !form.url ? "var(--border)" : "linear-gradient(135deg, #06d6a0, #059669)",
              color: !form.url ? "var(--text-muted)" : "white",
              cursor: !form.url ? "not-allowed" : "pointer",
            }}
          >
            {createTask.isPending ? (
              <><Loader2 size={16} className="animate-spin" /> Analiz başlatılıyor...</>
            ) : (
              <><Send size={16} /> SEO Analizi Başlat</>
            )}
          </button>

          {createTask.isSuccess && (
            <div className="rounded-lg p-3 text-xs text-center animate-fade-up" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>
              ✓ SEO analizi başlatıldı! Dashboard'dan takip edebilirsin.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
