import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Send, Loader2, Terminal } from "lucide-react";
import { TiltCard } from "../components/tilt-card";

const inputStyle = {
  width: "100%", padding: "10px 14px",
  borderRadius: 8, border: "1px solid #0d2b1f",
  background: "#000", color: "#e8fdf5",
  fontSize: 12, outline: "none",
  boxSizing: "border-box" as const,
  fontFamily: "inherit",
  transition: "border-color .2s, box-shadow .2s",
};

export default function BlogPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ topic: "", keywords: "", length: "orta", telegramChatId: "" });

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
    <div style={{ padding: "32px 28px", maxWidth: 620, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 28, animation: "fadeInUp 0.5s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Terminal size={12} color="#00ebb044" />
          <span style={{ fontSize: 10, color: "#2a5a45", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.12em" }}>
            AGENT / BLOG_WRITER
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            border: "1px solid #00ebb033",
            background: "#030f08",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 12px #00ebb022",
          }}>
            <FileText size={15} color="#00ebb0" />
          </div>
          <h1 style={{
            fontSize: 20, fontWeight: 800, color: "#e8fdf5", margin: 0,
            textShadow: "0 0 20px #00ebb022",
          }}>Blog Yazarı</h1>
        </div>
        <p style={{ fontSize: 11, color: "#2a5a45", margin: 0, fontFamily: "JetBrains Mono, monospace" }}>
          &gt; SEO uyumlu, AI destekli içerik üretimi
        </p>
      </div>

      <TiltCard style={{
        background: "linear-gradient(135deg, #030f08, #000)",
        border: "1px solid #0d2b1f",
        borderRadius: 12,
        padding: "24px",
        animation: "fadeInUp 0.6s ease",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Topic */}
          <div>
            <label style={{
              fontSize: 10, color: "#2a5a45", display: "block", marginBottom: 8,
              fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.08em",
            }}>
              // BLOG KONUSU *
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
            <label style={{
              fontSize: 10, color: "#2a5a45", display: "block", marginBottom: 8,
              fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.08em",
            }}>
              // HEDEF ANAHTAR KELİMELER
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
            <label style={{
              fontSize: 10, color: "#2a5a45", display: "block", marginBottom: 10,
              fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.08em",
            }}>
              // İÇERİK UZUNLUĞU
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { key: "kısa", label: "KISA", sub: "~500 kelime" },
                { key: "orta", label: "ORTA", sub: "~1000 kelime" },
                { key: "uzun", label: "UZUN", sub: "~2000 kelime" },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setForm(f => ({ ...f, length: opt.key }))}
                  style={{
                    flex: 1, padding: "10px 8px", borderRadius: 7,
                    border: `1px solid ${form.length === opt.key ? "#00ebb066" : "#0d2b1f"}`,
                    background: form.length === opt.key ? "rgba(0,235,176,0.08)" : "#000",
                    color: form.length === opt.key ? "#00ebb0" : "#2a5a45",
                    fontSize: 10, fontWeight: 600, cursor: "pointer",
                    textAlign: "center" as const,
                    fontFamily: "JetBrains Mono, monospace",
                    transition: "all 0.2s",
                    boxShadow: form.length === opt.key ? "0 0 12px #00ebb022" : "none",
                  }}
                >
                  <div>{opt.label}</div>
                  <div style={{ fontSize: 9, opacity: 0.6, marginTop: 2 }}>{opt.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Telegram */}
          <div>
            <label style={{
              fontSize: 10, color: "#2a5a45", display: "block", marginBottom: 8,
              fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.08em",
            }}>
              // TELEGRAM CHAT ID <span style={{ color: "#1e3d2e" }}>(opsiyonel)</span>
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
              width: "100%", padding: "13px",
              borderRadius: 8, border: "1px solid transparent",
              background: !form.topic ? "#030f08" : "linear-gradient(90deg, #00ebb0, #00b884)",
              color: !form.topic ? "#1e3d2e" : "#000",
              fontSize: 12, fontWeight: 700,
              cursor: !form.topic ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontFamily: "JetBrains Mono, monospace",
              letterSpacing: "0.1em",
              boxShadow: form.topic ? "0 0 20px #00ebb033" : "none",
              transition: "all 0.2s",
            }}
          >
            {createTask.isPending ? (
              <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> EXECUTING...</>
            ) : (
              <><Send size={13} /> RUN BLOG_AGENT</>
            )}
          </button>

          {createTask.isSuccess && (
            <div style={{
              padding: "10px 14px", borderRadius: 7,
              background: "#00ebb011",
              border: "1px solid #00ebb033",
              fontSize: 11, color: "#00ebb0",
              textAlign: "center" as const,
              fontFamily: "JetBrains Mono, monospace",
              boxShadow: "0 0 12px #00ebb011",
              animation: "fadeInUp 0.3s ease",
            }}>
              ✓ AGENT INITIALIZED — check dashboard
            </div>
          )}
        </div>
      </TiltCard>
    </div>
  );
}
