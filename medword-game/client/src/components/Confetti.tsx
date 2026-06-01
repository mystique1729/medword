// ============================================================
// DESIGN: "Vital Signs" — Medical confetti celebration
// Medical cross symbols and particles raining down
// ============================================================

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  size: number;
  type: 'cross' | 'rect' | 'circle';
  opacity: number;
}

const COLORS = ['#1E50A0', '#2E8B57', '#4338CA', '#7C3AED', '#DC2626', '#0EA5E9'];

export function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (!active) {
      cancelAnimationFrame(animRef.current);
      particlesRef.current = [];
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Spawn particles
    for (let i = 0; i < 120; i++) {
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 8 + Math.random() * 14,
        type: Math.random() < 0.4 ? 'cross' : Math.random() < 0.7 ? 'rect' : 'circle',
        opacity: 1,
      });
    }

    function drawCross(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
      const arm = size / 3;
      ctx.fillRect(x - arm / 2, y - size / 2, arm, size);
      ctx.fillRect(x - size / 2, y - arm / 2, size, arm);
    }

    function animate() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      const alive: Particle[] = [];

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // gravity
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.004;

        if (p.y < canvas!.height && p.opacity > 0) {
          alive.push(p);
          ctx!.save();
          ctx!.globalAlpha = p.opacity;
          ctx!.fillStyle = p.color;
          ctx!.shadowBlur = 6;
          ctx!.shadowColor = p.color;
          ctx!.translate(p.x, p.y);
          ctx!.rotate((p.rotation * Math.PI) / 180);

          if (p.type === 'cross') {
            drawCross(ctx!, 0, 0, p.size);
          } else if (p.type === 'rect') {
            ctx!.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          } else {
            ctx!.beginPath();
            ctx!.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx!.fill();
          }
          ctx!.restore();
        }
      }

      particlesRef.current = alive;
      if (alive.length > 0) {
        animRef.current = requestAnimationFrame(animate);
      }
    }

    animate();
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}
