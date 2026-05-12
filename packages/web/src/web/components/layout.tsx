import { Link, useLocation } from "wouter";
import { useState } from "react";
import {
  Bot, LayoutDashboard, Settings,
  FileText, Search, TrendingDown, ImageIcon, Menu, X, MessageCircle
} from "lucide-react";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/chat", icon: MessageCircle, label: "Chat" },
  { path: "/blog", icon: FileText, label: "Blog Yazarı" },
  { path: "/seo", icon: Search, label: "SEO Analizi" },
  { path: "/price", icon: TrendingDown, label: "Fiyat Takibi" },
  { path: "/image", icon: ImageIcon, label: "Görsel Üretici" },
  { path: "/settings", icon: Settings, label: "Ayarlar" },
];

const SidebarInner = ({ onNav }: { onNav?: () => void }) => {
  const [location] = useLocation();
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo */}
      <div style={{
        padding: "20px 20px 18px",
        borderBottom: "1px solid #1c1c1c",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "#7c3aed",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <Bot size={16} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#ececec", letterSpacing: "0.05em" }}>EÇ AGENT</div>
          <div style={{ fontSize: 11, color: "#555", marginTop: 1 }}>AI Görev Merkezi</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map(({ path, icon: Icon, label }) => {
          const active = location === path;
          return (
            <Link key={path} to={path}>
              <div
                onClick={onNav}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px",
                  borderRadius: 8,
                  cursor: "pointer",
                  background: active ? "#141414" : "transparent",
                  border: `1px solid ${active ? "#242424" : "transparent"}`,
                  color: active ? "#ececec" : "#555",
                  transition: "all 0.15s",
                  userSelect: "none",
                }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.color = "#888";
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.color = "#555";
                }}
              >
                <Icon size={15} />
                <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
                {active && (
                  <div style={{
                    marginLeft: "auto",
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "#7c3aed",
                  }} />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding: "14px 20px",
        borderTop: "1px solid #1c1c1c",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: "#444" }}>GPT-4o · Online</span>
      </div>
    </div>
  );
};

export function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#080808" }}>
      {/* Mobile overlay */}
      {open && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.7)" }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar desktop */}
      <aside style={{
        width: 220,
        flexShrink: 0,
        background: "#080808",
        borderRight: "1px solid #1c1c1c",
        display: "none",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100vh",
      }} className="sidebar-desktop">
        <SidebarInner />
      </aside>

      {/* Sidebar mobile */}
      <aside style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: 220,
        height: "100vh",
        background: "#080808",
        borderRight: "1px solid #1c1c1c",
        zIndex: 50,
        transform: open ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.25s ease",
        display: "flex",
        flexDirection: "column",
      }} className="sidebar-mobile">
        <button
          onClick={() => setOpen(false)}
          style={{
            position: "absolute", top: 14, right: 14,
            background: "none", border: "none", cursor: "pointer", color: "#555",
          }}
        >
          <X size={18} />
        </button>
        <SidebarInner onNav={() => setOpen(false)} />
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: "auto", minWidth: 0 }}>
        {/* Mobile topbar */}
        <div style={{
          display: "none",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          borderBottom: "1px solid #1c1c1c",
          background: "#080808",
          position: "sticky",
          top: 0,
          zIndex: 30,
        }} className="mobile-topbar">
          <button
            onClick={() => setOpen(true)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#555" }}
          >
            <Menu size={20} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 6, background: "#7c3aed",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Bot size={13} color="#fff" />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#ececec" }}>EÇ AGENT</span>
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
