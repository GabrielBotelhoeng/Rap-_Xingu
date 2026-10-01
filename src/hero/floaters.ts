/* Fundo flutuante do hero: latinhas, folhas de tabaco e especiarias atrás da palavra.
   O HTML vem pronto do build (render.ts › renderHeroFloaters) em três camadas de profundidade.
   - cada item deriva sozinho por CSS (transform, barato);
   - no desktop as camadas seguem o ponteiro (parallax: a de perto mexe mais);
   - enquanto o hero está preso, a rolagem sobe as camadas (de novo, a de perto mais);
   - na troca de sabor, um "vento" empurra as camadas para o lado de onde o produto sai.
   Com movimento reduzido fica tudo parado; o botão de pausa do hero também para o fundo. */
import { gsap } from "gsap";

export interface Floaters {
  /** Progresso (0–1) da rolagem com o hero preso. */
  setProgress(p: number): void;
  /** Empurra as camadas na direção (dx, dy) — usado na troca de sabor. */
  kick(dx: number, dy: number, duration: number): void;
  /** Liga/desliga o movimento (pausa do usuário, hero fora da tela, aba escondida). */
  setActive(on: boolean): void;
}

const NONE: Floaters = { setProgress() {}, kick() {}, setActive() {} };

export function initFloaters(root: HTMLElement, { reducedMotion }: { reducedMotion: boolean }): Floaters {
  const box = root.querySelector<HTMLElement>("[data-hero-floaters]");
  if (!box) return NONE;
  if (reducedMotion) {
    box.classList.add("is-still");
    return NONE;
  }
  const layers = Array.from(box.querySelectorAll<HTMLElement>("[data-fl-layer]")).map((el) => ({
    el,
    inner: el.firstElementChild as HTMLElement,
    depth: Number(el.dataset.flLayer) || 0,
  }));
  const weight = (d: number) => [0.35, 0.7, 1.15][d] ?? 0.5;

  // parallax do ponteiro (só com mouse/caneta: no toque não há "posição do ponteiro" parada)
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  const follow = layers.map(({ el }) => ({
    x: gsap.quickTo(el, "x", { duration: 1.1, ease: "power3.out" }),
    y: gsap.quickTo(el, "y", { duration: 1.1, ease: "power3.out" }),
  }));
  root.addEventListener("pointermove", (e) => {
    if (!fine.matches || e.pointerType === "touch") return;
    const r = root.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    layers.forEach((l, k) => {
      const w = weight(l.depth);
      follow[k]?.x(-nx * 46 * w);
      follow[k]?.y(-ny * 30 * w);
    });
  });
  root.addEventListener("pointerleave", () => follow.forEach((f) => (f.x(0), f.y(0))));

  return {
    setProgress(p) {
      layers.forEach((l) => gsap.set(l.inner, { y: -p * 120 * weight(l.depth) }));
    },
    kick(dx, dy, duration) {
      layers.forEach((l) => {
        const w = weight(l.depth);
        gsap.fromTo(
          l.inner,
          { x: 0, rotation: 0 },
          {
            keyframes: [
              { x: dx * 70 * w, rotation: dx * 2.5 * w, duration: duration * 0.45, ease: "power2.out" },
              { x: 0, rotation: 0, duration: duration * 0.9, ease: "power2.inOut" },
            ],
            overwrite: "auto",
          },
        );
        // o y é da rolagem; aqui só um leve empurrão vertical por cima, que volta sozinho
        if (dy) gsap.fromTo(l.el, { yPercent: 0 }, { yPercent: dy * 1.6 * w, duration: duration * 0.45, yoyo: true, repeat: 1, ease: "sine.inOut" });
      });
    },
    setActive(on) {
      box.classList.toggle("is-paused", !on);
    },
  };
}
