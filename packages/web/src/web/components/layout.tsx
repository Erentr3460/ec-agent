import { Link, useLocation } from "wouter";
import { useState } from "react";
import {
  Bot, LayoutDashboard, Settings,
  FileText, Search, TrendingDown, ImageIcon, Menu, X, MessageCircle, Zap
} from "lucide-react";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard", tag: "HUB" },
  { path: "/chat", icon: MessageCircle, label: "Chat", tag: "GPT-4o" },
  { path: "/blog", icon: FileText, label: "Blog Yazarı", tag: "AI" },
  { path: "/seo", icon: Search, label: "SEO Analizi", tag: "AI" },
  { path: "/price", icon: TrendingDown, label: "Fiyat Takibi", tag: "AI" },
  { path: "/image", icon: ImageIcon, label: "Görsel Üretici", tag: "GEM" },
  { path: "/settings", icon: Settings, label: "Ayarlar", tag: "" },
];

const SidebarInner = ({ onNav }: { onNav?: () => void }) => {
  const [location] = useLocation();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo */}
      <div style={{
        padding: "20px 16px 18px",
        borderBottom: "1px solid #0d2b1f",
        display: "flex", alignItems: "center", gap: 10,
        position: "relative", overflow: "hidden",
      }}>
        {/* Glow behind logo */}
        <div style={{
          position: "absolute", top: "50%", left: 16,
          width: 32, height: 32, borderRadius: "50%",
          background: "#00ebb033",
          filter: "blur(12px)",
          transform: "translateY(-50%)",
          pointerEvents: "none",
        }} />
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: "linear-gradient(135deg, #00ebb022, #003a2888)",
          border: "1px solid #00ebb044",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          boxShadow: "0 0 12px #00ebb033",
          position: "relative",
        }}>
          <Bot size={16} color="#00ebb0" />
        </div>
        <div>
          <div style={{
            fontSize: 13, fontWeight: 700, color: "#e8fdf5",
            letterSpacing: "0.12em",
            fontFamily: "JetBrains Mono, monospace",
            textShadow: "0 0 12px #00ebb066",
          }}>EÇ AGENT</div>
          <div style={{
            fontSize: 10, color: "#00ebb0",
            fontFamily: "JetBrains Mono, monospace",
            letterSpacing: "0.08em",
            opacity: 0.7,
          }}>SYS_ONLINE ▋</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "10px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map(({ path, icon: Icon, label, tag }) => {
          const active = location === path;
          return (
            <Link key={path} to={path}>
              <div
                onClick={onNav}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 10px",
                  borderRadius: 8,
                  cursor: "pointer",
                  background: active ? "linear-gradient(90deg,#00ebb011,transparent)" : "transparent",
                  border: `1px solid ${active ? "#00ebb033" : "transparent"}`,
                  color: active ? "#00ebb0" : "#2a5a45",
                  transition: "all 0.2s",
                  userSelect: "none",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.color = "#00ebb066";
                    (e.currentTarget as HTMLElement).style.background = "rgba(0,235,176,0.04)";
                    (e.currentTarget as HTMLElement).style.borderColor = "#0d2b1f";
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.color = "#2a5a45";
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                  }
                }}
              >
                {/* Active glow line */}
                {active && (
                  <div style={{
                    position: "absolute", left: 0, top: "20%", bottom: "20%",
                    width: 2, borderRadius: 99,
                    background: "#00ebb0",
                    boxShadow: "0 0 8px #00ebb0",
                  }} />
                )}
                <Icon size={14} style={{ flexShrink: 0, marginLeft: active ? 4 : 0 }} />
                <span style={{ fontSize: 12, fontWeight: 500, flex: 1 }}>{label}</span>
                {tag && (
                  <span style={{
                    fontSize: 9, padding: "2px 5px", borderRadius: 3,
                    border: `1px solid ${active ? "#00ebb044" : "#0d2b1f"}`,
                    color: active ? "#00ebb0" : "#1e3d2e",
                    fontFamily: "JetBrains Mono, monospace",
                    letterSpacing: "0.05em",
                  }}>{tag}</span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Status footer */}
      <div style={{
        padding: "12px 16px",
        borderTop: "1px solid #0d2b1f",
        background: "linear-gradient(0deg,#000,transparent)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <div style={{
            width: 5, height: 5, borderRadius: "50%",
            background: "#00ebb0",
            animation: "pulse-green 2s infinite",
            boxShadow: "0 0 6px #00ebb0",
          }} />
          <span style={{ fontSize: 10, color: "#00ebb0", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.06em" }}>
            GPT-4o · ONLINE
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Zap size={9} color="#00ebb044" />
          <span style={{ fontSize: 9, color: "#1e3d2e", fontFamily: "JetBrains Mono, monospace" }}>
            GEMINI PRO IMAGE · READY
          </span>
        </div>
      </div>
    </div>
  );
};

export function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#000" }}>
      {open && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.85)" }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar desktop */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: "#000",
        borderRight: "1px solid #0d2b1f",
        display: "none", flexDirection: "column",
        position: "sticky", top: 0, height: "100vh",
      }} className="sidebar-desktop">
        <SidebarInner />
      </aside>

      {/* Sidebar mobile */}
      <aside style={{
        position: "fixed", top: 0, left: 0,
        width: 220, height: "100vh",
        background: "#000",
        borderRight: "1px solid #0d2b1f",
        zIndex: 50,
        transform: open ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.25s ease",
        display: "flex", flexDirection: "column",
        boxShadow: open ? "0 0 40px #00ebb011" : "none",
      }} className="sidebar-mobile">
        <button onClick={() => setOpen(false)} style={{
          position: "absolute", top: 14, right: 14,
          background: "none", border: "none", cursor: "pointer", color: "#2a5a45",
        }}>
          <X size={18} />
        </button>
        <SidebarInner onNav={() => setOpen(false)} />
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: "auto", minWidth: 0, position: "relative", zIndex: 1 }}>
        {/* Mobile topbar */}
        <div style={{
          display: "none", alignItems: "center", gap: 12,
          padding: "12px 16px",
          borderBottom: "1px solid #0d2b1f",
          background: "#000",
          position: "sticky", top: 0, zIndex: 30,
        }} className="mobile-topbar">
          <button onClick={() => setOpen(true)} style={{
            background: "none", border: "none", cursor: "pointer", color: "#2a5a45",
          }}>
            <Menu size={20} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Bot size={14} color="#00ebb0" />
            <span style={{
              fontSize: 13, fontWeight: 700, color: "#e8fdf5",
              fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.1em",
              textShadow: "0 0 8px #00ebb066",
            }}>EÇ AGENT</span>
          </div>
        </div>

        {children}
      </main>

      <style>{`
        @media (min-width: 768px) {
          .sidebar-desktop { display: flex !important; }
          .sidebar-mobile { display: none !important; }
        }
        @media (max-width: 767px) {
          .sidebar-desktop { display: none !important; }
          .mobile-topbar { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
