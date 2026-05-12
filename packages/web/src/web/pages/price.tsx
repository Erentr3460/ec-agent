import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TrendingDown, Send, Loader2, Bell } from "lucide-react";

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

export default function PricePage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    productUrl: "",
    productName: "",
    targetPrice: "",
    telegramChatId: "",
    daily: false,
  });

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
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
            <TrendingDown size={15} color="#888" />
          </div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: "#ececec", margin: 0 }}>Fiyat Takibi</h1>
        </div>
        <p style={{ fontSize: 12, color: "#444", margin: 0 }}>Trendyol, Amazon ve daha fazlası</p>
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
              Ürün URL *
            </label>
            <input
              value={form.productUrl}
              onChange={e => setForm(f => ({ ...f, productUrl: e.target.value }))}
              placeholder="https://www.trendyol.com/urun/..."
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, color: "#555", display: "block", marginBottom: 6, fontWeight: 500 }}>
              Ürün Adı
            </label>
            <input
              value={form.productName}
              onChange={e => setForm(f => ({ ...f, productName: e.target.value }))}
              placeholder="Örn: iPhone 15 Pro 256GB"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, color: "#555", display: "block", marginBottom: 6, fontWeight: 500 }}>
              Hedef Fiyat (TL)
            </label>
            <input
              type="number"
              value={form.targetPrice}
              onChange={e => setForm(f => ({ ...f, targetPrice: e.target.value }))}
              placeholder="Bu fiyata düşünce bildir — örn: 45000"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, color: "#555", display: "block", marginBottom: 6, fontWeight: 500 }}>
              Telegram Chat ID
            </label>
            <input
              value={form.telegramChatId}
              onChange={e => setForm(f => ({ ...f, telegramChatId: e.target.value }))}
              placeholder="123456789"
              style={inputStyle}
            />
          </div>

          {/* Daily toggle */}
          <div
            onClick={() => setForm(f => ({ ...f, daily: !f.daily }))}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 14px",
              borderRadius: 8,
              border: `1px solid ${form.daily ? "#242424" : "#1c1c1c"}`,
              background: "#080808",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Bell size={13} color="#555" />
              <div>
                <div style={{ fontSize: 13, color: "#ececec", fontWeight: 500 }}>Her Gün Kontrol Et</div>
                <div style={{ fontSize: 11, color: "#444", marginTop: 1 }}>Sabah 09:00'da otomatik kontrol</div>
              </div>
            </div>
            {/* Toggle */}
            <div style={{
              width: 36, height: 20, borderRadius: 10,
              background: form.daily ? "#7c3aed" : "#1c1c1c",
              transition: "background 0.2s",
              position: "relative",
              flexShrink: 0,
            }}>
              <div style={{
                position: "absolute",
                top: 3, left: form.daily ? 18 : 3,
                width: 14, height: 14,
                borderRadius: "50%",
                background: "#fff",
                transition: "left 0.2s",
              }} />
            </div>
          </div>

          <button
            onClick={() => createTask.mutate()}
            disabled={!form.productUrl || createTask.isPending}
            style={{
              width: "100%",
              padding: "11px",
              borderRadius: 8,
              border: "none",
              background: !form.productUrl ? "#141414" : "#7c3aed",
              color: !form.productUrl ? "#333" : "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: !form.productUrl ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {createTask.isPending ? (
              <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Kontrol ediliyor...</>
            ) : (
              <><Send size={14} /> Fiyat Takibini Başlat</>
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
              Fiyat takibi başlatıldı.{form.daily ? " Her gün 09:00'da kontrol edilecek." : ""}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
