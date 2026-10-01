/** Barra fixa de WhatsApp no celular: some nas seções que já têm o botão principal da tela
    (hero, destaques e formulário — um botão principal por tela; nos destaques cada sabor tem
    o seu "Quero revender este sabor"). */
export function initWaBar(): void {
  const bar = document.querySelector<HTMLElement>("[data-wa-bar]");
  if (!bar) return;
  const ownCta = ["#inicio", "#destaques", "#revenda"]
    .map((sel) => document.querySelector<HTMLElement>(sel))
    .filter((el): el is HTMLElement => el !== null);

  const seen = new Map<Element, boolean>(ownCta.map((el) => [el, true]));
  const update = () => {
    const show = ![...seen.values()].some(Boolean);
    bar.classList.toggle("is-visible", show);
    bar.inert = !show;
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => seen.set(en.target, en.isIntersecting));
      update();
    },
    { rootMargin: "0px 0px -20% 0px" },
  );
  ownCta.forEach((el) => io.observe(el));
  update();
}
