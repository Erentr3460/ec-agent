import { useState } from "react";
import { ChevronDown, ChevronUp, RotateCcw, Trash2, FileText, Search, TrendingDown, ImageIcon, Terminal } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const agentConfig = {
  blog: { label: "BLOG", icon: FileText },
  seo: { label: "SEO", icon: Search },
  price: { label: "PRICE", icon: TrendingDown },
  image: { label: "IMAGE", icon: ImageIcon },
};

const statusConfig = {
  pending: { label: "PENDING", color: "#2a5a45", bg: "transparent" },
  running: { label: "RUNNING", color: "#00ebb0", bg: "#00ebb011" },
  done: { label: "DONE", color: "#4a7a65", bg: "transparent" },
  error: { label: "ERROR", color: "#ff3366", bg: "#ff336611" },
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
    mutationFn: async () => { await fetch(`/api/tasks/${task.id}`, { method: "DELETE" }); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const retryMutation = useMutation({
    mutationFn: async () => { await fetch(`/api/tasks/${task.id}/retry`, { method: "POST" }); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const iconBtn = (content: React.ReactNode, onClick: () => void, danger = false) => (
    <button onClick={onClick} style={{
      width: 28, height: 28, borderRadius: 6,
      border: `1px solid ${danger ? "#ff336633" : "#0d2b1f"}`,
      background: "none", cursor: "pointer",
      color: danger ? "#ff3366" : "#2a5a45",
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "all 0.2s",
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = danger ? "#ff336666" : "#00ebb033";
        (e.currentTarget as HTMLElement).style.color = danger ? "#ff3366" : "#00ebb0";
        (e.currentTarget as HTMLElement).style.boxShadow = danger ? "0 0 8px #ff336622" : "0 0 8px #00ebb011";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = danger ? "#ff336633" : "#0d2b1f";
        (e.currentTarget as HTMLElement).style.color = danger ? "#ff3366" : "#2a5a45";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >{content}</button>
  );

  return (
    <div style={{
      background: "linear-gradient(135deg, #030f08, #000)",
      border: "1px solid #0d2b1f",
      borderRadius: 10,
      overflow: "hidden",
      transition: "border-color 0.2s, box-shadow 0.2s",
      animation: "fadeInUp 0.3s ease",
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "#00ebb022";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px #00ebb008";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "#0d2b1f";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Icon box */}
          <div style={{
            width: 30, height: 30, borderRadius: 7,
            border: "1px solid #0d2b1f",
            background: "#030f08",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Icon size={13} color="#00ebb066" />
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <span style={{
                fontSize: 9, padding: "1px 6px", borderRadius: 3,
                border: "1px solid #0d2b1f",
                color: "#2a5a45",
                fontFamily: "JetBrains Mono, monospace",
              }}>{cfg.label}</span>
              <span style={{
                fontSize: 9, padding: "1px 6px", borderRadius: 3,
                background: status.bg,
                border: `1px solid ${status.color}33`,
                color: status.color,
                fontFamily: "JetBrains Mono, monospace",
                display: "flex", alignItems: "center", gap: 4,
              }}>
                {task.status === "running" && (
                  <span style={{
                    width: 4, height: 4, borderRadius: "50%",
                    background: "#00ebb0", display: "inline-block",
                    animation: "pulse-green 1.5s infinite",
                  }} />
                )}
                {status.label}
              </span>
              {task.cronExpression && (
                <span style={{
                  fontSize: 9, color: "#00ebb066",
                  fontFamily: "JetBrains Mono, monospace",
                }}>⟳ SCHED</span>
              )}
            </div>
            <div style={{
              fontSize: 12, fontWeight: 500, color: "#e8fdf5",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{task.title}</div>
            <div style={{
              fontSize: 10, color: "#1e3d2e", marginTop: 1,
              fontFamily: "JetBrains Mono, monospace",
            }}>
              {new Date(task.createdAt).toLocaleString("tr-TR")}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            {(task.status === "error" || task.status === "done") && (
              iconBtn(<RotateCcw size={11} />, () => retryMutation.mutate())
            )}
            {iconBtn(<Trash2 size={11} />, () => deleteMutation.mutate(), true)}
            {iconBtn(
              expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />,
              () => setExpanded(!expanded)
            )}
          </div>
        </div>

        {/* Live logs preview */}
        {logs.length > 0 && task.status === "running" && (
          <div style={{
            marginTop: 8, padding: "6px 10px",
            borderRadius: 6, background: "#000",
            border: "1px solid #0d2b1f",
          }}>
            {logs.slice(-2).map((log, i) => (
              <div key={i} style={{
                display: "flex", gap: 8, fontSize: 10,
                fontFamily: "JetBrains Mono, monospace",
                color: "#2a5a45",
              }}>
                <span style={{ color: "#00ebb044", flexShrink: 0 }}>
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
        <div style={{ borderTop: "1px solid #0d2b1f", padding: "12px 14px" }}>
          {result?.type === "image" && result.imageData && (
            <div style={{ marginBottom: 12 }}>
              <div style={{
                fontSize: 9, color: "#2a5a45", marginBottom: 8,
                fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.08em",
              }}>// OUTPUT IMAGE</div>
              <img
                src={result.imageData}
                alt={result.prompt}
                style={{
                  borderRadius: 8, maxWidth: "100%", maxHeight: 280,
                  objectFit: "contain",
                  border: "1px solid #0d2b1f",
                  boxShadow: "0 0 20px #00ebb011",
                }}
              />
            </div>
          )}
          {(result?.content || result?.report) && (
            <div style={{ marginBottom: 12 }}>
              <div style={{
                fontSize: 9, color: "#2a5a45", marginBottom: 8,
                fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.08em",
              }}>// RESULT</div>
              <div style={{
                fontSize: 11,
                fontFamily: "JetBrains Mono, monospace",
                padding: "10px 12px", borderRadius: 6,
                background: "#000", border: "1px solid #0d2b1f",
                color: "#4a7a65", lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                maxHeight: 240, overflow: "auto",
              }}>
                {result.content || result.report}
              </div>
            </div>
          )}
          {result?.type === "price" && (
            <div style={{ marginBottom: 12 }}>
              <div style={{
                fontSize: 9, color: "#2a5a45", marginBottom: 8,
                fontFamily: "JetBrains Mono, monospace",
              }}>// PRICE ANALYSIS</div>
              {result.currentPrice && (
                <div style={{ marginBottom: 8, display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{
                    fontSize: 22, fontWeight: 700, color: "#00ebb0",
                    fontFamily: "JetBrains Mono, monospace",
                    textShadow: "0 0 12px #00ebb066",
                  }}>{result.currentPrice} ₺</span>
                  {result.targetPrice && (
                    <span style={{ fontSize: 10, color: "#2a5a45", fontFamily: "JetBrains Mono, monospace" }}>
                      TARGET: {result.targetPrice} ₺
                    </span>
                  )}
                </div>
              )}
              <div style={{
                fontSize: 11, fontFamily: "JetBrains Mono, monospace",
                padding: "10px 12px", borderRadius: 6,
                background: "#000", border: "1px solid #0d2b1f",
                color: "#4a7a65", lineHeight: 1.6, whiteSpace: "pre-wrap",
                maxHeight: 200, overflow: "auto",
              }}>{result.analysis}</div>
            </div>
          )}

          {/* Logs */}
          <div>
            <div style={{
              fontSize: 9, color: "#1e3d2e", marginBottom: 6,
              fontFamily: "JetBrains Mono, monospace",
            }}>// LOGS [{logs.length}]</div>
            <div style={{
              padding: "8px 10px", borderRadius: 6,
              background: "#000", border: "1px solid #0d2b1f",
              maxHeight: 120, overflow: "auto",
            }}>
              {logs.length === 0 ? (
                <div style={{ fontSize: 10, color: "#1e3d2e", fontFamily: "JetBrains Mono, monospace" }}>
                  &gt; no logs yet
                </div>
              ) : logs.map((log, i) => (
                <div key={i} style={{
                  display: "flex", gap: 8, fontSize: 10,
                  fontFamily: "JetBrains Mono, monospace",
                  color: "#2a5a45", marginBottom: 2,
                }}>
                  <span style={{ color: "#00ebb044", flexShrink: 0 }}>
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
