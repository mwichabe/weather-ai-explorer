import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  twinkleSpeed: number;
  phase: number;
}

/**
 * Fixed full-viewport backdrop:
 *  - Canvas starfield (~1 star / 9000px², capped at 220) with gentle twinkle.
 *  - Three very faint aurora blobs drifting on long ease loops.
 * Pure decoration: pointer-events-none, aria-hidden, paused offscreen via rAF.
 */
export function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let stars: Star[] = [];
    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const seed = () => {
      const { innerWidth: w, innerHeight: h } = window;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(220, Math.floor((w * h) / 9000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.1 + 0.3,
        baseAlpha: Math.random() * 0.5 + 0.15,
        twinkleSpeed: Math.random() * 0.0012 + 0.0004,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const draw = (t: number) => {
      const { innerWidth: w, innerHeight: h } = window;
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const alpha = reducedMotion
          ? s.baseAlpha
          : s.baseAlpha * (0.6 + 0.4 * Math.sin(t * s.twinkleSpeed + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(226, 232, 255, ${alpha.toFixed(3)})`;
        ctx.fill();
      }
      if (!reducedMotion) raf = requestAnimationFrame(draw);
    };

    seed();
    raf = requestAnimationFrame(draw);
    window.addEventListener('resize', seed);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', seed);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-cosmos-950">
      {/* Faint aurora blobs — soft radial glows drifting very slowly */}
      <div
        className="absolute -left-[15%] -top-[20%] h-[60vmax] w-[60vmax] rounded-full opacity-[0.16] blur-3xl animate-aurora-a"
        style={{ background: 'radial-gradient(circle, #5d6cfa 0%, transparent 62%)' }}
      />
      <div
        className="absolute -right-[18%] top-[8%] h-[55vmax] w-[55vmax] rounded-full opacity-[0.12] blur-3xl animate-aurora-b"
        style={{ background: 'radial-gradient(circle, #8b7cf6 0%, transparent 60%)' }}
      />
      <div
        className="absolute -bottom-[28%] left-[22%] h-[58vmax] w-[58vmax] rounded-full opacity-[0.1] blur-3xl animate-aurora-c"
        style={{ background: 'radial-gradient(circle, #58c7f3 0%, transparent 58%)' }}
      />
      <canvas ref={canvasRef} className="absolute inset-0" />
      {/* Vignette to keep edges deep and content readable */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 28%, transparent 0%, rgba(5,7,15,0.55) 90%)' }}
      />
    </div>
  );
}
