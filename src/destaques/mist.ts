/**
 * Névoa fina de pó subindo de dentro da latinha (canvas 2D).
 * `level` (0–1) controla quanto pó sai; a cor puxa levemente a luz de cada sabor.
 */
import { gsap } from "gsap";

interface Grain {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  grow: number;
  life: number;
  max: number;
  a: number;
  warm: boolean;
}

export interface Mist {
  level: number;
  resize(): void;
  setTint(hex: string): void;
  play(): void;
  pause(): void;
}

function sprite(color: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  if (g) {
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, color);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
  }
  return c;
}

export function createMist(canvas: HTMLCanvasElement, { dense }: { dense: boolean }): Mist {
  const ctx = canvas.getContext("2d");
  const warm = sprite("rgba(212,174,99,0.9)");
  let tint = sprite("rgba(239,230,214,0.85)");
  const grains: Grain[] = [];
  const cap = dense ? 240 : 110;
  let w = 0;
  let h = 0;
  let running = false;

  const state: Mist = {
    level: 0.25,
    resize() {
      if (!ctx) return;
      const r = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.round(w * r));
      canvas.height = Math.max(1, Math.round(h * r));
      ctx.setTransform(r, 0, 0, r, 0, 0);
    },
    setTint(hex: string) {
      const n = parseInt(hex.slice(1), 16);
      // mistura a cor do sabor com o papel, para a névoa não ficar saturada
      const mix = (c: number) => Math.round(c * 0.45 + 239 * 0.55);
      tint = sprite(`rgba(${mix((n >> 16) & 255)},${mix((n >> 8) & 255)},${mix(n & 255)},0.85)`);
    },
    play() {
      if (running) return;
      running = true;
      gsap.ticker.add(tick);
    },
    pause() {
      running = false;
      gsap.ticker.remove(tick);
    },
  };

  function spawn() {
    // boca da latinha: elipse no centro do palco
    const a = Math.random() * Math.PI * 2;
    const rr = Math.sqrt(Math.random());
    const isWarm = Math.random() < 0.35;
    grains.push({
      x: w / 2 + Math.cos(a) * rr * w * 0.17,
      y: h / 2 + Math.sin(a) * rr * h * 0.12,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -(0.25 + Math.random() * 0.75),
      r: 4 + Math.random() * 10,
      grow: 0.08 + Math.random() * 0.22,
      life: 0,
      max: 120 + Math.random() * 140,
      a: (isWarm ? 0.22 : 0.16) * (0.6 + Math.random() * 0.4),
      warm: isWarm,
    });
  }

  function tick() {
    if (!ctx) return;
    const rate = state.level * (dense ? 3.2 : 1.6);
    let n = Math.floor(rate) + (Math.random() < rate % 1 ? 1 : 0);
    while (n-- > 0 && grains.length < cap) spawn();
    ctx.clearRect(0, 0, w, h);
    for (let i = grains.length - 1; i >= 0; i--) {
      const g = grains[i]!;
      g.life++;
      g.x += g.vx + Math.sin((g.life + i) * 0.02) * 0.15;
      g.y += g.vy;
      g.vy *= 0.997;
      g.r += g.grow;
      const t = g.life / g.max;
      if (t >= 1) {
        grains.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = g.a * (t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85);
      ctx.drawImage(g.warm ? warm : tint, g.x - g.r, g.y - g.r, g.r * 2, g.r * 2);
    }
    ctx.globalAlpha = 1;
  }

  state.resize();
  return state;
}
