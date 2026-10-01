/** Pó de tabaco que explode quando a latinha pousa (canvas 2D, DPR limitado a 2). */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  max: number;
  rgb: string;
  a: number;
}

export interface Dust {
  resize(): void;
  burst(cx: number, cy: number, radius: number, rgb: string, count: number): void;
}

export function createDust(canvas: HTMLCanvasElement, host: HTMLElement): Dust {
  const ctx = canvas.getContext("2d");
  let parts: Particle[] = [];
  let raf = 0;
  let w = 0;
  let h = 0;

  function resize() {
    if (!ctx) return;
    const r = Math.min(window.devicePixelRatio || 1, 2);
    w = host.clientWidth;
    h = host.clientHeight;
    canvas.width = Math.round(w * r);
    canvas.height = Math.round(h * r);
    ctx.setTransform(r, 0, 0, r, 0, 0);
  }

  function tick() {
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    parts = parts.filter((q) => q.life < q.max);
    for (const q of parts) {
      q.life++;
      q.vx *= 0.95;
      q.vy = q.vy * 0.95 + 0.035;
      q.x += q.vx;
      q.y += q.vy;
      const t = q.life / q.max;
      const alpha = q.a * (t < 0.1 ? t / 0.1 : 1 - (t - 0.1) / 0.9);
      ctx.fillStyle = `rgba(${q.rgb},${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2);
      ctx.fill();
    }
    raf = parts.length ? requestAnimationFrame(tick) : 0;
    if (!raf) ctx.clearRect(0, 0, w, h);
  }

  function burst(cx: number, cy: number, radius: number, rgb: string, count: number) {
    if (!ctx) return;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = radius * (0.55 + Math.random() * 0.5);
      const sp = 1 + Math.random() * 4.5;
      const light = Math.random() < 0.18;
      parts.push({
        x: cx + Math.cos(a) * d,
        y: cy + Math.sin(a) * d * 0.85,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 0.6,
        r: Math.random() < 0.85 ? 0.6 + Math.random() * 1.8 : 2.2 + Math.random() * 2.6,
        life: 0,
        max: 50 + Math.random() * 70,
        rgb: light ? "246,238,223" : rgb,
        a: light ? 0.55 : 0.85,
      });
    }
    if (!raf) raf = requestAnimationFrame(tick);
  }

  resize();
  return { resize, burst };
}
