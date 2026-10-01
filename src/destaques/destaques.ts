/* ================= DESTAQUES — "Os mais pedidos." (tema Mata) =================
   Um sabor por linha, rolagem livre: nada fica preso. Cada latinha chega fechada (a tampa por cima)
   e abre conforme a linha sobe na tela — a tampa desliza para o lado, a lata vai para o lugar dela,
   a luz na cor do rótulo acende e o pó levanta quando a tampa sai. O texto entra uma vez.
   O movimento acompanha a rolagem (scrub) nos dois sentidos, sem pin.
   Com movimento reduzido fica a vitrine estática do CSS: latinhas abertas, texto à vista. */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PRODUCTS } from "@/content/products";
import { createDust } from "@/hero/dust";
import { DESTAQUES_CONFIG } from "./destaques.config";

gsap.registerPlugin(ScrollTrigger);

/** Fração do trecho de rolagem em que a tampa já saiu de cima do pó (o pó levanta aí). */
const PUFF_AT = 0.5;

export function initDestaques(section: HTMLElement): void {
  const items = Array.from(section.querySelectorAll<HTMLElement>("[data-dq-item]"));
  if (items.length === 0) return;

  const mm = gsap.matchMedia();
  mm.add({ motion: "(prefers-reduced-motion: no-preference)", mobile: "(max-width: 900px)" }, (ctx) => {
    const { motion, mobile } = ctx.conditions as { motion: boolean; mobile: boolean };
    if (!motion) return;
    section.classList.add("is-animated");
    const dusts: { resize(): void }[] = [];

    items.forEach((item, i) => {
      const q = <T extends Element = HTMLElement>(sel: string) => item.querySelector<T>(sel);
      const stage = q(".dq-item__stage");
      const pair = q("[data-dq-pair]");
      const tin = q(".dq-item__tin");
      const lid = q(".dq-item__lid");
      const glow = q(".dq-item__glow");
      const copy = q("[data-dq-copy]");
      const canvas = q<HTMLCanvasElement>("[data-dq-dust]");
      if (!stage || !pair || !tin || !lid || !glow || !copy) return;
      const product = DESTAQUES_CONFIG.items[i]?.product;
      const powder = product ? PRODUCTS[product].powder : "80,54,26";
      const dust = canvas ? createDust(canvas, canvas) : null;
      if (dust) dusts.push(dust);

      const puff = () => {
        if (!dust || !canvas) return;
        const c = canvas.getBoundingClientRect();
        const t = tin.getBoundingClientRect();
        dust.burst(t.left - c.left + t.width / 2, t.top - c.top + t.height / 2, t.width * 0.34, powder, mobile ? 55 : 100);
      };

      // fechada: lata e tampa no centro da caixa (deslocamentos calculados no build, em % da largura de cada peça)
      const closedTin = Number(tin.dataset.closed) || 0;
      const closedLid = Number(lid.dataset.closed) || 0;
      const tl = gsap.timeline({ defaults: { ease: "none" } });
      tl.fromTo(glow, { opacity: 0.12, scale: 0.72 }, { opacity: 1, scale: 1, duration: 1 }, 0)
        .fromTo(pair, { y: mobile ? 28 : 46, rotation: i % 2 ? 7 : -7 }, { y: 0, rotation: 0, duration: 1, ease: "power1.out" }, 0)
        .fromTo(tin, { xPercent: closedTin }, { xPercent: 0, duration: 0.62, ease: "power2.inOut" }, 0.32)
        .fromTo(lid, { xPercent: closedLid, rotation: -16 }, { xPercent: 0, rotation: 0, duration: 0.62, ease: "power2.inOut" }, 0.32)
        // a tampa sobe um pouco ao sair (fica maior) e desce no lugar dela
        .fromTo(lid, { scale: 1 }, { scale: 1.08, duration: 0.26, ease: "sine.out" }, 0.32)
        .to(lid, { scale: 1, duration: 0.36, ease: "sine.in" }, 0.58);

      let puffed = false;
      ScrollTrigger.create({
        trigger: stage,
        start: "top 92%",
        end: mobile ? "center 52%" : "center 58%",
        scrub: 0.6,
        animation: tl,
        onUpdate(self) {
          // o pó levanta uma vez por abertura, só descendo a página
          if (!puffed && self.direction > 0 && self.progress > PUFF_AT) {
            puffed = true;
            puff();
          } else if (self.progress < PUFF_AT * 0.5) {
            puffed = false;
          }
        },
      });

      // o texto entra uma vez e fica (texto que some e volta com a rolagem atrapalha a leitura)
      gsap.from(copy.children, {
        y: 26,
        opacity: 0,
        duration: 0.8,
        stagger: 0.07,
        ease: "power3.out",
        scrollTrigger: { trigger: copy, start: "top 88%", once: true },
      });
    });

    const onRefresh = () => dusts.forEach((d) => d.resize());
    ScrollTrigger.addEventListener("refresh", onRefresh);
    return () => {
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      section.classList.remove("is-animated");
    };
  });
}
