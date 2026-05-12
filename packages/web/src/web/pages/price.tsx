import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TrendingDown, Send, Loader2, Bell, Terminal } from "lucide-react";
import { TiltCard } from "../components/tilt-card";

const inputStyle = {
  width: "100%", padding: "10px 14px",
  borderRadius: 8, border: "1px solid #0d2b1f",
  background: "#000", color: "#e8fdf5",
  fontSize: 12, outline: "none",
  boxSizing: "border-box" as const,
  fontFamily: "inherit",
};

export default function PricePage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ productUrl: "", productName: "", targetPrice: "", telegramChatId: "", daily: false });

  const createTask = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentType: "price",
          title: `Fiyat: ${form.productName || form.productUrl}`,
          input: {
            productUrl: form.productUrl,
            productName: form.productName,
            targetPrice: form.targetPrice ? parseFloat(form.targetPrice) : null,
          },
          telegramChatId: form.telegramChatId || null,
          cronExpression: form.daily ? "0 9 * * *" : null,
        }),
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  return (
    <div style={{ padding: "32px 28px", maxWidth: 620, margin: "0 auto" }}>
      <div style={{ marginBottom: 28, animation: "fadeInUp 0.5s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Terminal size={12} color="#00ebb044" />
          <span style={{ fontSize: 10, color: "#2a5a45", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.12em" }}>
            AGENT / PRICE_TRACKER
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            border: "1px solid #00ebb033", background: "#030f08",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 12px #00ebb022",
          }}>
            <TrendingDown size={15} color="#00ebb0" />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#e8fdf5", margin: 0, textShadow: "0 0 20px #00ebb022" }}>
            Fiyat Takibi
          </h1>
        </div>
        <p style={{ fontSize: 11, color: "#2a5a45", margin: 0, fontFamily: "JetBrains Mono, monospace" }}>
          &gt; Trendyol, Amazon ve daha fazlası
        </p>
      </div>

      <TiltCard style={{
        background: "linear-gradient(135deg, #030f08, #000)",
        border: "1px solid #0d2b1f",
        borderRadius: 12, padding: "24px",
        animation: "fadeInUp 0.6s ease",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {[
            { key: "productUrl", label: "// ÜRÜN URL *", placeholder: "https://www.trendyol.com/urun/..." },
            { key: "productName", label: "// ÜRÜN ADI", placeholder: "Örn: iPhone 15 Pro 256GB" },
            { key: "telegramChatId", label: "// TELEGRAM CHAT ID (opsiyonel)", placeholder: "123456789" },
          ].map(field => (
            <div key={field.key}>
              <label style={{ fontSize: 10, color: "#2a5a45", display: "block", marginBottom: 8, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.08em" }}>
                {field.label}
              </label>
              <input
                value={(form as any)[field.key]}
                onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                style={inputStyle}
              />
            </div>
          ))}

          <div>
            <label style={{ fontSize: 10, color: "#2a5a45", display: "block", marginBottom: 8, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.08em" }}>
              // HEDEF FİYAT (₺)
            </label>
            <input
              type="number"
              value={form.targetPrice}
              onChange={e => setForm(f => ({ ...f, targetPrice: e.target.value }))}
              placeholder="Bu fiyata düşünce bildir — örn: 45000"
              style={inputStyle}
            />
          </div>

          {/* Daily toggle */}
          <div
            onClick={() => setForm(f => ({ ...f, daily: !f.daily }))}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 14px", borderRadius: 8,
              border: `1px solid ${form.daily ? "#00ebb033" : "#0d2b1f"}`,
              background: form.daily ? "#00ebb008" : "#000",
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: form.daily ? "0 0 12px #00ebb011" : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Bell size={13} color={form.daily ? "#00ebb0" : "#2a5a45"} />
              <div>
                <div style={{ fontSize: 12, color: form.daily ? "#e8fdf5" : "#4a7a65", fontWeight: 500 }}>
                  Her Gün Kontrol Et
                </div>
                <div style={{ fontSize: 10, color: "#1e3d2e", marginTop: 1, fontFamily: "JetBrains Mono, monospace" }}>
                  Sabah 09:00 CRON JOB
                </div>
              </div>
            </div>
            <div style={{
              width: 36, height: 20, borderRadius: 10,
              background: form.daily ? "#00ebb0" : "#0d2b1f",
              transition: "background 0.2s",
              position: "relative",
              boxShadow: form.daily ? "0 0 8px #00ebb066" : "none",
            }}>
              <div style={{
                position: "absolute", top: 3, left: form.daily ? 18 : 3,
                width: 14, height: 14, borderRadius: "50%",
                background: form.daily ? "#000" : "#2a5a45",
                transition: "left 0.2s",
              }} />
            </div>
          </div>

          <button
            onClick={() => createTask.mutate()}
            disabled={!form.productUrl || createTask.isPending}
            style={{
              width: "100%", padding: "13px", borderRadius: 8,
              border: "1px solid transparent",
              background: !form.productUrl ? "#030f08" : "linear-gradient(90deg, #00ebb0, #00b884)",
              color: !form.productUrl ? "#1e3d2e" : "#000",
              fontSize: 12, fontWeight: 700,
              cursor: !form.productUrl ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.1em",
              boxShadow: form.productUrl ? "0 0 20px #00ebb033" : "none",
              transition: "all 0.2s",
            }}
          >
            {createTask.isPending ? (
              <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> SCANNING...</>
            ) : (
              <><Send size={13} /> RUN PRICE_AGENT</>
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
              ✓ PRICE TRACKING INITIALIZED{form.daily ? " — DAILY CRON SET" : ""}
            </div>
          )}
        </div>
      </TiltCard>
    </div>
  );
}
