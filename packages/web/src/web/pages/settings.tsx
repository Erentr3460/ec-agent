import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Settings, Save, Loader2, CheckCircle, Send, ExternalLink } from "lucide-react";

export default function SettingsPage() {
  const [form, setForm] = useState({
    telegramBotToken: "",
    telegramChatId: "",
  });
  const [testMsg, setTestMsg] = useState("");

  const { data } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      return res.json();
    },
  });

  useEffect(() => {
    if (data?.settings) {
      setForm({
        telegramBotToken: data.settings.telegramBotToken || "",
        telegramChatId: data.settings.telegramChatId || "",
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    },
  });

  const testTelegram = async () => {
    try {
      const res = await fetch(`https://api.telegram.org/bot${form.telegramBotToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: form.telegramChatId,
          text: "✅ EÇ AGENT bağlantısı başarılı! Ajandan bildirimler buraya gelecek.",
        }),
      });
      const data = await res.json();
      setTestMsg(data.ok ? "success" : "error");
    } catch {
      setTestMsg("error");
    }
    setTimeout(() => setTestMsg(""), 4000);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8 animate-fade-up">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.15)" }}>
          <Settings size={20} style={{ color: "#7c3aed" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "Syne, sans-serif" }}>Ayarlar</h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Entegrasyon ve bildirim ayarları</p>
        </div>
      </div>

      {/* Telegram Setup */}
      <div className="rounded-xl border p-6 mb-4 animate-fade-up" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(6,214,160,0.1)" }}>
            <Send size={14} style={{ color: "#06d6a0" }} />
          </div>
          <h2 className="text-sm font-bold" style={{ fontFamily: "Syne, sans-serif" }}>Telegram Bildirimleri</h2>
        </div>

        {/* How to guide */}
        <div className="rounded-lg p-4 mb-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Nasıl kurulur?</p>
          <ol className="text-xs space-y-1.5" style={{ color: "var(--text-muted)" }}>
            <li>1. Telegram'da <strong style={{ color: "#06d6a0" }}>@BotFather</strong>'a git</li>
            <li>2. <code className="mono" style={{ color: "#7c3aed" }}>/newbot</code> komutunu gönder, bot adı ver</li>
            <li>3. Sana verilen <strong>Bot Token</strong>'ı aşağıya gir</li>
            <li>4. Botuna bir mesaj gönder, sonra <strong style={{ color: "#f59e0b" }}>@userinfobot</strong>'a yaz ve Chat ID'ni öğren</li>
          </ol>
          <a
            href="https://t.me/BotFather"
            target="_blank"
            className="inline-flex items-center gap-1 text-xs mt-2"
            style={{ color: "#06d6a0" }}
          >
            BotFather'a git <ExternalLink size={10} />
          </a>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-muted)" }}>Bot Token</label>
            <input
              type="password"
              value={form.telegramBotToken}
              onChange={e => setForm(f => ({ ...f, telegramBotToken: e.target.value }))}
              placeholder="1234567890:ABC-DEF..."
              className="w-full px-4 py-3 rounded-lg text-sm outline-none mono"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-muted)" }}>Varsayılan Chat ID</label>
            <input
              value={form.telegramChatId}
              onChange={e => setForm(f => ({ ...f, telegramChatId: e.target.value }))}
              placeholder="123456789"
              className="w-full px-4 py-3 rounded-lg text-sm outline-none mono"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={testTelegram}
              disabled={!form.telegramBotToken || !form.telegramChatId}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
              style={{
                background: "rgba(6,214,160,0.1)",
                border: "1px solid rgba(6,214,160,0.3)",
                color: "#06d6a0",
                cursor: (!form.telegramBotToken || !form.telegramChatId) ? "not-allowed" : "pointer",
                opacity: (!form.telegramBotToken || !form.telegramChatId) ? 0.5 : 1,
              }}
            >
              <Send size={14} /> Test Gönder
            </button>

            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)", color: "white" }}
            >
              {saveMutation.isPending ? (
                <><Loader2 size={14} className="animate-spin" /> Kaydediliyor</>
              ) : saveMutation.isSuccess ? (
                <><CheckCircle size={14} /> Kaydedildi!</>
              ) : (
                <><Save size={14} /> Kaydet</>
              )}
            </button>
          </div>

          {testMsg === "success" && (
            <div className="rounded-lg p-3 text-xs text-center animate-fade-up" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>
              ✓ Test mesajı gönderildi! Telegram'ını kontrol et.
            </div>
          )}
          {testMsg === "error" && (
            <div className="rounded-lg p-3 text-xs text-center animate-fade-up" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
              ✗ Gönderme başarısız. Token ve Chat ID'yi kontrol et.
            </div>
          )}
        </div>
      </div>

      {/* AI Info */}
      <div className="rounded-xl border p-4 animate-fade-up" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-green-400 pulse-dot" />
          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>AI Modeller</p>
        </div>
        <div className="space-y-2">
          {[
            { agent: "Blog Yazarı", model: "GPT-4o", color: "#7c3aed" },
            { agent: "SEO Analizi", model: "GPT-4o", color: "#06d6a0" },
            { agent: "Fiyat Takibi", model: "GPT-4o", color: "#f59e0b" },
            { agent: "Görsel Üretici", model: "Gemini Pro Image", color: "#10b981" },
          ].map(item => (
            <div key={item.agent} className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{item.agent}</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${item.color}15`, color: item.color }}>
                {item.model}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
