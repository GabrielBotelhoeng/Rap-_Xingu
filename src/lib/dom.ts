/** Escreve texto marcando [colchetes] como placeholder (.tbc), sem innerHTML. */
export function setRichText(el: HTMLElement, text: string): void {
  const parts = text.split(/(\[[^\]]+\])/g).filter(Boolean);
  el.replaceChildren(
    ...parts.map((part) => {
      if (part.startsWith("[") && part.endsWith("]")) {
        const span = document.createElement("span");
        span.className = "tbc";
        span.textContent = part;
        return span;
      }
      return document.createTextNode(part);
    }),
  );
}

export function must<T extends Element>(root: ParentNode, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`Elemento não encontrado: ${selector}`);
  return el;
}

export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
