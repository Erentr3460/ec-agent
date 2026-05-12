import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Settings, Save, Loader2, CheckCircle, Send, ExternalLink } from "lucide-react";

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
  fontFamily: "JetBrains Mono, monospace",
};

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
          text: "✅ EÇ AGENT bağlantısı başarılı!",
        }),
      });
      const d = await res.json();
      setTestMsg(d.ok ? "success" : "error");
    } catch {
      setTestMsg("error");
    }
    setTimeout(() => setTestMsg(""), 4000);
  };

  return (
    <div style={{ padding: "32px 28px", maxWidth: 600, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            border: "1px solid #1c1c1c",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Settings size={15} color="#888" />
          </div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: "#ececec", margin: 0 }}>Ayarlar</h1>
        </div>
        <p style={{ fontSize: 12, color: "#444", margin: 0 }}>Entegrasyon ve bildirim ayarları</p>
      </div>

      {/* Telegram */}
      <div style={{
        background: "#0f0f0f",
        border: "1px solid #1c1c1c",
        borderRadius: 12,
        padding: "22px",
        marginBottom: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Send size={13} color="#555" />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#ececec" }}>Telegram Bildirimleri</span>
        </div>

        {/* Guide */}
        <div style={{
          padding: "12px 14px",
          borderRadius: 8,
          background: "#080808",
          border: "1px solid #1c1c1c",
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 11, color: "#444", marginBottom: 8, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
            Kurulum
          </div>
          <ol style={{ margin: 0, padding: "0 0 0 16px", fontSize: 12, color: "#555", lineHeight: 1.8 }}>
            <li>Telegram'da <strong style={{ color: "#888" }}>@BotFather</strong>'a git</li>
            <li><code style={{ color: "#7c3aed", fontFamily: "JetBrains Mono, monospace" }}>/newbot</code> komutunu gönder</li>
            <li>Aldığın <strong style={{ color: "#888" }}>Bot Token</strong>'ı aşağıya gir</li>
            <li>Chat ID için <strong style={{ color: "#888" }}>@userinfobot</strong>'a yaz</li>
          </ol>
          <a
            href="https://t.me/BotFather"
            target="_blank"
            style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "#7c3aed", marginTop: 8, textDecoration: "none" }}
          >
            BotFather <ExternalLink size={9} />
          </a>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: "#555", display: "block", marginBottom: 6, fontWeight: 500 }}>
              Bot Token
            </label>
            <input
              type="password"
              value={form.telegramBotToken}
              onChange={e => setForm(f => ({ ...f, telegramBotToken: e.target.value }))}
              placeholder="1234567890:ABC-DEF..."
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, color: "#555", display: "block", marginBottom: 6, fontWeight: 500 }}>
              Varsayılan Chat ID
            </label>
            <input
              value={form.telegramChatId}
              onChange={e => setForm(f => ({ ...f, telegramChatId: e.target.value }))}
              placeholder="123456789"
              style={inputStyle}
            />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={testTelegram}
              disabled={!form.telegramBotToken || !form.telegramChatId}
              style={{
                flex: 1,
                padding: "9px",
                borderRadius: 8,
                border: "1px solid #1c1c1c",
                background: "none",
                color: !form.telegramBotToken || !form.telegramChatId ? "#333" : "#888",
                fontSize: 12,
                fontWeight: 500,
                cursor: !form.telegramBotToken || !form.telegramChatId ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Send size={12} /> Test Gönder
            </button>

            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              style={{
                flex: 1,
                padding: "9px",
                borderRadius: 8,
                border: "none",
                background: "#7c3aed",
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              {saveMutation.isPending ? (
                <><Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> Kaydediliyor</>
              ) : saveMutation.isSuccess ? (
                <><CheckCircle size={12} /> Kaydedildi!</>
              ) : (
                <><Save size={12} /> Kaydet</>
              )}
            </button>
          </div>

          {testMsg === "success" && (
            <div style={{
              padding: "9px 12px", borderRadius: 7,
              background: "rgba(34,197,94,0.05)",
              border: "1px solid rgba(34,197,94,0.15)",
              fontSize: 12, color: "#22c55e", textAlign: "center" as const,
            }}>
              Mesaj gönderildi — Telegram'ını kontrol et.
            </div>
          )}
          {testMsg === "error" && (
            <div style={{
              padding: "9px 12px", borderRadius: 7,
              background: "rgba(239,68,68,0.05)",
              border: "1px solid rgba(239,68,68,0.15)",
              fontSize: 12, color: "#ef4444", textAlign: "center" as const,
            }}>
              Hata — Token ve Chat ID'yi kontrol et.
            </div>
          )}
        </div>
      </div>

      {/* AI Models */}
      <div style={{
        background: "#0f0f0f",
        border: "1px solid #1c1c1c",
        borderRadius: 12,
        padding: "18px 22px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
          <span style={{ fontSize: 11, color: "#444", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
            AI Modeller
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { agent: "Blog Yazarı", model: "GPT-4o" },
            { agent: "SEO Analizi", model: "GPT-4o" },
            { agent: "Fiyat Takibi", model: "GPT-4o" },
            { agent: "Görsel Üretici", model: "Gemini Pro Image" },
          ].map(item => (
            <div key={item.agent} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "#555" }}>{item.agent}</span>
              <span style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 4,
                border: "1px solid #1c1c1c",
                color: "#444",
                fontFamily: "JetBrains Mono, monospace",
              }}>
                {item.model}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
