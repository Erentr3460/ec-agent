import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Send, Loader2 } from "lucide-react";

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

export default function BlogPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    topic: "",
    keywords: "",
    length: "orta",
    telegramChatId: "",
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
    <div style={{ padding: "32px 28px", maxWidth: 600, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            border: "1px solid #1c1c1c",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <FileText size={15} color="#7c3aed" />
          </div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: "#ececec", margin: 0 }}>Blog Yazarı</h1>
        </div>
        <p style={{ fontSize: 12, color: "#444", margin: 0 }}>SEO uyumlu, AI destekli blog içeriği üret</p>
      </div>

      <div style={{
        background: "#0f0f0f",
        border: "1px solid #1c1c1c",
        borderRadius: 12,
        padding: "22px 22px",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Topic */}
          <div>
            <label style={{ fontSize: 11, color: "#555", display: "block", marginBottom: 6, fontWeight: 500 }}>
              Blog Konusu *
            </label>
            <input
              value={form.topic}
              onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
              placeholder="Örn: 2025 yılında en iyi SEO teknikleri"
              style={inputStyle}
            />
          </div>

          {/* Keywords */}
          <div>
            <label style={{ fontSize: 11, color: "#555", display: "block", marginBottom: 6, fontWeight: 500 }}>
              Hedef Anahtar Kelimeler
            </label>
            <input
              value={form.keywords}
              onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))}
              placeholder="SEO, anahtar kelime araştırması, Google sıralaması"
              style={inputStyle}
            />
          </div>

          {/* Length */}
          <div>
            <label style={{ fontSize: 11, color: "#555", display: "block", marginBottom: 6, fontWeight: 500 }}>
              İçerik Uzunluğu
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { key: "kısa", label: "Kısa", sub: "~500 kelime" },
                { key: "orta", label: "Orta", sub: "~1000 kelime" },
                { key: "uzun", label: "Uzun", sub: "~2000 kelime" },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setForm(f => ({ ...f, length: opt.key }))}
                  style={{
                    flex: 1,
                    padding: "9px 8px",
                    borderRadius: 7,
                    border: `1px solid ${form.length === opt.key ? "#7c3aed" : "#1c1c1c"}`,
                    background: form.length === opt.key ? "rgba(124,58,237,0.1)" : "#080808",
                    color: form.length === opt.key ? "#7c3aed" : "#555",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    textAlign: "center" as const,
                  }}
                >
                  <div>{opt.label}</div>
                  <div style={{ fontSize: 10, opacity: 0.7, marginTop: 1 }}>{opt.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Telegram */}
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

          {/* Submit */}
          <button
            onClick={() => createTask.mutate()}
            disabled={!form.topic || createTask.isPending}
            style={{
              width: "100%",
              padding: "11px",
              borderRadius: 8,
              border: "none",
              background: !form.topic ? "#141414" : "#7c3aed",
              color: !form.topic ? "#333" : "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: !form.topic ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {createTask.isPending ? (
              <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Başlatılıyor...</>
            ) : (
              <><Send size={14} /> Blog Yaz</>
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
              Ajan başlatıldı — Dashboard'dan takip et.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
