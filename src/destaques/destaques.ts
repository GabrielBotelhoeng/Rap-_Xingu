/* ================= DESTAQUES (tema Mata) =================
   Uma latinha por vez abre conforme o scroll. Cada sabor ocupa um trecho da seção presa:
   entra (luz, tampa e ervas) → abre (a tampa sobe e descansa ao lado, a névoa de pó sobe) → segura.
   gsap.matchMedia() separa desktop e celular (frames 16:9 ou 9:16) e respeita prefers-reduced-motion,
   que fica com a vitrine estática do CSS (latinha aberta, sem pin). */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { clamp01, frameForProgress, segmentFor } from "@/lib/progress";
import { DESTAQUES_CONFIG } from "./destaques.config";
import { FrameSequence } from "./frame-sequence";
import { createMist } from "./mist";

gsap.registerPlugin(ScrollTrigger);

/** Fases dentro do trecho de cada sabor (0–1). */
const OPEN_START = 0.22;
const OPEN_END = 0.72;

const openProgress = (local: number) => clamp01((local - OPEN_START) / (OPEN_END - OPEN_START));
const mistLevel = (local: number) =>
  0.18 + 0.82 * Math.max(0, Math.sin(Math.PI * clamp01((local - OPEN_START) / (OPEN_END - OPEN_START + 0.18))));

/** Cada erva se afasta do centro da latinha quando a tampa sai. */
function drift(el: Element, amount: number) {
  const style = (el as HTMLElement).style;
  const dx = parseFloat(style.getPropertyValue("--x")) - 50;
  const dy = parseFloat(style.getPropertyValue("--y")) - 50;
  const len = Math.hypot(dx, dy) || 1;
  return { xPercent: (dx / len) * amount, yPercent: (dy / len) * amount };
}

