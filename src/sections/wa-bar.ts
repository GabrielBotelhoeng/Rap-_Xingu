/** Barra fixa de WhatsApp no celular: aparece depois do hero e some na seção do formulário
    (lá o botão principal é "Enviar pelo WhatsApp" — um botão principal por tela). */
export function initWaBar(): void {
  const bar = document.querySelector<HTMLElement>("[data-wa-bar]");
  const hero = document.querySelector<HTMLElement>("#inicio");
  const revenda = document.querySelector<HTMLElement>("#revenda");
  if (!bar) return;

  const seen = new Map<Element, boolean>();
  const update = () => {
    const show = !seen.get(hero as Element) && !seen.get(revenda as Element);
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
  [hero, revenda].forEach((el) => {
    if (!el) return;
    seen.set(el, true);
    io.observe(el);
  });
  update();
}
