import { useRef, ReactNode } from "react";

interface TiltCardProps {
  children: ReactNode;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
}

export function TiltCard({ children, style, className, onClick }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotX = ((y - cy) / cy) * -8;
    const rotY = ((x - cx) / cx) * 8;
    el.style.transform = `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`;
    el.style.borderColor = "#00ebb033";
    el.style.boxShadow = `0 0 30px #00ebb011, 0 ${-rotX}px ${Math.abs(rotX) * 3 + 10}px rgba(0,0,0,0.5)`;
    if (glowRef.current) {
      glowRef.current.style.opacity = "1";
      glowRef.current.style.left = x + "px";
      glowRef.current.style.top = y + "px";
    }
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(600px) rotateX(0) rotateY(0) scale(1)";
    el.style.borderColor = "";
    el.style.boxShadow = "";
    if (glowRef.current) glowRef.current.style.opacity = "0";
  };

  return (
    <div
      ref={ref}
      className={className}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        transition: "transform 0.1s ease, border-color 0.2s, box-shadow 0.2s",
        transformStyle: "preserve-3d",
        cursor: onClick ? "pointer" : "default",
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Glow spot */}
      <div ref={glowRef} style={{
        position: "absolute",
        width: 120, height: 120,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,235,176,0.12) 0%, transparent 70%)",
        transform: "translate(-50%,-50%)",
        pointerEvents: "none",
        opacity: 0,
        transition: "opacity 0.2s",
        zIndex: 1,
      }} />
      <div style={{ position: "relative", zIndex: 2 }}>
        {children}
      </div>
    </div>
  );
}