export function initDestaques(section: HTMLElement): void {
  const cfg = DESTAQUES_CONFIG;
  const items = cfg.items;
  const n = items.length;
  const all = <T extends Element = HTMLElement>(sel: string) => Array.from(section.querySelectorAll<T>(sel));
  const pinEl = section.querySelector<HTMLElement>("[data-dq]");
  const stage = section.querySelector<HTMLElement>(".dq__stage");
  const seqCanvas = section.querySelector<HTMLCanvasElement>("[data-dq-seq]");
  const mistCanvas = section.querySelector<HTMLCanvasElement>("[data-dq-mist]");
  const glows = all("[data-dq-glow]");
  const lids = all("[data-dq-lid]");
  const copies = all("[data-dq-item]");
  const navs = all("[data-dq-nav]");
  const herbs = all("[data-dq-herbs]").map((g) => Array.from(g.children) as HTMLElement[]);
  if (!pinEl || !stage || n === 0) return;

  const mm = gsap.matchMedia();
  mm.add(
    { desktop: "(min-width: 901px)", mobile: "(max-width: 900px)", reduce: "(prefers-reduced-motion: reduce)" },
    (ctx) => {
      const { mobile, reduce } = ctx.conditions as { mobile: boolean; reduce: boolean };
      if (reduce) return;
      section.classList.add("is-animated");

      const mist = mistCanvas ? createMist(mistCanvas, { dense: !mobile }) : null;
      const seqs = items.map((it) => {
        const set = mobile ? it.frames.mobile : it.frames.desktop;
        return set && set.count > 0 && seqCanvas ? new FrameSequence(seqCanvas, set) : null;
      });

      /* ---------- estado inicial: só o primeiro sabor visível ---------- */
      gsap.set(copies, { autoAlpha: (i: number) => (i === 0 ? 1 : 0), y: (i: number) => (i === 0 ? 0 : 30) });
      gsap.set(glows, { opacity: (i: number) => (i === 0 ? 0.85 : 0) });
      gsap.set(lids, { autoAlpha: (i: number) => (i === 0 ? 1 : 0) });
      herbs.forEach((group, i) => gsap.set(group, { autoAlpha: i === 0 ? 1 : 0 }));

      /* ---------- timeline: 1 unidade de tempo por sabor ---------- */
      const restX = mobile ? 44 : 62;
      const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });
      items.forEach((_, i) => {
        const at = i;
        const lid = lids[i];
        const group = herbs[i] ?? [];
        if (i > 0) {
          tl.to(copies[i - 1] ?? [], { autoAlpha: 0, y: -30, duration: 0.1, ease: "power2.in" }, at - 0.08)
            .to(glows[i - 1] ?? [], { opacity: 0, duration: 0.18 }, at - 0.08)
            .to(lids[i - 1] ?? [], { autoAlpha: 0, scale: 0.8, duration: 0.1, ease: "power2.in" }, at - 0.08)
            .to(herbs[i - 1] ?? [], { autoAlpha: 0, yPercent: "-=40", duration: 0.12, stagger: 0.01, ease: "power2.in" }, at - 0.08)
            .fromTo(glows[i] ?? [], { opacity: 0 }, { opacity: 0.85, duration: 0.18 }, at)
            .fromTo(
              lid ?? [],
              { autoAlpha: 0, yPercent: -30, scale: 1.15, rotation: -10 },
              { autoAlpha: 1, yPercent: 0, scale: 1, rotation: 0, duration: 0.14, ease: "power3.out" },
              at + 0.02,
            )
            .fromTo(group, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.16, stagger: 0.015, ease: "back.out(1.6)" }, at + 0.05)
            .fromTo(copies[i] ?? [], { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.12, ease: "power2.out" }, at + 0.06);
        }
        // abertura: a tampa sobe, gira e descansa ao lado da lata; as ervas se afastam
        const half = (OPEN_END - OPEN_START) / 2;
        tl.to(lid ?? [], { yPercent: -36, xPercent: 16, rotation: -12, scale: 1.08, duration: half, ease: "power2.out" }, at + OPEN_START)
          .to(lid ?? [], { yPercent: -14, xPercent: restX, rotation: 14, scale: 0.86, duration: half, ease: "power2.inOut" }, at + OPEN_START + half)
          .to(
            group,
            {
              xPercent: (_k: number, el: Element) => drift(el, 42).xPercent,
              yPercent: (_k: number, el: Element) => drift(el, 42).yPercent,
              rotation: (k: number) => (k % 2 ? 16 : -16),
              duration: OPEN_END - OPEN_START,
              ease: "power1.inOut",
            },
            at + OPEN_START,
          );
      });
      tl.set({}, {}, n); // duração total = n trechos

      /* ---------- frames, névoa e indicador seguem o progresso da timeline ---------- */
      let shown = -1;
      tl.eventCallback("onUpdate", () => {
        const { index, local } = segmentFor(tl.progress(), n);
        if (index !== shown) {
          shown = index;
          navs.forEach((el, k) => el.classList.toggle("is-active", k === index));
          stage.classList.toggle("uses-seq", Boolean(seqs[index]));
          if (seqCanvas) seqCanvas.hidden = !seqs[index];
          mist?.setTint(items[index]?.glow ?? "#d4ae63");
        }
        if (mist) mist.level = mistLevel(local);
        const seq = seqs[index];
        const set = mobile ? items[index]?.frames.mobile : items[index]?.frames.desktop;
        if (seq && set) seq.request(frameForProgress(openProgress(local), set.count));
      });

      ScrollTrigger.create({
        trigger: section,
        pin: pinEl,
        start: "top top",
        end: () => `+=${Math.round(n * (mobile ? cfg.scrollPerItemMobile : cfg.scrollPerItem) * window.innerHeight)}`,
        scrub: 0.5,
        animation: tl,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      });
      tl.progress(0.0001).progress(0); // dispara o onUpdate inicial

      const onRefresh = () => {
        mist?.resize();
        seqs.forEach((s) => s?.resize());
      };
      ScrollTrigger.addEventListener("refresh", onRefresh);

      // névoa e frames só trabalham com a seção por perto
      let loaded = false;
      const io = new IntersectionObserver(
        ([entry]) => {
          const near = Boolean(entry?.isIntersecting);
          if (near && !loaded) {
            loaded = true;
            seqs.forEach((s) => {
              if (!s) return;
              s.resize();
              s.load();
            });
          }
          if (near) mist?.play();
          else mist?.pause();
        },
        { rootMargin: "50% 0px" },
      );
      io.observe(section);

      return () => {
        io.disconnect();
        mist?.pause();
        ScrollTrigger.removeEventListener("refresh", onRefresh);
        section.classList.remove("is-animated");
        stage.classList.remove("uses-seq");
      };
    },
  );
}
