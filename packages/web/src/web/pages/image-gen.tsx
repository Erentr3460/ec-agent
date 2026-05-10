import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImageIcon, Send, Loader2, Sparkles } from "lucide-react";

const STYLES = [
  { label: "Fotogerçekçi", value: "photorealistic, ultra detailed, professional photography" },
  { label: "Dijital Sanat", value: "digital art, vibrant colors, artistic, concept art" },
  { label: "Minimalist", value: "minimalist, clean, flat design, simple" },
  { label: "Sinematik", value: "cinematic, dramatic lighting, film still, 8k" },
  { label: "Anime", value: "anime style, manga, illustrated" },
  { label: "Otomatik", value: "" },
];

export default function ImagePage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    prompt: "",
    style: "",
    telegramChatId: "",
  });

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
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8 animate-fade-up">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(16,185,129,0.15)" }}>
          <ImageIcon size={20} style={{ color: "#10b981" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "Syne, sans-serif" }}>Görsel Üretici</h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Gemini Pro Image ile AI görsel üret</p>
        </div>
      </div>

      <div className="rounded-xl border p-6 animate-fade-up" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-muted)" }}>Ne görmek istiyorsun? *</label>
            <textarea
              value={form.prompt}
              onChange={e => setForm(f => ({ ...f, prompt: e.target.value }))}
              placeholder="Örn: Bir kafede çalışan genç girişimci, sabah ışığı, kahve fincanı masada, laptop açık..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-none"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
          </div>

          {/* Style selector */}
          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-muted)" }}>Görsel Stili</label>
            <div className="grid grid-cols-3 gap-2">
              {STYLES.map(s => (
                <button
                  key={s.label}
                  onClick={() => setForm(f => ({ ...f, style: s.value }))}
                  className="py-2 px-3 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: form.style === s.value ? "rgba(16,185,129,0.2)" : "var(--bg)",
                    border: `1px solid ${form.style === s.value ? "#10b981" : "var(--border)"}`,
                    color: form.style === s.value ? "#10b981" : "var(--text-muted)",
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
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

          <div className="rounded-lg p-3" style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)" }}>
            <p className="text-xs flex items-center gap-2" style={{ color: "#10b981" }}>
              <Sparkles size={12} />
              Ajan önce prompt'unu optimize eder, sonra Gemini Pro Image ile üretir.
            </p>
          </div>

          <button
            onClick={() => createTask.mutate()}
            disabled={!form.prompt || createTask.isPending}
            className="w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all"
            style={{
              background: !form.prompt ? "var(--border)" : "linear-gradient(135deg, #10b981, #059669)",
              color: !form.prompt ? "var(--text-muted)" : "white",
              cursor: !form.prompt ? "not-allowed" : "pointer",
            }}
          >
            {createTask.isPending ? (
              <><Loader2 size={16} className="animate-spin" /> Görsel üretiliyor...</>
            ) : (
              <><Send size={16} /> Görsel Üret</>
            )}
          </button>

          {createTask.isSuccess && (
            <div className="rounded-lg p-3 text-xs text-center animate-fade-up" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>
              ✓ Görsel üretimi başlatıldı! Dashboard'dan takip edebilirsin.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
