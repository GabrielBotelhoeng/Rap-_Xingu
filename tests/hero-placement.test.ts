import { describe, expect, it } from "vitest";
import { fitVertical, fitWidth, pivotShift } from "../src/hero/placement";

const place = (x: number, size: number) => ({ x, y: 0, rotate: 0, size });

describe("pivotShift (giro em volta do centro da caixa, não da imagem)", () => {
  it("sem giro não desloca", () => {
    const { dx, dy } = pivotShift(200, 180, 0);
    expect(dx).toBeCloseTo(0);
    expect(dy).toBeCloseTo(0);
  });

  it("bate com o medido no navegador: 187×184 px a 22° → +41 px, −28 px", () => {
    const { dx, dy } = pivotShift(187, 184, 22);
    expect(dx).toBeCloseTo(41.3, 0);
    expect(dy).toBeCloseTo(-28.3, 0);
  });

  it("giro anti-horário desloca para o outro lado e cresce com o tamanho", () => {
    const a = pivotShift(100, 100, -8);
    const b = pivotShift(200, 200, -8);
    expect(a.dy).toBeGreaterThan(0);
    expect(b.dx).toBeCloseTo(a.dx * 2);
    expect(b.dy).toBeCloseTo(a.dy * 2);
  });
});

describe("fitWidth (produto entre o painel e o seletor)", () => {
  it("mantém o que já cabe", () => {
    const p = place(2, 50);
    expect(fitWidth(p, 54)).toBe(p);
    expect(fitWidth(p, 80)).toBe(p);
  });

  it("encolhe tamanho e deslocamento juntos até caber", () => {
    const fit = fitWidth(place(9, 36), 50);
    expect(2 * Math.abs(fit.x) + fit.size).toBeCloseTo(50);
    expect(fit.x / fit.size).toBeCloseTo(9 / 36);
    expect(fit.rotate).toBe(0);
  });

  it("vale para deslocamento negativo e para largura livre nula", () => {
    const fit = fitWidth(place(-2, 40), 22);
    expect(fit.x).toBeLessThan(0);
    expect(2 * Math.abs(fit.x) + fit.size).toBeCloseTo(22);
    expect(fitWidth(place(0, 62), -10).size).toBe(0);
  });

  it("conta o deslocamento visível do giro, que encolhe junto", () => {
    // centro visível 8 à direita: 2·8 + 40 = 56 > 50
    const fit = fitWidth(place(0, 40), 50, 8);
    const k = fit.size / 40;
    expect(2 * Math.abs(fit.x + 8 * k) + fit.size).toBeCloseTo(50);
    // o mesmo produto sem giro cabe
    expect(fitWidth(place(0, 40), 50)).toEqual(place(0, 40));
  });
});

describe("fitVertical (produto acima do painel de textos)", () => {
  it("não mexe quando a base já cabe", () => {
    expect(fitVertical(300, 200, { top: 150, bottom: 400 })).toEqual({ cy: 300, scale: 1 });
  });

  it("sobe até a base caber, se houver espaço em cima", () => {
    expect(fitVertical(300, 200, { top: 150, bottom: 380 })).toEqual({ cy: 280, scale: 1 });
  });

  it("encolhe para caber na faixa quando subir não basta", () => {
    const fit = fitVertical(300, 200, { top: 190, bottom: 330 });
    expect(fit.scale).toBeCloseTo(0.7);
    expect(fit.cy - (200 * fit.scale) / 2).toBeCloseTo(190);
    expect(fit.cy + (200 * fit.scale) / 2).toBeCloseTo(330);
  });

  it("não sobe além do topo que a configuração já dava", () => {
    // topo configurado (150) acima do limite (190): o topo fica, só a base recua
    const fit = fitVertical(250, 200, { top: 190, bottom: 330 });
    expect(fit.cy - (200 * fit.scale) / 2).toBeCloseTo(150);
    expect(fit.cy + (200 * fit.scale) / 2).toBeCloseTo(330);
  });

  it("aguenta faixa sem espaço e altura zero", () => {
    // painel acima do topo do produto: não sobra nada
    expect(fitVertical(300, 200, { top: 400, bottom: 150 }).scale).toBe(0);
    // faixa invertida: o produto fica entre o próprio topo (200) e o painel (250)
    const fit = fitVertical(300, 200, { top: 400, bottom: 250 });
    expect(fit.cy + (200 * fit.scale) / 2).toBeCloseTo(250);
    expect(fitVertical(300, 0, { top: 0, bottom: 10 })).toEqual({ cy: 300, scale: 1 });
  });
});
