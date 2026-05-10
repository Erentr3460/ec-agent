import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TrendingDown, Send, Loader2, Bell } from "lucide-react";

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
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8 animate-fade-up">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.15)" }}>
          <TrendingDown size={20} style={{ color: "#f59e0b" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "Syne, sans-serif" }}>Fiyat Takibi</h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Trendyol, Amazon ve daha fazlası</p>
        </div>
      </div>

      <div className="rounded-xl border p-6 animate-fade-up" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-muted)" }}>Ürün URL *</label>
            <input
              value={form.productUrl}
              onChange={e => setForm(f => ({ ...f, productUrl: e.target.value }))}
              placeholder="https://www.trendyol.com/urun/..."
              className="w-full px-4 py-3 rounded-lg text-sm outline-none"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-muted)" }}>Ürün Adı</label>
            <input
              value={form.productName}
              onChange={e => setForm(f => ({ ...f, productName: e.target.value }))}
              placeholder="Örn: iPhone 15 Pro 256GB"
              className="w-full px-4 py-3 rounded-lg text-sm outline-none"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-muted)" }}>
              Hedef Fiyat (TL) — Bu fiyata düşünce bildir
            </label>
            <input
              type="number"
              value={form.targetPrice}
              onChange={e => setForm(f => ({ ...f, targetPrice: e.target.value }))}
              placeholder="Örn: 45000"
              className="w-full px-4 py-3 rounded-lg text-sm outline-none"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-muted)" }}>Telegram Chat ID *</label>
            <input
              value={form.telegramChatId}
              onChange={e => setForm(f => ({ ...f, telegramChatId: e.target.value }))}
              placeholder="Sonuç Telegram'a gelsin: 123456789"
              className="w-full px-4 py-3 rounded-lg text-sm outline-none"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
          </div>

          {/* Daily check toggle */}
          <div
            className="flex items-center justify-between p-4 rounded-lg cursor-pointer"
            style={{ background: "var(--bg)", border: `1px solid ${form.daily ? "#f59e0b" : "var(--border)"}` }}
            onClick={() => setForm(f => ({ ...f, daily: !f.daily }))}
          >
            <div className="flex items-center gap-3">
              <Bell size={16} style={{ color: "#f59e0b" }} />
              <div>
                <p className="text-sm font-medium">Her Gün Kontrol Et</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Sabah 09:00'da otomatik fiyat kontrolü</p>
              </div>
            </div>
            <div
              className="w-10 h-5 rounded-full transition-all flex items-center px-0.5"
              style={{ background: form.daily ? "#f59e0b" : "var(--border)" }}
            >
              <div
                className="w-4 h-4 rounded-full bg-white transition-all"
                style={{ transform: form.daily ? "translateX(20px)" : "translateX(0)" }}
              />
            </div>
          </div>

          <button
            onClick={() => createTask.mutate()}
            disabled={!form.productUrl || createTask.isPending}
            className="w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all"
            style={{
              background: !form.productUrl ? "var(--border)" : "linear-gradient(135deg, #f59e0b, #d97706)",
              color: !form.productUrl ? "var(--text-muted)" : "white",
              cursor: !form.productUrl ? "not-allowed" : "pointer",
            }}
          >
            {createTask.isPending ? (
              <><Loader2 size={16} className="animate-spin" /> Kontrol ediliyor...</>
            ) : (
              <><Send size={16} /> Fiyat Takibini Başlat</>
            )}
          </button>

          {createTask.isSuccess && (
            <div className="rounded-lg p-3 text-xs text-center animate-fade-up" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>
              ✓ Fiyat takibi başlatıldı! {form.daily ? "Her gün saat 09:00'da kontrol edilecek." : "Sonuç hazır olunca bildirim alacaksın."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
