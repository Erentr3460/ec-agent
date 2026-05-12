import { useEffect, useRef } from "react";

export function MatrixBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const fontSize = 11;
    const chars = "01アイウエオカキクケコ∆∑∏√∞≈≠∈⊕⟨⟩╔╗╚╝│─┼EÇAGENTSYSTEMINITIALIZEDゲームオーバー";
    const cols = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(cols).fill(1).map(() => Math.random() * -100);

    const draw = () => {
      ctx.fillStyle = "rgba(0,0,0,0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Head char — bright
        ctx.fillStyle = "#00ebb0";
        ctx.font = `${fontSize}px JetBrains Mono, monospace`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#00ebb0";
        ctx.fillText(char, x, y);

        // Body — dim
        ctx.fillStyle = "#003a28";
        ctx.shadowBlur = 0;
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], x, y - fontSize);

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += 0.4;
      }
    };

    const loop = () => {
      draw();
      animId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0, left: 0,
        width: "100vw", height: "100vh",
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.18,
      }}
    />
  );
}
