import { useEffect, useRef } from "react";

export function CyberCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const trailsRef = useRef<HTMLDivElement[]>([]);
  const pos = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const TRAIL_COUNT = 8;
    const trails: HTMLDivElement[] = [];

    for (let i = 0; i < TRAIL_COUNT; i++) {
      const t = document.createElement("div");
      t.style.cssText = `
        position:fixed; width:${6 - i * 0.5}px; height:${6 - i * 0.5}px;
        border-radius:50%; background:#00ebb0;
        pointer-events:none; z-index:99998;
        opacity:${0.6 - i * 0.07};
        transition: none;
        mix-blend-mode: screen;
      `;
      document.body.appendChild(t);
      trails.push(t);
      trailsRef.current.push(t);
    }

    const trailPos = trails.map(() => ({ x: 0, y: 0 }));

    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (dotRef.current) {
        dotRef.current.style.left = e.clientX - 3 + "px";
        dotRef.current.style.top = e.clientY - 3 + "px";
      }
    };

    const animate = () => {
      // Ring lerp
      ringPos.current.x += (pos.current.x - ringPos.current.x) * 0.12;
      ringPos.current.y += (pos.current.y - ringPos.current.y) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.left = ringPos.current.x - 18 + "px";
        ringRef.current.style.top = ringPos.current.y - 18 + "px";
      }

      // Trails
      let prevX = pos.current.x;
      let prevY = pos.current.y;
      for (let i = 0; i < TRAIL_COUNT; i++) {
        trailPos[i].x += (prevX - trailPos[i].x) * (0.4 - i * 0.03);
        trailPos[i].y += (prevY - trailPos[i].y) * (0.4 - i * 0.03);
        trails[i].style.left = trailPos[i].x - 3 + "px";
        trails[i].style.top = trailPos[i].y - 3 + "px";
        prevX = trailPos[i].x;
        prevY = trailPos[i].y;
      }
      requestAnimationFrame(animate);
    };

    document.addEventListener("mousemove", onMove);
    animate();

    return () => {
      document.removeEventListener("mousemove", onMove);
      trails.forEach(t => t.remove());
    };
  }, []);

  return (
    <>
      {/* Dot */}
      <div ref={dotRef} style={{
        position: "fixed", width: 6, height: 6, borderRadius: "50%",
        background: "#00ebb0", pointerEvents: "none", zIndex: 99999,
        boxShadow: "0 0 8px #00ebb0, 0 0 16px #00ebb088",
        transition: "none",
        mixBlendMode: "screen",
      }} />
      {/* Ring */}
      <div ref={ringRef} style={{
        position: "fixed", width: 36, height: 36, borderRadius: "50%",
        border: "1px solid #00ebb066",
        pointerEvents: "none", zIndex: 99998,
        boxShadow: "0 0 12px #00ebb022",
      }} />
    </>
  );
}
