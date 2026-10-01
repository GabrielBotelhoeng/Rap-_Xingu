/** Catálogo: filtros por linha (Todos · Zero Grau · Xingu · João de Barro) e entrada dos cards. */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initCatalog(root: HTMLElement, { reducedMotion }: { reducedMotion: boolean }): void {
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-filter]"));
  const cards = Array.from(root.querySelectorAll<HTMLElement>(".card"));
  const status = root.querySelector<HTMLElement>("[data-filter-status]");

  function apply(filter: string) {
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === filter)));
    const visible = cards.filter((card) => {
      const show = filter === "todos" || card.dataset.line === filter;
      card.hidden = !show;
      return show;
    });
    if (status) status.textContent = `${visible.length} ${visible.length === 1 ? "sabor" : "sabores"}`;
    if (!reducedMotion) {
      gsap.fromTo(
        visible,
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.035, ease: "power2.out", clearProps: "transform,opacity,visibility" },
      );
    }
    // a altura da grade mudou: recalcula as posições dos gatilhos abaixo
    ScrollTrigger.refresh();
  }

  buttons.forEach((b) => b.addEventListener("click", () => apply(b.dataset.filter ?? "todos")));

  if (reducedMotion) return;
  // cards sobem em cascata quando entram na tela
  gsap.set(cards, { autoAlpha: 0, y: 28 });
  ScrollTrigger.batch(cards, {
    start: "top 92%",
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.06, ease: "power3.out", clearProps: "transform" }),
  });
}
