// ============================================================
// DESIGN: "Vital Signs" — Animated ECG header strip
// Continuously animated heartbeat line across the top
// ============================================================

import { useEffect, useRef } from 'react';

export function EcgHeader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const offsetRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cy = H / 2;

    // ECG waveform path (one cycle)
    function ecgY(x: number): number {
      const cycle = 120;
      const pos = ((x % cycle) + cycle) % cycle;
      if (pos < 20) return cy + Math.sin(pos / 20 * Math.PI) * 2;
      if (pos < 30) return cy - (pos - 20) / 10 * 3;
      if (pos < 35) return cy + (pos - 30) / 5 * 18;
      if (pos < 40) return cy - (pos - 35) / 5 * 22;
      if (pos < 50) return cy + (pos - 40) / 10 * 8;
      if (pos < 60) return cy - (pos - 50) / 10 * 5;
      if (pos < 70) return cy + (pos - 60) / 10 * 5;
      return cy + Math.sin((pos - 70) / 50 * Math.PI) * 1.5;
    }

    function draw() {
      ctx!.clearRect(0, 0, W, H);

      // Glow effect — draw twice
      for (let pass = 0; pass < 2; pass++) {
        ctx!.beginPath();
        ctx!.strokeStyle = pass === 0
          ? 'rgba(30, 80, 160, 0.25)'
          : 'rgba(30, 80, 160, 0.85)';
        ctx!.lineWidth = pass === 0 ? 4 : 1.5;
        ctx!.shadowBlur = pass === 0 ? 10 : 5;
        ctx!.shadowColor = 'rgba(30, 80, 160, 0.6)';

        for (let x = 0; x <= W; x++) {
          const y = ecgY(x + offsetRef.current);
          if (x === 0) ctx!.moveTo(x, y);
          else ctx!.lineTo(x, y);
        }
        ctx!.stroke();
      }

      offsetRef.current += 1.5;
      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div className="w-full h-10 relative overflow-hidden">
      <canvas
        ref={canvasRef}
        width={1400}
        height={40}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
    </div>
  );
}
