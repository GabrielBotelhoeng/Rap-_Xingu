import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource-variable/manrope";
import "@fontsource/big-shoulders-display/latin-900";

import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/header.css";
import "./styles/age-gate.css";
import "./styles/hero.css";
import "./styles/destaques.css";
import "./styles/sections.css";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { initDestaques } from "@/destaques/destaques";
import { initHero } from "@/hero/hero";
import { prefersReducedMotion } from "@/lib/dom";
import { initSmoothScroll } from "@/lib/smooth-scroll";
import { ageGate } from "@/sections/age-gate";
import { initCatalog } from "@/sections/catalog";
import { initHeader } from "@/sections/header";
import { initRevenda } from "@/sections/revenda";
import { initWaBar } from "@/sections/wa-bar";

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

async function boot() {
  const reducedMotion = prefersReducedMotion();
  const lenis = initSmoothScroll({ reducedMotion });
  const confirmed = ageGate();
  if (document.documentElement.dataset.age !== "ok") lenis?.stop();

  // a palavra do hero é medida com a fonte certa
  await document.fonts.load('900 100px "Big Shoulders Display"').catch(() => undefined);

  // ScrollTriggers criados de cima para baixo: hero, destaques, depois o resto
  const heroEl = document.querySelector<HTMLElement>("[data-hero]");
  const hero = heroEl ? initHero(heroEl, { reducedMotion }) : null;
  const destaques = document.querySelector<HTMLElement>("[data-destaques]");
  if (destaques) initDestaques(destaques);
  const catalogo = document.querySelector<HTMLElement>("#catalogo");
  if (catalogo) initCatalog(catalogo, { reducedMotion });
  const form = document.querySelector<HTMLFormElement>("[data-revenda-form]");
  if (form) initRevenda(form);
  initHeader(lenis);
  initWaBar();

  await confirmed;
  lenis?.start();
  hero?.start();

  document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
}

boot().catch((error: unknown) => {
  console.error("Falha ao iniciar a página:", error);
});
