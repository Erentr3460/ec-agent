import { Link, useLocation } from "wouter";
import {
  Bot, LayoutDashboard, Settings, Zap,
  FileText, Search, TrendingDown, ImageIcon
} from "lucide-react";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/blog", icon: FileText, label: "Blog Yazarı", color: "#7c3aed" },
  { path: "/seo", icon: Search, label: "SEO Analizi", color: "#06d6a0" },
  { path: "/price", icon: TrendingDown, label: "Fiyat Takibi", color: "#f59e0b" },
  { path: "/image", icon: ImageIcon, label: "Görsel Üretici", color: "#10b981" },
  { path: "/settings", icon: Settings, label: "Ayarlar" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen mesh-bg">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 border-r flex flex-col" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        {/* Logo */}
        <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center relative" style={{ background: "linear-gradient(135deg, #7c3aed, #06d6a0)" }}>
              <Bot size={18} className="text-white" />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 border-2" style={{ borderColor: "var(--surface)" }}></span>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wider" style={{ fontFamily: "Syne, sans-serif", color: "var(--text)" }}>EÇ AGENT</h1>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>AI Görev Merkezi</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ path, icon: Icon, label, color }) => {
            const active = location === path;
            return (
              <Link key={path} to={path}>
                <div
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all"
                  style={{
                    background: active ? "rgba(124,58,237,0.15)" : "transparent",
                    borderLeft: active ? `2px solid ${color || "#7c3aed"}` : "2px solid transparent",
                    color: active ? "var(--text)" : "var(--text-muted)",
                  }}
                >
                  <Icon size={16} style={{ color: active ? (color || "#7c3aed") : "inherit" }} />
                  <span className="text-sm font-medium">{label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <Zap size={14} style={{ color: "#7c3aed" }} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>GPT-4o Aktif</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
