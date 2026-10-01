/** Age gate (+18): bloqueia a página até a confirmação, que fica no localStorage. */
import { gsap } from "gsap";
import { hasConfirmedAge, rememberAge, safeLocalStorage } from "@/lib/age";

/** Resolve quando a pessoa confirma (ou na hora, se já tinha confirmado). */
export function ageGate(): Promise<void> {
  const html = document.documentElement;
  const gate = document.querySelector<HTMLElement>("[data-age-gate]");
  const storage = safeLocalStorage();

  if (!gate || html.dataset.age === "ok" || hasConfirmedAge(storage)) {
    html.dataset.age = "ok";
    gate?.remove();
    return Promise.resolve();
  }

  // tudo fora do diálogo fica inerte: o foco não escapa e leitores de tela não leem o site por trás
  const outside = ["main", "[data-site-header]", "footer", "[data-wa-bar]", ".skip-link", "[data-mobile-menu]"]
    .map((sel) => document.querySelector<HTMLElement>(sel))
    .filter((el): el is HTMLElement => Boolean(el));
  outside.forEach((el) => (el.inert = true));

  const yes = gate.querySelector<HTMLButtonElement>("[data-age-yes]");
  const no = gate.querySelector<HTMLButtonElement>("[data-age-no]");
  const ask = gate.querySelector<HTMLElement>("[data-age-ask]");
  const denied = gate.querySelector<HTMLElement>("[data-age-denied]");
  yes?.focus();

  return new Promise((resolve) => {
    yes?.addEventListener(
      "click",
      () => {
        rememberAge(storage); // se o navegador bloquear o armazenamento, vale só para esta visita
        outside.forEach((el) => (el.inert = false));
        html.dataset.age = "ok";
        gate.classList.add("is-leaving");
        gsap.to(gate, {
          autoAlpha: 0,
          duration: 0.6,
          ease: "power2.out",
          onComplete: () => gate.remove(),
        });
        resolve();
      },
      { once: true },
    );

    no?.addEventListener("click", () => {
      if (ask) ask.hidden = true;
      if (denied) {
        denied.hidden = false;
        denied.focus();
      }
    });
  });
}
