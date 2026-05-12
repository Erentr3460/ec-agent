import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Send, Loader2, Terminal } from "lucide-react";
import { TiltCard } from "../components/tilt-card";

const inputStyle = {
  width: "100%", padding: "10px 14px",
  borderRadius: 8, border: "1px solid #0d2b1f",
  background: "#000", color: "#e8fdf5",
  fontSize: 12, outline: "none",
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
    <div style={{ padding: "32px 28px", maxWidth: 620, margin: "0 auto" }}>
      <div style={{ marginBottom: 28, animation: "fadeInUp 0.5s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Terminal size={12} color="#00ebb044" />
          <span style={{ fontSize: 10, color: "#2a5a45", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.12em" }}>
            AGENT / SEO_ANALYZER
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
            <Search size={15} color="#00ebb0" />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#e8fdf5", margin: 0, textShadow: "0 0 20px #00ebb022" }}>
            SEO Analizi
          </h1>
        </div>
        <p style={{ fontSize: 11, color: "#2a5a45", margin: 0, fontFamily: "JetBrains Mono, monospace" }}>
          &gt; Google #1 sıraya çıkma planı
        </p>
      </div>

      <TiltCard style={{
        background: "linear-gradient(135deg, #030f08, #000)",
        border: "1px solid #0d2b1f",
        borderRadius: 12, padding: "24px",
        animation: "fadeInUp 0.6s ease",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={{ fontSize: 10, color: "#2a5a45", display: "block", marginBottom: 8, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.08em" }}>
              // WEB SİTESİ URL *
            </label>
            <input
              value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              placeholder="https://example.com/blog-yazisi"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ fontSize: 10, color: "#2a5a45", display: "block", marginBottom: 8, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.08em" }}>
              // HEDEF ANAHTAR KELİMELER
            </label>
            <input
              value={form.targetKeywords}
              onChange={e => setForm(f => ({ ...f, targetKeywords: e.target.value }))}
              placeholder="SEO ajansı istanbul, dijital pazarlama"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ fontSize: 10, color: "#2a5a45", display: "block", marginBottom: 8, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.08em" }}>
              // TELEGRAM CHAT ID <span style={{ color: "#1e3d2e" }}>(opsiyonel)</span>
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
            padding: "12px 14px", borderRadius: 7,
            background: "#000", border: "1px solid #0d2b1f",
            fontSize: 10, color: "#2a5a45", lineHeight: 1.7,
            fontFamily: "JetBrains Mono, monospace",
          }}>
            <span style={{ color: "#00ebb066" }}>&gt;</span> Ajan sayfanı analiz eder, teknik SEO sorunlarını tespit eder<br />
            <span style={{ color: "#00ebb066" }}>&gt;</span> 1. sayfaya çıkma için adım adım strateji oluşturur
          </div>

          <button
            onClick={() => createTask.mutate()}
            disabled={!form.url || createTask.isPending}
            style={{
              width: "100%", padding: "13px", borderRadius: 8,
              border: "1px solid transparent",
              background: !form.url ? "#030f08" : "linear-gradient(90deg, #00ebb0, #00b884)",
              color: !form.url ? "#1e3d2e" : "#000",
              fontSize: 12, fontWeight: 700,
              cursor: !form.url ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.1em",
              boxShadow: form.url ? "0 0 20px #00ebb033" : "none",
              transition: "all 0.2s",
            }}
          >
            {createTask.isPending ? (
              <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> ANALYZING...</>
            ) : (
              <><Send size={13} /> RUN SEO_AGENT</>
            )}
          </button>

          {createTask.isSuccess && (
            <div style={{
              padding: "10px 14px", borderRadius: 7,
              background: "#00ebb011", border: "1px solid #00ebb033",
              fontSize: 11, color: "#00ebb0", textAlign: "center" as const,
              fontFamily: "JetBrains Mono, monospace",
              animation: "fadeInUp 0.3s ease",
            }}>
              ✓ SEO ANALYSIS STARTED — check dashboard
            </div>
          )}
        </div>
      </TiltCard>
    </div>
  );
}
