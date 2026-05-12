import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImageIcon, Send, Loader2 } from "lucide-react";

const STYLES = [
  { label: "Fotogerçekçi", value: "photorealistic, ultra detailed, professional photography" },
  { label: "Dijital Sanat", value: "digital art, vibrant colors, artistic, concept art" },
  { label: "Minimalist", value: "minimalist, clean, flat design, simple" },
  { label: "Sinematik", value: "cinematic, dramatic lighting, film still, 8k" },
  { label: "Anime", value: "anime style, manga, illustrated" },
  { label: "Otomatik", value: "" },
];

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
    <div style={{ padding: "32px 28px", maxWidth: 600, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            border: "1px solid #1c1c1c",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ImageIcon size={15} color="#888" />
          </div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: "#ececec", margin: 0 }}>Görsel Üretici</h1>
        </div>
        <p style={{ fontSize: 12, color: "#444", margin: 0 }}>Gemini Pro Image ile AI görsel üret</p>
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
              Ne görmek istiyorsun? *
            </label>
            <textarea
              value={form.prompt}
              onChange={e => setForm(f => ({ ...f, prompt: e.target.value }))}
              placeholder="Bir kafede çalışan genç girişimci, sabah ışığı, kahve fincanı masada, laptop açık..."
              rows={4}
              style={{
                ...inputStyle,
                resize: "none",
                lineHeight: 1.5,
              }}
            />
          </div>

          {/* Style selector */}
          <div>
            <label style={{ fontSize: 11, color: "#555", display: "block", marginBottom: 8, fontWeight: 500 }}>
              Görsel Stili
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
              {STYLES.map(s => (
                <button
                  key={s.label}
                  onClick={() => setForm(f => ({ ...f, style: s.value }))}
                  style={{
                    padding: "8px 6px",
                    borderRadius: 7,
                    border: `1px solid ${form.style === s.value ? "#7c3aed" : "#1c1c1c"}`,
                    background: form.style === s.value ? "rgba(124,58,237,0.1)" : "#080808",
                    color: form.style === s.value ? "#7c3aed" : "#555",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
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
            padding: "9px 12px",
            borderRadius: 7,
            background: "#080808",
            border: "1px solid #1c1c1c",
            fontSize: 12,
            color: "#444",
          }}>
            Ajan önce prompt'unu optimize eder, sonra Gemini Pro Image ile üretir.
          </div>

          <button
            onClick={() => createTask.mutate()}
            disabled={!form.prompt || createTask.isPending}
            style={{
              width: "100%",
              padding: "11px",
              borderRadius: 8,
              border: "none",
              background: !form.prompt ? "#141414" : "#7c3aed",
              color: !form.prompt ? "#333" : "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: !form.prompt ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {createTask.isPending ? (
              <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Görsel üretiliyor...</>
            ) : (
              <><Send size={14} /> Görsel Üret</>
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
              Görsel üretimi başlatıldı — Dashboard'dan takip et.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
