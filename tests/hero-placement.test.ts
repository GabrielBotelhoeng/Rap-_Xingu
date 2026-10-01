import { describe, expect, it } from "vitest";
import {
  WORD_INK,
  boxExtents,
  pairCenters,
  pairExtents,
  perWidth,
  stackLayout,
  wordVisible,
  type StackInput,
} from "../src/hero/placement";

const PAIR = { lid: 1.04, gap: -0.015 };

describe("pairCenters (lata e tampa abertas lado a lado)", () => {
  it("centra a composição em 0 e põe a tampa encostada na lata", () => {
    const c = pairCenters(PAIR);
    // da borda esquerda da lata à borda direita da tampa
    expect(c.tin - 0.5).toBeCloseTo(-c.width / 2);
    expect(c.lid + PAIR.lid / 2).toBeCloseTo(c.width / 2);
    // distância entre os centros = soma dos raios + folga
    expect(c.lid - c.tin).toBeCloseTo(0.5 + PAIR.lid / 2 + PAIR.gap);
  });
});

describe("pairExtents / boxExtents (produto girado)", () => {
  it("sem giro: metade da tampa para cima e para baixo, metade da largura para os lados", () => {
    const e = pairExtents(PAIR, 0);
    expect(e.up).toBeCloseTo(PAIR.lid / 2);
    expect(e.down).toBeCloseTo(PAIR.lid / 2);
    expect(e.half).toBeCloseTo(pairCenters(PAIR).width / 2);
  });

  it("giro horário sobe a lata (esquerda) e desce a tampa (direita)", () => {
    const e = pairExtents(PAIR, 6);
    const c = pairCenters(PAIR);
    const sin = Math.sin((6 * Math.PI) / 180);
    expect(e.up).toBeCloseTo(0.5 - c.tin * sin);
    expect(e.down).toBeCloseTo(PAIR.lid / 2 + c.lid * sin);
  });

  it("retângulo girado 90° troca largura e altura", () => {
    const e = boxExtents(2, 1, 90);
    expect(e.up).toBeCloseTo(1);
    expect(e.half).toBeCloseTo(0.5);
  });

  it("perWidth divide tudo pela largura", () => {
    expect(perWidth({ up: 1, down: 2, half: 4 }, 2)).toEqual({ up: 0.5, down: 1, half: 2 });
  });
});

const ext = perWidth(pairExtents(PAIR, 0), pairCenters(PAIR).width);
const base: StackInput = {
  top: 80,
  bottom: 820,
  width: 660,
  wordAspect: 2.1,
  maxFont: 380,
  productWidth: 600,
  extents: ext,
  overlap: 0.16,
  float: 8,
  minScale: 0.6,
};
const inkTopOf = (L: ReturnType<typeof stackLayout>) =>
  L.wordCy - (WORD_INK.box * L.fontSize) / 2 + WORD_INK.top * L.fontSize;
const productTopOf = (L: ReturnType<typeof stackLayout>, i: StackInput) => L.productCy - i.extents.up * L.productWidth;
const productBottomOf = (L: ReturnType<typeof stackLayout>, i: StackInput) => L.productCy + i.extents.down * L.productWidth;

describe("stackLayout (palavra em cima, produto embaixo)", () => {
  it("a palavra ocupa a largura livre e o produto fica com o tamanho pedido quando cabe", () => {
    const L = stackLayout(base);
    expect(L.fontSize * base.wordAspect).toBeCloseTo(660);
    expect(L.productWidth).toBeCloseTo(600);
  });

  it("o produto cobre no máximo `overlap` da palavra, mesmo no alto da flutuação", () => {
    for (const input of [base, { ...base, bottom: 560 }, { ...base, top: 64, bottom: 380, width: 360, maxFont: 160 }]) {
      const L = stackLayout(input);
      const highest = productTopOf(L, input) - input.float;
      expect(wordVisible(L, highest)).toBeGreaterThanOrEqual(1 - input.overlap - 1e-6);
    }
  });

  it("a pilha fica dentro da faixa e centrada nela", () => {
    const L = stackLayout(base);
    const top = inkTopOf(L);
    const bottom = productBottomOf(L, base);
    expect(top).toBeGreaterThanOrEqual(base.top - 1e-6);
    expect(bottom).toBeLessThanOrEqual(base.bottom + 1e-6);
    expect(top - base.top).toBeCloseTo(base.bottom - bottom);
  });

  it("sem espaço, encolhe primeiro o produto (até minScale) e mantém a palavra", () => {
    const tight = { ...base, bottom: 560 };
    const L = stackLayout(tight);
    expect(L.fontSize * base.wordAspect).toBeCloseTo(660);
    expect(L.productWidth).toBeLessThan(600);
    expect(L.productWidth).toBeGreaterThanOrEqual(600 * base.minScale - 1e-6);
    expect(productBottomOf(L, tight)).toBeCloseTo(tight.bottom);
  });

  it("com muito pouco espaço, encolhe palavra e produto juntos e ainda cabe", () => {
    const tiny = { ...base, bottom: 300 };
    const L = stackLayout(tiny);
    expect(L.fontSize * base.wordAspect).toBeLessThan(660);
    expect(L.productWidth).toBeLessThan(600 * base.minScale);
    expect(inkTopOf(L)).toBeGreaterThanOrEqual(tiny.top - 1e-6);
    expect(productBottomOf(L, tiny)).toBeLessThanOrEqual(tiny.bottom + 1e-6);
  });

  it("respeita a largura: produto mais largo que a faixa encolhe até caber", () => {
    const narrow = { ...base, width: 400, productWidth: 900 };
    const L = stackLayout(narrow);
    expect(2 * narrow.extents.half * L.productWidth).toBeLessThanOrEqual(400 + 1e-6);
  });

  it("faixa vazia não quebra", () => {
    const L = stackLayout({ ...base, top: 500, bottom: 400 });
    expect(L.fontSize).toBe(0);
    expect(L.productWidth).toBe(0);
  });
});
