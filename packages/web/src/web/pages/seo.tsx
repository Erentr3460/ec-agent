import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Send, Loader2 } from "lucide-react";

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #1c1c1c",
  background: "#080808",
  color: "#ececec",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box" as const,
  fontFamily: "inherit",
};

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
    <div style={{ padding: "32px 28px", maxWidth: 600, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            border: "1px solid #1c1c1c",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Search size={15} color="#888" />
          </div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: "#ececec", margin: 0 }}>SEO Analizi</h1>
        </div>
        <p style={{ fontSize: 12, color: "#444", margin: 0 }}>Google'da 1. sıraya çıkma planı</p>
      </div>

      <div style={{
        background: "#0f0f0f",
        border: "1px solid #1c1c1c",
        borderRadius: 12,
        padding: "22px",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, color: "#555", display: "block", marginBottom: 6, fontWeight: 500 }}>
              Web Sitesi URL *
            </label>
            <input
              value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              placeholder="https://example.com/blog-yazisi"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, color: "#555", display: "block", marginBottom: 6, fontWeight: 500 }}>
              Hedef Anahtar Kelimeler
            </label>
            <input
              value={form.targetKeywords}
              onChange={e => setForm(f => ({ ...f, targetKeywords: e.target.value }))}
              placeholder="SEO ajansı istanbul, dijital pazarlama"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, color: "#555", display: "block", marginBottom: 6, fontWeight: 500 }}>
              Telegram Chat ID <span style={{ color: "#333" }}>(opsiyonel)</span>
            </label>
            <input
              value={form.telegramChatId}
              onChange={e => setForm(f => ({ ...f, telegramChatId: e.target.value }))}
              placeholder="123456789"
              style={inputStyle}
            />
          </div>

          {/* Info */}
          <div style={{
            padding: "10px 12px",
            borderRadius: 7,
            background: "#080808",
            border: "1px solid #1c1c1c",
            fontSize: 12,
            color: "#444",
            lineHeight: 1.5,
          }}>
            Ajan sayfanı analiz eder, teknik SEO sorunlarını tespit eder ve 1. sayfaya çıkma için adım adım plan hazırlar.
          </div>

          <button
            onClick={() => createTask.mutate()}
            disabled={!form.url || createTask.isPending}
            style={{
              width: "100%",
              padding: "11px",
              borderRadius: 8,
              border: "none",
              background: !form.url ? "#141414" : "#7c3aed",
              color: !form.url ? "#333" : "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: !form.url ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {createTask.isPending ? (
              <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Analiz başlatılıyor...</>
            ) : (
              <><Send size={14} /> SEO Analizi Başlat</>
            )}
          </button>

          {createTask.isSuccess && (
            <div style={{
              padding: "10px 14px",
              borderRadius: 7,
              background: "rgba(34,197,94,0.05)",
              border: "1px solid rgba(34,197,94,0.15)",
              fontSize: 12,
              color: "#22c55e",
              textAlign: "center" as const,
            }}>
              SEO analizi başlatıldı — Dashboard'dan takip et.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
