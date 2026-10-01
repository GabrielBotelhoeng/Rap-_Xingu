/** Header fixo: tom claro/escuro conforme a seção embaixo dele, fundo depois do hero e menu do celular. */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

export function initHeader(lenis: Lenis | null): void {
  const header = document.querySelector<HTMLElement>("[data-site-header]");
  if (!header) return;
  const line = () => header.offsetHeight / 2;

  // tom: a seção que passa por baixo da metade do header decide (data-header="light" | "dark")
  document.querySelectorAll<HTMLElement>("[data-header]").forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: () => `top ${line()}`,
      end: () => `bottom ${line()}`,
      onToggle: (self) => {
        if (self.isActive) header.dataset.tone = section.dataset.header ?? "light";
      },
    });
  });

  // fundo translúcido só depois do hero (sobre o hero o header fica transparente)
  // (o pin embrulha o hero num .pin-spacer, então nextElementSibling não serve)
  // decide pelo progresso, não por isActive: no fim da página (progress 1) o trigger fica inativo
  // e o header perdia o fundo por cima do FAQ; onRefresh cobre quem recarrega já rolado
  // começa quando o hero já subiu um quarto da tela: a base dele (painel, seletor, aviso de venda proibida)
  // passava por baixo do logo e do menu ainda transparentes e as letras se embolavam (no celular o
  // painel ocupa quase metade da altura, então "top top" era tarde demais)
  const afterHero = document.querySelectorAll("main section[data-header]")[1];
  if (afterHero) {
    const solid = (self: ScrollTrigger) => header.classList.toggle("is-solid", self.progress > 0);
    ScrollTrigger.create({
      trigger: afterHero,
      start: "top 75%",
      end: "max",
      onToggle: solid,
      onRefresh: solid,
    });
  }

  // item do menu da seção atual
  const links = Array.from(header.querySelectorAll<HTMLAnchorElement>(".site-nav a[href^='#']"));
  links.forEach((link) => {
    const target = document.querySelector(link.hash);
    if (!target) return;
    ScrollTrigger.create({
      trigger: target,
      start: "top 50%",
      end: "bottom 50%",
      onToggle: (self) => {
        if (self.isActive) links.forEach((l) => l.toggleAttribute("aria-current", l === link));
        else link.removeAttribute("aria-current");
      },
    });
  });

  /* ---------- menu do celular ---------- */
  const toggle = header.querySelector<HTMLButtonElement>("[data-menu-toggle]");
  const menu = document.querySelector<HTMLElement>("[data-mobile-menu]");
  if (!toggle || !menu) return;
  menu.inert = true;

  const setOpen = (open: boolean) => {
    toggle.setAttribute("aria-expanded", String(open));
    menu.classList.toggle("is-open", open);
    menu.inert = !open;
    document.body.classList.toggle("menu-open", open);
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (open) lenis?.stop();
    else lenis?.start();
    if (open) menu.querySelector<HTMLElement>("a")?.focus();
  };

  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  menu.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu.classList.contains("is-open")) {
      setOpen(false);
      toggle.focus();
    }
  });
  window.matchMedia("(min-width: 901px)").addEventListener("change", (e) => {
    if (e.matches) setOpen(false);
  });
}
