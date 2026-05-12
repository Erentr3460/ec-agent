import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Settings, Save, Loader2, CheckCircle, Send, ExternalLink, Terminal, Cpu, Zap } from "lucide-react";
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

  const focusStyle = {
    borderColor: "#00ebb066",
    boxShadow: "0 0 0 3px #00ebb011",
  };

  return (
    <div style={{ padding: "32px 28px", maxWidth: 620, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 28, animation: "fadeInUp 0.5s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Terminal size={12} color="#00ebb044" />
          <span style={{ fontSize: 10, color: "#2a5a45", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.12em" }}>
            SYSTEM / CONFIG
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: "linear-gradient(135deg, #030f08, #000)",
            border: "1px solid #0d2b1f",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 12px #00ebb011",
          }}>
            <Settings size={16} color="#00ebb0" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#e8fdf5", margin: 0, letterSpacing: "-0.02em" }}>
              Ayarlar
            </h1>
          </div>
        </div>
        <p style={{ fontSize: 12, color: "#2a5a45", margin: 0, fontFamily: "JetBrains Mono, monospace" }}>
          // entegrasyon ve bildirim yapılandırması
        </p>
      </div>

      {/* Telegram Card */}
      <TiltCard>
        <div style={{
          background: "#030f08",
          border: "1px solid #0d2b1f",
          borderRadius: 12,
          padding: "22px",
          marginBottom: 16,
        }}>
          {/* Section header */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <Send size={14} color="#00ebb0" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#e8fdf5", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.04em" }}>
              // TELEGRAM_NOTIFICATIONS
            </span>
          </div>

          {/* Guide */}
          <div style={{
            padding: "14px 16px",
            borderRadius: 8,
            background: "#000",
            border: "1px solid #0d2b1f",
            marginBottom: 18,
          }}>
            <div style={{
              fontSize: 10, color: "#2a5a45", marginBottom: 10,
              fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.1em",
            }}>
              // KURULUM ADIMLARI
            </div>
            <ol style={{ margin: 0, padding: "0 0 0 16px", fontSize: 12, color: "#2a5a45", lineHeight: 2 }}>
              <li>Telegram'da <strong style={{ color: "#00ebb0" }}>@BotFather</strong>'a git</li>
              <li><code style={{ color: "#00ebb0", fontFamily: "JetBrains Mono, monospace", background: "#00ebb011", padding: "1px 5px", borderRadius: 3 }}>/newbot</code> komutunu gönder</li>
              <li>Aldığın <strong style={{ color: "#e8fdf5" }}>Bot Token</strong>'ı aşağıya gir</li>
              <li>Chat ID için <strong style={{ color: "#e8fdf5" }}>@userinfobot</strong>'a yaz</li>
            </ol>
            <a
              href="https://t.me/BotFather"
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: 11, color: "#00ebb0", marginTop: 10,
                textDecoration: "none", fontFamily: "JetBrains Mono, monospace",
                transition: "text-shadow .2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.textShadow = "0 0 8px #00ebb0")}
              onMouseLeave={e => (e.currentTarget.style.textShadow = "none")}
            >
              BotFather <ExternalLink size={9} />
            </a>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Bot Token */}
            <div>
              <label style={{
                fontSize: 10, color: "#2a5a45", display: "block", marginBottom: 6,
                fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.08em",
              }}>
                // BOT_TOKEN
              </label>
              <input
                type="password"
                value={form.telegramBotToken}
                onChange={e => setForm(f => ({ ...f, telegramBotToken: e.target.value }))}
                placeholder="1234567890:ABC-DEF..."
                style={inputStyle}
                onFocus={e => Object.assign(e.target.style, focusStyle)}
                onBlur={e => {
                  e.target.style.borderColor = "#0d2b1f";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Chat ID */}
            <div>
              <label style={{
                fontSize: 10, color: "#2a5a45", display: "block", marginBottom: 6,
                fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.08em",
              }}>
                // DEFAULT_CHAT_ID
              </label>
              <input
                value={form.telegramChatId}
                onChange={e => setForm(f => ({ ...f, telegramChatId: e.target.value }))}
                placeholder="123456789"
                style={inputStyle}
                onFocus={e => Object.assign(e.target.style, focusStyle)}
                onBlur={e => {
                  e.target.style.borderColor = "#0d2b1f";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                onClick={testTelegram}
                disabled={!form.telegramBotToken || !form.telegramChatId}
                style={{
                  flex: 1, padding: "9px",
                  borderRadius: 8,
                  border: "1px solid #0d2b1f",
                  background: "none",
                  color: !form.telegramBotToken || !form.telegramChatId ? "#1a3a2a" : "#00ebb0",
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: "JetBrains Mono, monospace",
                  cursor: !form.telegramBotToken || !form.telegramChatId ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  transition: "all .2s",
                  letterSpacing: "0.05em",
                }}
                onMouseEnter={e => {
                  if (!(!form.telegramBotToken || !form.telegramChatId)) {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 12px #00ebb033";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#00ebb066";
                  }
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#0d2b1f";
                }}
              >
                <Send size={11} /> TEST_SEND
              </button>

              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                style={{
                  flex: 1, padding: "9px",
                  borderRadius: 8,
                  border: "none",
                  background: "linear-gradient(90deg, #00ebb0, #00b884)",
                  color: "#000",
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: "JetBrains Mono, monospace",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  transition: "box-shadow .2s, transform .1s",
                  letterSpacing: "0.05em",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px #00ebb066";
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                }}
              >
                {saveMutation.isPending ? (
                  <><Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> SAVING...</>
                ) : saveMutation.isSuccess ? (
                  <><CheckCircle size={11} /> SAVED!</>
                ) : (
                  <><Save size={11} /> KAYDET</>
                )}
              </button>
            </div>

            {/* Feedback */}
            {testMsg === "success" && (
              <div style={{
                padding: "10px 14px", borderRadius: 7,
                background: "#00ebb008",
                border: "1px solid #00ebb033",
                fontSize: 11, color: "#00ebb0", textAlign: "center" as const,
                fontFamily: "JetBrains Mono, monospace",
              }}>
                ✓ MESAJ GÖNDERİLDİ — Telegram'ını kontrol et.
              </div>
            )}
            {testMsg === "error" && (
              <div style={{
                padding: "10px 14px", borderRadius: 7,
                background: "rgba(239,68,68,0.04)",
                border: "1px solid rgba(239,68,68,0.2)",
                fontSize: 11, color: "#ef4444", textAlign: "center" as const,
                fontFamily: "JetBrains Mono, monospace",
              }}>
                ✗ HATA — Token ve Chat ID'yi kontrol et.
              </div>
            )}
          </div>
        </div>
      </TiltCard>

      {/* AI Models Card */}
      <TiltCard>
        <div style={{
          background: "#030f08",
          border: "1px solid #0d2b1f",
          borderRadius: 12,
          padding: "20px 22px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Cpu size={14} color="#00ebb0" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#e8fdf5", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.04em" }}>
              // AI_MODELS
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { agent: "Blog Yazarı", model: "GPT-4o", status: "online" },
              { agent: "SEO Analizi", model: "GPT-4o", status: "online" },
              { agent: "Fiyat Takibi", model: "GPT-4o", status: "online" },
              { agent: "Görsel Üretici", model: "Gemini Pro Image", status: "online" },
            ].map(item => (
              <div key={item.agent} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px",
                borderRadius: 8,
                background: "#000",
                border: "1px solid #0d2b1f",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: "#00ebb0",
                    boxShadow: "0 0 6px #00ebb0",
                  }} />
                  <span style={{ fontSize: 12, color: "#e8fdf5" }}>{item.agent}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Zap size={10} color="#00ebb044" />
                  <span style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 4,
                    border: "1px solid #0d2b1f",
                    color: "#00ebb0",
                    fontFamily: "JetBrains Mono, monospace",
                    background: "#00ebb008",
                    letterSpacing: "0.05em",
                  }}>
                    {item.model}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 14, padding: "10px 14px",
            borderRadius: 8, background: "#000",
            border: "1px solid #0d2b1f",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00ebb0", boxShadow: "0 0 6px #00ebb0", animation: "pulse-green 2s infinite" }} />
            <span style={{ fontSize: 11, color: "#2a5a45", fontFamily: "JetBrains Mono, monospace" }}>
              // ALL SYSTEMS NOMINAL — 4 AGENTS READY
            </span>
          </div>
        </div>
      </TiltCard>
    </div>
  );
}
