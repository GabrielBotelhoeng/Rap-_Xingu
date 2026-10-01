/* Encaixe do produto do hero na tela atual (funções puras; testes em tests/hero-placement.test.ts).
   As posições do hero.config.ts continuam sendo o ideal: aqui o produto só sobe ou encolhe
   quando, do jeito configurado, encostaria no painel de textos ou no seletor de sabores. */
import type { HeroPlacement } from "./hero.config";

/**
 * Quanto o centro visível da imagem se desloca por causa do giro. O GSAP gira .hero__product-move
 * em volta do centro da caixa dele, mas a imagem (translate -50% -50%) fica centrada no canto dessa
 * caixa — então girar também move a imagem. É assim desde o protótipo e as posições do config já
 * contam com isso; aqui só se mede o efeito. `w`/`h` em px, `deg` em graus (horário, como no CSS).
 */
export function pivotShift(w: number, h: number, deg: number): { dx: number; dy: number } {
  const r = (deg * Math.PI) / 180;
  const c = 1 - Math.cos(r);
  const s = Math.sin(r);
  return { dx: (w / 2) * c + (h / 2) * s, dy: (h / 2) * c - (w / 2) * s };
}

/**
 * Desktop e tablet deitado: o produto fica no centro, entre o painel de textos e o seletor.
 * `maxExtent` é a largura livre e `shift` o deslocamento visível do giro (pivotShift), os dois na
 * mesma unidade de `x` e `size` (% da menor dimensão do hero). Se 2·|x + shift| + size passar da
 * largura livre, tamanho e deslocamento encolhem juntos até caber (o shift encolhe junto, é linear).
 */
export function fitWidth(p: HeroPlacement, maxExtent: number, shift = 0): HeroPlacement {
  const extent = 2 * Math.abs(p.x + shift) + p.size;
  if (extent <= 0 || extent <= maxExtent) return p;
  const k = Math.max(0, maxExtent) / extent;
  return { ...p, x: p.x * k, size: p.size * k };
}

/** Faixa vertical livre para o produto, em px a partir do topo do hero. */
export interface Band {
  top: number;
  bottom: number;
}

/**
 * Celular: o produto (centro visível `cy` e altura `h`, em px) não pode passar de `band.bottom`, o
 * topo do painel de textos. Primeiro sobe até caber, sem subir além de `band.top` (nem além do topo
 * que já tinha, se a configuração já o punha mais alto); se ainda assim não couber, encolhe até
 * ocupar a faixa. Devolve o centro novo e a escala (≤ 1).
 */
export function fitVertical(cy: number, h: number, band: Band): { cy: number; scale: number } {
  if (h <= 0 || cy + h / 2 <= band.bottom) return { cy, scale: 1 };
  const top = Math.min(cy - h / 2, band.top);
  if (band.bottom - h >= top) return { cy: band.bottom - h / 2, scale: 1 };
  const room = Math.max(0, band.bottom - top);
  return { cy: top + room / 2, scale: room / h };
}
