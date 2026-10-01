/** Lenis só no desktop (mouse/trackpad). No toque o scroll continua nativo, sem syncTouch (PROJETO.md). */
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initSmoothScroll({ reducedMotion }: { reducedMotion: boolean }): Lenis | null {
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!finePointer || reducedMotion) return null;

  const lenis = new Lenis({ lerp: 0.11, anchors: true, autoRaf: false });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}
