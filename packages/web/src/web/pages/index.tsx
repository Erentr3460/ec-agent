import { useQuery } from "@tanstack/react-query";
import { Activity, CheckCircle, Clock, AlertCircle, Terminal, Cpu } from "lucide-react";
import { Link } from "wouter";
import { TaskCard } from "../components/task-card";
import { TiltCard } from "../components/tilt-card";
import { useTypewriter } from "../hooks/use-typewriter";
import { useCounter } from "../hooks/use-counter";

const agents = [
  { label: "Chat", path: "/chat", desc: "GPT-4o ile sohbet", code: "0x01", icon: "💬" },
  { label: "Blog Yazarı", path: "/blog", desc: "SEO uyumlu içerik", code: "0x02", icon: "✍" },
  { label: "SEO Analizi", path: "/seo", desc: "Google #1 planı", code: "0x03", icon: "🔍" },
  { label: "Fiyat Takibi", path: "/price", desc: "Trendyol / Amazon", code: "0x04", icon: "📉" },
  { label: "Görsel Üretici", path: "/image", desc: "Gemini Pro Image", code: "0x05", icon: "🖼" },
];

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  const displayed = useCounter(value, 600);
  return (
    <TiltCard style={{
      background: "linear-gradient(135deg, #030f08, #000)",
      border: "1px solid #0d2b1f",
      borderRadius: 10,
      padding: "18px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <Icon size={14} color={color} style={{ opacity: 0.7 }} />
        <span style={{
          fontSize: 28, fontWeight: 700, color,
          fontFamily: "JetBrains Mono, monospace",
          fontVariantNumeric: "tabular-nums",
          textShadow: `0 0 20px ${color}66`,
          animation: "countUp 0.4s ease",
        }}>{displayed}</span>
      </div>
      <div style={{ fontSize: 10, color: "#2a5a45", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "JetBrains Mono, monospace" }}>
        {label}
      </div>
    </TiltCard>
  );
}

export default function DashboardPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await fetch("/api/tasks");
      return res.json();
    },
    refetchInterval: 3000,
  });

  const tasks = data?.tasks || [];
  const running = tasks.filter((t: any) => t.status === "running").length;
  const done = tasks.filter((t: any) => t.status === "done").length;
  const pending = tasks.filter((t: any) => t.status === "pending").length;
  const errors = tasks.filter((t: any) => t.status === "error").length;

  const { displayed: headerText } = useTypewriter("Ajanlara görev ver, onlar halletsin.", 35, 300);

  const stats = [
    { label: "Çalışıyor", value: running, icon: Activity, color: "#00ebb0" },
    { label: "Tamamlandı", value: done, icon: CheckCircle, color: "#e8fdf5" },
    { label: "Bekliyor", value: pending, icon: Clock, color: "#2a5a45" },
    { label: "Hata", value: errors, icon: AlertCircle, color: "#ff3366" },
  ];

  return (
    <div style={{ padding: "32px 28px", maxWidth: 900, margin: "0 auto", position: "relative" }}>

      {/* Header */}
      <div style={{ marginBottom: 36, animation: "fadeInUp 0.5s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Terminal size={14} color="#00ebb0" />
          <span style={{
            fontSize: 10, color: "#00ebb0",
            fontFamily: "JetBrains Mono, monospace",
            letterSpacing: "0.12em",
          }}>
            SYSTEM / DASHBOARD
          </span>
        </div>
        <h1 style={{
          fontSize: 26, fontWeight: 800, color: "#e8fdf5", margin: 0,
          letterSpacing: "-0.01em",
          textShadow: "0 0 30px #00ebb022",
        }}>Dashboard</h1>
        <p style={{
          fontSize: 13, color: "#2a5a45", marginTop: 6,
          fontFamily: "JetBrains Mono, monospace",
          minHeight: 20,
        }}>
          {headerText}
          <span style={{ animation: "pulse-green 0.8s infinite", color: "#00ebb0" }}>▋</span>
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 10, marginBottom: 32,
      }} className="stats-grid">
        {stats.map((s, i) => (
          <div key={i} className={`animate-fadeInUp delay-${i + 1}`}>
            <StatCard {...s} />
          </div>
        ))}
      </div>

      {/* Agents */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
        }}>
          <Cpu size={12} color="#00ebb044" />
          <span style={{
            fontSize: 10, fontWeight: 600, color: "#1e3d2e",
            letterSpacing: "0.12em", textTransform: "uppercase",
            fontFamily: "JetBrains Mono, monospace",
          }}>
            AGENT MODULES
          </span>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, #0d2b1f, transparent)" }} />
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 8,
        }} className="agents-grid">
          {agents.map((a, i) => (
            <Link key={a.path} to={a.path}>
              <TiltCard
                className={`animate-fadeInUp delay-${i + 1}`}
                style={{
                  background: "linear-gradient(135deg, #030f08, #000)",
                  border: "1px solid #0d2b1f",
                  borderRadius: 10,
                  padding: "16px 14px",
                }}
              >
                <div style={{
                  fontSize: 18, marginBottom: 10,
                  filter: "drop-shadow(0 0 6px #00ebb066)",
                }}>{a.icon}</div>
                <div style={{
                  fontSize: 9, color: "#00ebb066",
                  fontFamily: "JetBrains Mono, monospace",
                  letterSpacing: "0.08em",
                  marginBottom: 4,
                }}>{a.code}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#e8fdf5", marginBottom: 3 }}>
                  {a.label}
                </div>
                <div style={{ fontSize: 10, color: "#1e3d2e", lineHeight: 1.4 }}>{a.desc}</div>
                <div style={{
                  marginTop: 10, height: 1,
                  background: "linear-gradient(90deg, #00ebb022, transparent)",
                }} />
              </TiltCard>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="animate-fadeInUp delay-5">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Activity size={12} color="#00ebb044" />
            <span style={{
              fontSize: 10, fontWeight: 600, color: "#1e3d2e",
              letterSpacing: "0.12em", textTransform: "uppercase",
              fontFamily: "JetBrains Mono, monospace",
            }}>SON GÖREVLER</span>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg,#0d2b1f,transparent)", width: 60 }} />
          </div>
          <button
            onClick={() => refetch()}
            style={{
              fontSize: 10, padding: "5px 12px", borderRadius: 6,
              border: "1px solid #0d2b1f",
              background: "none",
              color: "#2a5a45",
              cursor: "pointer",
              fontFamily: "JetBrains Mono, monospace",
              letterSpacing: "0.06em",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = "#00ebb033";
              (e.currentTarget as HTMLElement).style.color = "#00ebb0";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 12px #00ebb011";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = "#0d2b1f";
              (e.currentTarget as HTMLElement).style.color = "#2a5a45";
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            REFRESH
          </button>
        </div>

        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{
                height: 72, borderRadius: 10,
                background: "linear-gradient(90deg, #030f08, #050f0a, #030f08)",
                border: "1px solid #0d2b1f",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s infinite",
              }} />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div style={{
            background: "linear-gradient(135deg,#030f08,#000)",
            border: "1px solid #0d2b1f",
            borderRadius: 10,
            padding: "48px 24px",
            textAlign: "center",
          }}>
            <Terminal size={24} color="#0d2b1f" style={{ margin: "0 auto 12px" }} />
            <p style={{ fontSize: 12, color: "#1e3d2e", margin: 0, fontFamily: "JetBrains Mono, monospace" }}>
              &gt; NO TASKS FOUND
            </p>
            <p style={{ fontSize: 11, color: "#0d2b1f", marginTop: 4, fontFamily: "JetBrains Mono, monospace" }}>
              Select an agent module above to begin.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tasks.slice(0, 10).map((task: any) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) { .agents-grid { grid-template-columns: repeat(3,1fr) !important; } }
        @media (max-width: 600px) {
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .agents-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
