import { useQuery } from "@tanstack/react-query";
import { Activity, CheckCircle, Clock, AlertCircle, Zap, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { TaskCard } from "../components/task-card";

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

  const agents = [
    { label: "Blog Yazarı", path: "/blog", color: "#7c3aed", desc: "SEO uyumlu blog içeriği" },
    { label: "SEO Analizi", path: "/seo", color: "#06d6a0", desc: "1. sıraya çıkma stratejisi" },
    { label: "Fiyat Takibi", path: "/price", color: "#f59e0b", desc: "Trendyol / Amazon takibi" },
    { label: "Görsel Üretici", path: "/image", color: "#10b981", desc: "AI ile görsel üret" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "Syne, sans-serif" }}>
          Hoş geldin 👋
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Ajanlara görev ver, onlar halletsin.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Çalışıyor", value: running, icon: Activity, color: "#06d6a0" },
          { label: "Tamamlandı", value: done, icon: CheckCircle, color: "#10b981" },
          { label: "Bekliyor", value: pending, icon: Clock, color: "#6b7280" },
          { label: "Hata", value: errors, icon: AlertCircle, color: "#ef4444" },
        ].map((stat, i) => (
          <div
            key={i}
            className="rounded-xl p-4 border animate-fade-up"
            style={{ background: "var(--surface)", borderColor: "var(--border)", animationDelay: `${i * 0.05}s` }}
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon size={16} style={{ color: stat.color }} />
              <span className="text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif", color: stat.color }}>
                {stat.value}
              </span>
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Agents */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
          <Zap size={14} style={{ color: "#7c3aed" }} />
          AJANLAR
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {agents.map((agent, i) => (
            <Link key={agent.path} to={agent.path}>
              <div
                className="rounded-xl p-4 border cursor-pointer transition-all hover:scale-[1.02] animate-fade-up"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                  animationDelay: `${i * 0.05 + 0.2}s`,
                }}
              >
                <div className="w-8 h-8 rounded-lg mb-3" style={{ background: `${agent.color}20` }}>
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full" style={{ background: agent.color }} />
                  </div>
                </div>
                <p className="text-sm font-semibold mb-1" style={{ fontFamily: "Syne, sans-serif" }}>{agent.label}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{agent.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Tasks */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
            <TrendingUp size={14} style={{ color: "#06d6a0" }} />
            SON GÖREVLER
          </h2>
          <button
            onClick={() => refetch()}
            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: "var(--surface)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
          >
            Yenile
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: "var(--surface)" }} />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-xl border p-12 text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>Henüz görev yok.</p>
            <p className="text-xs" style={{ color: "var(--text-subtle)" }}>Yukarıdaki ajanlardan birini seç ve başla.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.slice(0, 10).map((task: any) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
