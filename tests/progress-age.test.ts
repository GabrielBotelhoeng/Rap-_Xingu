import { describe, expect, it } from "vitest";
import { AGE_KEY, hasConfirmedAge, rememberAge } from "../src/lib/age";
import { scrollStep, wrapIndex } from "../src/lib/progress";

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

describe("wrapIndex", () => {
  it("dá a volta nos dois sentidos", () => {
    expect(wrapIndex(4, 4)).toBe(0);
    expect(wrapIndex(-1, 4)).toBe(3);
    expect(wrapIndex(9, 4)).toBe(1);
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
