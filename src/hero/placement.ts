/* Encaixe da palavra e do produto do hero (funções puras; testes em tests/hero-placement.test.ts).
   A palavra fica em cima e o produto embaixo, encostando só na base das letras: o produto cobre no
   máximo `overlap` da altura da palavra, contando a flutuação — assim a palavra sempre se lê.
   Se a pilha não couber na faixa livre, o produto encolhe primeiro (até `minScale`) e depois os dois. */

/** Big Shoulders Display 900 com line-height 0.8: a tinta das maiúsculas começa 0,015 em acima do topo
    da caixa e tem 0,8 em de altura (ascent 1968, descent 426 e capHeight 1600 em 2000 unidades). */
export const WORD_INK = { top: -0.015, height: 0.8, box: 0.8 } as const;

/** Tampa aberta encostando na lata, sobrepondo um fio como na foto (em diâmetros da lata). */
export const OPEN_GAP = -0.015;

/** Lata (esquerda) e tampa (direita) abertas lado a lado, em diâmetros da lata. */
export interface PairGeometry {
  /** Diâmetro da tampa (a tampa encaixa por fora: um pouco maior que a lata). */
  lid: number;
  /** Folga entre as bordas quando aberta; negativa = a tampa sobrepõe a lata. */
  gap: number;
}

/** Centros (x) da lata e da tampa abertas e a largura da composição, com o centro dela em 0. */
export function pairCenters(g: PairGeometry): { tin: number; lid: number; width: number } {
  const dist = 0.5 + g.lid / 2 + g.gap;
  const width = 0.5 + dist + g.lid / 2;
  const tin = 0.5 - width / 2;
  return { tin, lid: tin + dist, width };
}

/** Quanto o produto se estende a partir do centro (para cima, para baixo e para cada lado). */
export interface Extents {
  up: number;
  down: number;
  half: number;
}

/** Composição aberta girada (graus, horário como no CSS), em diâmetros da lata. São dois círculos:
    o giro não aumenta cada peça, só sobe uma e desce a outra. */
export function pairExtents(g: PairGeometry, deg: number): Extents {
  const { tin, lid } = pairCenters(g);
  const r = (deg * Math.PI) / 180;
  const sin = Math.sin(r);
  const cos = Math.cos(r);
  let up = 0;
  let down = 0;
  let half = 0;
  for (const k of [
    { x: tin, rad: 0.5 },
    { x: lid, rad: g.lid / 2 },
  ]) {
    up = Math.max(up, k.rad - k.x * sin);
    down = Math.max(down, k.rad + k.x * sin);
    half = Math.max(half, Math.abs(k.x * cos) + k.rad);
  }
  return { up, down, half };
}

/** Imagem retangular w×h girada (graus), na unidade de w e h. */
export function boxExtents(w: number, h: number, deg: number): Extents {
  const r = (deg * Math.PI) / 180;
  const sin = Math.abs(Math.sin(r));
  const cos = Math.abs(Math.cos(r));
  const v = (w * sin + h * cos) / 2;
  return { up: v, down: v, half: (w * cos + h * sin) / 2 };
}

/** Extents por unidade de largura da composição (útil para escalar pela largura em px). */
export function perWidth(e: Extents, width: number): Extents {
  return { up: e.up / width, down: e.down / width, half: e.half / width };
}

export interface StackInput {
  /** Faixa vertical livre, em px a partir do topo do hero. */
  top: number;
  bottom: number;
  /** Largura livre para a palavra e o produto (px). */
  width: number;
  /** Largura da palavra dividida pelo font-size (medido no navegador). */
  wordAspect: number;
  /** Maior font-size permitido (px). */
  maxFont: number;
  /** Largura desejada do produto (px). */
  productWidth: number;
  /** Extents do produto por px de largura (ver perWidth). */
  extents: Extents;
  /** Fração da altura da palavra que o produto pode cobrir (0–1). */
  overlap: number;
  /** Quanto a flutuação sobe o produto (px). */
  float: number;
  /** Menor escala do produto antes de encolher também a palavra (0–1). */
  minScale: number;
}

export interface StackLayout {
  fontSize: number;
  /** Centro da caixa da palavra, em px a partir do topo do hero. */
  wordCy: number;
  productWidth: number;
  /** Centro do produto, em px a partir do topo do hero. */
  productCy: number;
}

const coverOf = (i: StackInput, font: number) => Math.max(0, i.overlap * WORD_INK.height * font - i.float);
const heightOf = (i: StackInput, font: number, pw: number) =>
  WORD_INK.height * font - coverOf(i, font) + (i.extents.up + i.extents.down) * pw;

/** Maior valor entre lo e hi para o qual ok() vale (ok(lo) precisa valer). */
function bisect(lo: number, hi: number, ok: (v: number) => boolean): number {
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (ok(mid)) lo = mid;
    else hi = mid;
  }
  return lo;
}

/** Palavra em cima, produto embaixo encostando na base das letras, a pilha centrada na faixa. */
export function stackLayout(i: StackInput): StackLayout {
  const avail = Math.max(0, i.bottom - i.top);
  let font = Math.max(0, Math.min(i.width / Math.max(i.wordAspect, 0.01), i.maxFont));
  let pw = Math.max(0, Math.min(i.productWidth, i.width / Math.max(2 * i.extents.half, 0.01)));

  const fits = (f: number, p: number) => heightOf(i, f, p) <= avail;
  if (!fits(font, pw)) {
    const pMin = pw * i.minScale;
    if (fits(font, pMin)) {
      pw = bisect(pMin, pw, (p) => fits(font, p));
    } else {
      const k = fits(0, 0) ? bisect(0, 1, (s) => fits(font * s, pMin * s)) : 0;
      font *= k;
      pw = pMin * k;
    }
  }

  const inkTop = i.top + (avail - heightOf(i, font, pw)) / 2;
  const boxTop = inkTop - WORD_INK.top * font;
  const productTop = inkTop + WORD_INK.height * font - coverOf(i, font);
  return {
    fontSize: font,
    wordCy: boxTop + (WORD_INK.box * font) / 2,
    productWidth: pw,
    productCy: productTop + i.extents.up * pw,
  };
}

/** Quanto do topo da tinta da palavra fica livre do produto (0–1), dado o topo mais alto do produto. */
export function wordVisible(layout: StackLayout, productTop: number): number {
  const inkTop = layout.wordCy - (WORD_INK.box * layout.fontSize) / 2 + WORD_INK.top * layout.fontSize;
  const h = WORD_INK.height * layout.fontSize;
  if (h <= 0) return 1;
  return Math.min(1, Math.max(0, (productTop - inkTop) / h));
}
