import { describe, expect, it } from "vitest";
import { AGE_KEY, hasConfirmedAge, rememberAge } from "../src/lib/age";
import { frameForProgress, scrollStep, segmentFor, wrapIndex } from "../src/lib/progress";
import { coverRect, frameUrl } from "../src/destaques/frame-sequence";

describe("scrollStep (hero preso por N trechos)", () => {
  it("avança em meio trecho e para no último", () => {
    expect(scrollStep(0, 4)).toBe(0);
    expect(scrollStep(0.12, 4)).toBe(0);
    expect(scrollStep(0.13, 4)).toBe(1);
    expect(scrollStep(0.4, 4)).toBe(2);
    expect(scrollStep(0.7, 4)).toBe(3);
    expect(scrollStep(1, 4)).toBe(3);
    expect(scrollStep(2, 4)).toBe(3);
    expect(scrollStep(-1, 4)).toBe(0);
    expect(scrollStep(0.5, 1)).toBe(0);
  });
});

describe("frameForProgress", () => {
  it("mapeia 0–1 para o primeiro e o último frame", () => {
    expect(frameForProgress(0, 120)).toBe(0);
    expect(frameForProgress(1, 120)).toBe(119);
    expect(frameForProgress(0.5, 3)).toBe(1);
    expect(frameForProgress(1.4, 10)).toBe(9);
    expect(frameForProgress(0.5, 0)).toBe(0);
  });
});

describe("segmentFor", () => {
  it("divide o progresso entre os sabores", () => {
    expect(segmentFor(0, 3)).toEqual({ index: 0, local: 0 });
    expect(segmentFor(0.5, 3).index).toBe(1);
    expect(segmentFor(0.5, 3).local).toBeCloseTo(0.5);
    expect(segmentFor(1, 3)).toEqual({ index: 2, local: 1 });
  });
});

describe("wrapIndex", () => {
  it("dá a volta nos dois sentidos", () => {
    expect(wrapIndex(4, 4)).toBe(0);
    expect(wrapIndex(-1, 4)).toBe(3);
    expect(wrapIndex(9, 4)).toBe(1);
  });
});

describe("frame-sequence", () => {
  it("monta o caminho 0001.webp…", () => {
    expect(frameUrl({ dir: "frames/super-mentolado/desktop/", count: 140 }, 0, "./")).toBe(
      "./frames/super-mentolado/desktop/0001.webp",
    );
    expect(frameUrl({ dir: "frames/x/mobile/", count: 72 }, 71)).toBe("frames/x/mobile/0072.webp");
  });

  it("cover preenche o destino sem distorcer", () => {
    const r = coverRect(1600, 900, 800, 800);
    expect(r.h).toBe(800);
    expect(r.w).toBeCloseTo(1422.2, 1);
    expect(r.x).toBeCloseTo(-311.1, 1);
    expect(r.y).toBe(0);
  });
});

describe("age gate", () => {
  const memory = () => {
    const data = new Map<string, string>();
    return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
  };

  it("guarda e lê a confirmação", () => {
    const s = memory();
    expect(hasConfirmedAge(s)).toBe(false);
    expect(rememberAge(s, new Date("2026-10-01T12:00:00Z"))).toBe(true);
    expect(hasConfirmedAge(s)).toBe(true);
    expect(s.getItem(AGE_KEY)).toBe("2026-10-01T12:00:00.000Z");
  });

  it("não quebra quando o navegador bloqueia o armazenamento", () => {
    const blocked = {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    };
    expect(hasConfirmedAge(blocked)).toBe(false);
    expect(rememberAge(blocked)).toBe(false);
    expect(hasConfirmedAge(null)).toBe(false);
    expect(rememberAge(null)).toBe(false);
  });
});
