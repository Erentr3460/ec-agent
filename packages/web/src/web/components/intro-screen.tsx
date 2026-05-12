import { useEffect, useState } from "react";

export function IntroScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"boot" | "glitch" | "out">("boot");
  const [lines, setLines] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  const bootLines = [
    "> INITIALIZING EÇ AGENT SYSTEM...",
    "> LOADING AI MODULES... [OK]",
    "> CONNECTING TO GPT-4o... [OK]",
    "> CONNECTING TO GEMINI PRO IMAGE... [OK]",
    "> ESTABLISHING SECURE CHANNEL... [OK]",
    "> AGENT NETWORK ONLINE",
    "> ALL SYSTEMS NOMINAL",
    "█ READY",
  ];

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < bootLines.length) {
        setLines(prev => [...prev, bootLines[i]]);
        setProgress(Math.round(((i + 1) / bootLines.length) * 100));
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setPhase("glitch"), 300);
        setTimeout(() => setPhase("out"), 800);
        setTimeout(() => onDone(), 1200);
      }
    }, 180);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 99999,
      background: "#000",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      transition: phase === "out" ? "opacity 0.4s ease, transform 0.4s ease" : "none",
      opacity: phase === "out" ? 0 : 1,
      transform: phase === "out" ? "scale(1.03)" : "scale(1)",
      pointerEvents: phase === "out" ? "none" : "all",
    }}>
      {/* Scanline */}
      <div style={{
        position: "absolute", inset: 0,
        background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,235,176,0.015) 2px,rgba(0,235,176,0.015) 4px)",
        pointerEvents: "none",
      }} />

      {/* Logo */}
      <div style={{
        fontSize: 48, fontWeight: 900,
        fontFamily: "JetBrains Mono, monospace",
        color: "#00ebb0",
        letterSpacing: "0.15em",
        textShadow: "0 0 30px #00ebb0, 0 0 60px #00ebb066, 0 0 120px #00ebb033",
        marginBottom: 40,
        animation: phase === "glitch" ? "glitch 0.3s steps(2) infinite" : "none",
        position: "relative",
      }}>
        EÇ AGENT
        {/* Glitch copies */}
        {phase === "glitch" && (
          <>
            <span style={{
              position: "absolute", top: 0, left: 2,
              color: "#00ffcc", opacity: 0.7,
              clipPath: "polygon(0 30%,100% 30%,100% 50%,0 50%)",
            }}>EÇ AGENT</span>
            <span style={{
              position: "absolute", top: 0, left: -2,
              color: "#00ff88", opacity: 0.5,
              clipPath: "polygon(0 65%,100% 65%,100% 80%,0 80%)",
            }}>EÇ AGENT</span>
          </>
        )}
      </div>

      {/* Terminal */}
      <div style={{
        width: 480, maxWidth: "90vw",
        background: "#030f08",
        border: "1px solid #00ebb033",
        borderRadius: 8,
        padding: "20px 24px",
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 11,
        boxShadow: "0 0 40px #00ebb011, inset 0 0 40px #00ebb005",
      }}>
        {lines.map((line, i) => (
          <div key={i} style={{
            color: line.includes("[OK]") ? "#00ebb0" : line === "█ READY" ? "#00ffcc" : "#3a7a5a",
            marginBottom: 4,
            textShadow: line.includes("[OK]") ? "0 0 8px #00ebb066" : "none",
            animation: "fadeInUp 0.15s ease forwards",
          }}>
            {line}
          </div>
        ))}
        {/* Cursor blink */}
        {phase === "boot" && (
          <span style={{ color: "#00ebb0", animation: "pulse-green 0.8s infinite" }}>▋</span>
        )}
      </div>

      {/* Progress bar */}
      <div style={{
        width: 480, maxWidth: "90vw", marginTop: 16,
        height: 2, background: "#0d2b1f", borderRadius: 99,
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%", width: `${progress}%`,
          background: "linear-gradient(90deg, #003a28, #00ebb0)",
          transition: "width 0.15s ease",
          boxShadow: "0 0 8px #00ebb0",
        }} />
      </div>
      <div style={{
        marginTop: 8, fontSize: 10,
        fontFamily: "JetBrains Mono, monospace",
        color: "#00ebb066",
      }}>
        {progress}% LOADED
      </div>
    </div>
  );
}
