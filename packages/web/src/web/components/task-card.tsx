import { useState } from "react";
import { ChevronDown, ChevronUp, RotateCcw, Trash2, FileText, Search, TrendingDown, ImageIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const agentConfig = {
  blog: { label: "Blog", icon: FileText, color: "#7c3aed" },
  seo: { label: "SEO", icon: Search, color: "#888" },
  price: { label: "Fiyat", icon: TrendingDown, color: "#888" },
  image: { label: "Görsel", icon: ImageIcon, color: "#888" },
};

const statusConfig = {
  pending: { label: "Bekliyor", color: "#444" },
  running: { label: "Çalışıyor", color: "#22c55e" },
  done: { label: "Tamamlandı", color: "#555" },
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
    <div style={{
      background: "#0f0f0f",
      border: "1px solid #1c1c1c",
      borderRadius: 10,
      overflow: "hidden",
    }}>
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Icon */}
          <div style={{
            width: 30,
            height: 30,
            borderRadius: 7,
            border: "1px solid #1c1c1c",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <Icon size={14} color="#444" />
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 11, color: "#555" }}>{cfg.label}</span>
              <span style={{ fontSize: 11, color: "#2a2a2a" }}>·</span>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                {task.status === "running" && (
                  <span style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: "#22c55e", display: "inline-block",
                    animation: "pulse 1.5s infinite",
                  }} />
                )}
                <span style={{ fontSize: 11, color: status.color }}>{status.label}</span>
              </div>
              {task.cronExpression && (
                <span style={{ fontSize: 10, color: "#7c3aed" }}>⟳ Zamanlanmış</span>
              )}
            </div>
            <div style={{
              fontSize: 13,
              fontWeight: 500,
              color: "#ececec",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}>{task.title}</div>
            <div style={{ fontSize: 11, color: "#333", marginTop: 1 }}>
              {new Date(task.createdAt).toLocaleString("tr-TR")}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            {(task.status === "error" || task.status === "done") && (
              <button
                onClick={() => retryMutation.mutate()}
                disabled={retryMutation.isPending}
                style={{
                  width: 28, height: 28, borderRadius: 6,
                  border: "1px solid #1c1c1c",
                  background: "none",
                  cursor: "pointer",
                  color: "#444",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
                title="Tekrar çalıştır"
              >
                <RotateCcw size={12} />
              </button>
            )}
            <button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              style={{
                width: 28, height: 28, borderRadius: 6,
                border: "1px solid rgba(239,68,68,0.2)",
                background: "none",
                cursor: "pointer",
                color: "#ef4444",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
              title="Sil"
            >
              <Trash2 size={12} />
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                width: 28, height: 28, borderRadius: 6,
                border: "1px solid #1c1c1c",
                background: "none",
                cursor: "pointer",
                color: "#444",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
        </div>

        {/* Live logs preview */}
        {logs.length > 0 && task.status === "running" && (
          <div style={{
            marginTop: 10,
            padding: "8px 10px",
            borderRadius: 6,
            background: "#080808",
            border: "1px solid #1c1c1c",
          }}>
            {logs.slice(-2).map((log, i) => (
              <div key={i} style={{
                display: "flex", gap: 8, fontSize: 11,
                fontFamily: "JetBrains Mono, monospace",
                color: "#444",
              }}>
                <span style={{ color: "#2a2a2a", flexShrink: 0 }}>
                  {new Date(log.time).toLocaleTimeString("tr-TR")}
                </span>
                <span>{log.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expanded */}
      {expanded && (
        <div style={{ borderTop: "1px solid #1c1c1c", padding: "14px 16px" }}>
          {result?.type === "image" && result.imageData && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#444", marginBottom: 8 }}>Üretilen Görsel</div>
              <img
                src={result.imageData}
                alt={result.prompt}
                style={{ borderRadius: 8, maxWidth: "100%", maxHeight: 280, objectFit: "contain", border: "1px solid #1c1c1c" }}
              />
            </div>
          )}
          {(result?.content || result?.report) && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#444", marginBottom: 8 }}>Sonuç</div>
              <div style={{
                fontSize: 12,
                fontFamily: "JetBrains Mono, monospace",
                padding: "10px 12px",
                borderRadius: 6,
                background: "#080808",
                border: "1px solid #1c1c1c",
                color: "#888",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                maxHeight: 240,
                overflow: "auto",
              }}>
                {result.content || result.report}
              </div>
            </div>
          )}
          {result?.type === "price" && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#444", marginBottom: 8 }}>Fiyat Analizi</div>
              {result.currentPrice && (
                <div style={{ marginBottom: 8, display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#ececec", fontVariantNumeric: "tabular-nums" }}>
                    {result.currentPrice} TL
                  </span>
                  {result.targetPrice && (
                    <span style={{ fontSize: 11, color: "#444" }}>Hedef: {result.targetPrice} TL</span>
                  )}
                </div>
              )}
              <div style={{
                fontSize: 12,
                fontFamily: "JetBrains Mono, monospace",
                padding: "10px 12px",
                borderRadius: 6,
                background: "#080808",
                border: "1px solid #1c1c1c",
                color: "#888",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                maxHeight: 200,
                overflow: "auto",
              }}>
                {result.analysis}
              </div>
            </div>
          )}

          {/* All logs */}
          <div>
            <div style={{ fontSize: 11, color: "#333", marginBottom: 6 }}>Loglar</div>
            <div style={{
              padding: "8px 10px",
              borderRadius: 6,
              background: "#080808",
              border: "1px solid #1c1c1c",
              maxHeight: 120,
              overflow: "auto",
            }}>
              {logs.length === 0 ? (
                <div style={{ fontSize: 11, color: "#333", fontFamily: "JetBrains Mono, monospace" }}>Log yok.</div>
              ) : logs.map((log, i) => (
                <div key={i} style={{
                  display: "flex", gap: 8, fontSize: 11,
                  fontFamily: "JetBrains Mono, monospace",
                  color: "#444",
                  marginBottom: 2,
                }}>
                  <span style={{ color: "#7c3aed", flexShrink: 0 }}>
                    {new Date(log.time).toLocaleTimeString("tr-TR")}
                  </span>
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
