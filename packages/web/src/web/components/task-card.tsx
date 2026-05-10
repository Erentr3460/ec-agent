import { useState } from "react";
import { ChevronDown, ChevronUp, RotateCcw, Trash2, FileText, Search, TrendingDown, ImageIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const agentConfig = {
  blog: { label: "Blog Yazarı", icon: FileText, color: "#7c3aed", bg: "rgba(124,58,237,0.1)" },
  seo: { label: "SEO Analizi", icon: Search, color: "#06d6a0", bg: "rgba(6,214,160,0.1)" },
  price: { label: "Fiyat Takibi", icon: TrendingDown, color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  image: { label: "Görsel Üretici", icon: ImageIcon, color: "#10b981", bg: "rgba(16,185,129,0.1)" },
};

const statusConfig = {
  pending: { label: "Bekliyor", color: "#6b7280" },
  running: { label: "Çalışıyor", color: "#06d6a0" },
  done: { label: "Tamamlandı", color: "#10b981" },
  error: { label: "Hata", color: "#ef4444" },
};

export function TaskCard({ task }: { task: any }) {
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();
  const cfg = agentConfig[task.agentType as keyof typeof agentConfig] || agentConfig.blog;
  const status = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = cfg.icon;

  const logs: any[] = (() => { try { return JSON.parse(task.logs || "[]"); } catch { return []; } })();
  const result: any = (() => { try { return task.result ? JSON.parse(task.result) : null; } catch { return null; } })();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const retryMutation = useMutation({
    mutationFn: async () => {
      await fetch(`/api/tasks/${task.id}/retry`, { method: "POST" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  return (
    <div
      className="rounded-xl border transition-all animate-fade-up"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Agent icon */}
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
            <Icon size={16} style={{ color: cfg.color }} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
                {cfg.label}
              </span>
              <div className="flex items-center gap-1.5">
                {task.status === "running" && (
                  <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: status.color }} />
                )}
                <span className="text-xs" style={{ color: status.color }}>{status.label}</span>
              </div>
            </div>
            <h3 className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{task.title}</h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {new Date(task.createdAt).toLocaleString("tr-TR")}
              {task.cronExpression && <span className="ml-2 text-xs" style={{ color: cfg.color }}>⟳ Zamanlanmış</span>}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            {(task.status === "error" || task.status === "done") && (
              <button
                onClick={() => retryMutation.mutate()}
                disabled={retryMutation.isPending}
                className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
                style={{ background: "var(--border)", color: "var(--text-muted)" }}
                title="Tekrar çalıştır"
              >
                <RotateCcw size={13} />
              </button>
            )}
            <button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
              style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
              title="Sil"
            >
              <Trash2 size={13} />
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: "var(--border)", color: "var(--text-muted)" }}
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
        </div>

        {/* Logs preview */}
        {logs.length > 0 && (
          <div className="mt-3 rounded-lg p-3 overflow-hidden" style={{ background: "var(--bg)" }}>
            {logs.slice(-3).map((log, i) => (
              <div key={i} className="flex items-start gap-2 text-xs mono animate-slide-in" style={{ color: "var(--text-muted)", marginBottom: "2px" }}>
                <span style={{ color: "var(--text-subtle)" }}>{new Date(log.time).toLocaleTimeString("tr-TR")}</span>
                <span>{log.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expanded result */}
      {expanded && result && (
        <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: "var(--border)" }}>
          {result.type === "image" && result.imageData && (
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Üretilen Görsel</p>
              <img src={result.imageData} alt={result.prompt} className="rounded-lg max-w-full max-h-64 object-contain" />
            </div>
          )}
          {(result.type === "blog" || result.type === "seo") && result.content || result.report ? (
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Sonuç</p>
              <div
                className="text-xs rounded-lg p-3 overflow-auto max-h-64 mono whitespace-pre-wrap"
                style={{ background: "var(--bg)", color: "var(--text)", lineHeight: "1.6" }}
              >
                {result.content || result.report}
              </div>
            </div>
          ) : null}
          {result.type === "price" && (
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Fiyat Analizi</p>
              {result.currentPrice && (
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-lg font-bold" style={{ color: "#f59e0b", fontFamily: "Syne" }}>{result.currentPrice} TL</span>
                  {result.targetPrice && (
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Hedef: {result.targetPrice} TL</span>
                  )}
                </div>
              )}
              <div
                className="text-xs rounded-lg p-3 overflow-auto max-h-48 mono whitespace-pre-wrap"
                style={{ background: "var(--bg)", color: "var(--text)", lineHeight: "1.6" }}
              >
                {result.analysis}
              </div>
            </div>
          )}
          {/* All logs */}
          <div className="mt-3">
            <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Tüm Loglar</p>
            <div className="rounded-lg p-3 max-h-32 overflow-auto" style={{ background: "var(--bg)" }}>
              {logs.map((log, i) => (
                <div key={i} className="flex items-start gap-2 text-xs mono" style={{ color: "var(--text-muted)", marginBottom: "2px" }}>
                  <span style={{ color: "#7c3aed" }}>{new Date(log.time).toLocaleTimeString("tr-TR")}</span>
                  <span>{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
