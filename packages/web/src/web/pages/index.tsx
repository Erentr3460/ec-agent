import { useQuery } from "@tanstack/react-query";
import { Activity, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { TaskCard } from "../components/task-card";

const agents = [
  { label: "Chat", path: "/chat", desc: "GPT-4o ile sohbet" },
  { label: "Blog Yazarı", path: "/blog", desc: "SEO uyumlu içerik" },
  { label: "SEO Analizi", path: "/seo", desc: "Google sıralama planı" },
  { label: "Fiyat Takibi", path: "/price", desc: "Trendyol / Amazon" },
  { label: "Görsel Üretici", path: "/image", desc: "AI görsel üretimi" },
];

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

  const stats = [
    { label: "Çalışıyor", value: running, icon: Activity, dot: "#22c55e" },
    { label: "Tamamlandı", value: done, icon: CheckCircle, dot: "#ececec" },
    { label: "Bekliyor", value: pending, icon: Clock, dot: "#555" },
    { label: "Hata", value: errors, icon: AlertCircle, dot: "#ef4444" },
  ];

  return (
    <div style={{ padding: "32px 28px", maxWidth: 880, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#ececec", margin: 0 }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: "#555", marginTop: 4 }}>Ajanlara görev ver, onlar halletsin.</p>
      </div>

      {/* Stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 12,
        marginBottom: 32,
      }} className="stats-grid">
        {stats.map((s, i) => (
          <div key={i} style={{
            background: "#0f0f0f",
            border: "1px solid #1c1c1c",
            borderRadius: 10,
            padding: "16px 18px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <s.icon size={14} color="#444" />
              <span style={{
                fontSize: 22,
                fontWeight: 700,
                color: s.value > 0 ? s.dot : "#333",
                fontVariantNumeric: "tabular-nums",
              }}>{s.value}</span>
            </div>
            <div style={{ fontSize: 11, color: "#444" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Agents */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#333", letterSpacing: "0.08em", marginBottom: 12, textTransform: "uppercase" }}>
          Ajanlar
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 10,
        }} className="agents-grid">
          {agents.map((a) => (
            <Link key={a.path} to={a.path}>
              <div
                style={{
                  background: "#0f0f0f",
                  border: "1px solid #1c1c1c",
                  borderRadius: 10,
                  padding: "16px 14px",
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "#2a2a2a"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "#1c1c1c"}
              >
                <div style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#7c3aed",
                  marginBottom: 12,
                }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: "#ececec", marginBottom: 4 }}>{a.label}</div>
                <div style={{ fontSize: 11, color: "#444", lineHeight: 1.4 }}>{a.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Tasks */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#333", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Son Görevler
          </div>
          <button
            onClick={() => refetch()}
            style={{
              fontSize: 12,
              padding: "5px 12px",
              borderRadius: 6,
              border: "1px solid #1c1c1c",
              background: "none",
              color: "#555",
              cursor: "pointer",
            }}
          >
            Yenile
          </button>
        </div>

        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ height: 72, borderRadius: 10, background: "#0f0f0f", border: "1px solid #1c1c1c", animation: "pulse 1.5s infinite" }} />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div style={{
            background: "#0f0f0f",
            border: "1px solid #1c1c1c",
            borderRadius: 10,
            padding: "48px 24px",
            textAlign: "center",
          }}>
            <p style={{ fontSize: 13, color: "#444", margin: 0 }}>Henüz görev yok.</p>
            <p style={{ fontSize: 12, color: "#333", marginTop: 4 }}>Yukarıdan bir ajan seç ve başla.</p>
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
        @media (max-width: 900px) { .agents-grid { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (max-width: 600px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .agents-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
