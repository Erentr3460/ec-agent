import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImageIcon, Send, Loader2, Terminal, Cpu } from "lucide-react";
import { TiltCard } from "../components/tilt-card";

const STYLES = [
  { label: "PHOTOREALISTIC", value: "photorealistic, ultra detailed, professional photography", icon: "📷" },
  { label: "DIGITAL ART", value: "digital art, vibrant colors, artistic, concept art", icon: "🎨" },
  { label: "MINIMALIST", value: "minimalist, clean, flat design, simple", icon: "◻" },
  { label: "CINEMATIC", value: "cinematic, dramatic lighting, film still, 8k", icon: "🎬" },
  { label: "ANIME", value: "anime style, manga, illustrated", icon: "⛩" },
  { label: "AUTO", value: "", icon: "⚡" },
];

const inputStyle = {
  width: "100%", padding: "10px 14px",
  borderRadius: 8, border: "1px solid #0d2b1f",
  background: "#000", color: "#e8fdf5",
  fontSize: 12, outline: "none",
  boxSizing: "border-box" as const,
  fontFamily: "inherit",
};

export default function ImagePage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ prompt: "", style: "", telegramChatId: "" });

  const createTask = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentType: "image",
          title: `Görsel: ${form.prompt.slice(0, 40)}...`,
          input: { prompt: form.prompt, style: form.style },
          telegramChatId: form.telegramChatId || null,
        }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setForm(f => ({ ...f, prompt: "" }));
    },
  });

  return (
    <div style={{ padding: "32px 28px", maxWidth: 620, margin: "0 auto" }}>
      <div style={{ marginBottom: 28, animation: "fadeInUp 0.5s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Terminal size={12} color="#00ebb044" />
          <span style={{ fontSize: 10, color: "#2a5a45", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.12em" }}>
            AGENT / IMAGE_GENERATOR
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            border: "1px solid #00ebb033", background: "#030f08",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 12px #00ebb022",
          }}>
            <ImageIcon size={15} color="#00ebb0" />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#e8fdf5", margin: 0, textShadow: "0 0 20px #00ebb022" }}>
            Görsel Üretici
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Cpu size={10} color="#00ebb044" />
          <p style={{ fontSize: 11, color: "#2a5a45", margin: 0, fontFamily: "JetBrains Mono, monospace" }}>
            &gt; Powered by Gemini Pro Image
          </p>
        </div>
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
              // GÖRSEL PROMPT *
            </label>
            <textarea
              value={form.prompt}
              onChange={e => setForm(f => ({ ...f, prompt: e.target.value }))}
              placeholder="Bir kafede çalışan genç girişimci, sabah ışığı, kahve fincanı masada..."
              rows={4}
              style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }}
            />
          </div>

          {/* Style grid */}
          <div>
            <label style={{ fontSize: 10, color: "#2a5a45", display: "block", marginBottom: 10, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.08em" }}>
              // GÖRSEL STİLİ
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
              {STYLES.map(s => (
                <button
                  key={s.label}
                  onClick={() => setForm(f => ({ ...f, style: s.value }))}
                  style={{
                    padding: "9px 6px", borderRadius: 7,
                    border: `1px solid ${form.style === s.value ? "#00ebb066" : "#0d2b1f"}`,
                    background: form.style === s.value ? "rgba(0,235,176,0.08)" : "#000",
                    color: form.style === s.value ? "#00ebb0" : "#2a5a45",
                    fontSize: 9, fontWeight: 600, cursor: "pointer",
                    fontFamily: "JetBrains Mono, monospace",
                    transition: "all 0.2s",
                    boxShadow: form.style === s.value ? "0 0 10px #00ebb022" : "none",
                  }}
                >
                  <div style={{ fontSize: 14, marginBottom: 3 }}>{s.icon}</div>
                  <div>{s.label}</div>
                </button>
              ))}
            </div>
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
            padding: "10px 14px", borderRadius: 7,
            background: "#000", border: "1px solid #0d2b1f",
            fontSize: 10, color: "#2a5a45",
            fontFamily: "JetBrains Mono, monospace", lineHeight: 1.7,
          }}>
            <span style={{ color: "#00ebb066" }}>&gt;</span> Agent önce prompt'unu optimize eder<br />
            <span style={{ color: "#00ebb066" }}>&gt;</span> Ardından Gemini Pro Image ile üretir
          </div>

          <button
            onClick={() => createTask.mutate()}
            disabled={!form.prompt || createTask.isPending}
            style={{
              width: "100%", padding: "13px", borderRadius: 8,
              border: "1px solid transparent",
              background: !form.prompt ? "#030f08" : "linear-gradient(90deg, #00ebb0, #00b884)",
              color: !form.prompt ? "#1e3d2e" : "#000",
              fontSize: 12, fontWeight: 700,
              cursor: !form.prompt ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.1em",
              boxShadow: form.prompt ? "0 0 20px #00ebb033" : "none",
              transition: "all 0.2s",
            }}
          >
            {createTask.isPending ? (
              <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> GENERATING...</>
            ) : (
              <><Send size={13} /> RUN IMAGE_AGENT</>
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
              ✓ IMAGE GENERATION STARTED — check dashboard
            </div>
          )}
        </div>
      </TiltCard>
    </div>
  );
}
