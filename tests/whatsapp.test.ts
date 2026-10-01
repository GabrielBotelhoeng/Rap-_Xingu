import { describe, expect, it } from "vitest";
import {
  buildRevendaMessage,
  formatCNPJ,
  formatPhoneBR,
  isValidCNPJ,
  isValidPhoneBR,
  joinList,
  waLink,
} from "../src/lib/whatsapp";

describe("joinList", () => {
  it("junta com vírgulas e 'e' no último", () => {
    expect(joinList([])).toBe("");
    expect(joinList(["Cravo"])).toBe("Cravo");
    expect(joinList(["Cravo", "Laranja"])).toBe("Cravo e Laranja");
    expect(joinList(["Cravo", "Laranja", "Morango"])).toBe("Cravo, Laranja e Morango");
  });
});

describe("buildRevendaMessage", () => {
  const base = { nome: "João", loja: "Tabacaria Central", cidade: "Anápolis – GO", whatsapp: "", sabores: [] as string[] };

  it("segue o texto da copy", () => {
    const msg = buildRevendaMessage({ ...base, sabores: ["Super Mentolado", "Puro Tabaco"] });
    expect(msg).toBe(
      "Olá! Sou João, da Tabacaria Central, em Anápolis – GO. Quero revender os rapés Xingu. Tenho interesse em: Super Mentolado e Puro Tabaco.",
    );
  });

  it("omite a frase de sabores quando nenhum foi marcado", () => {
    expect(buildRevendaMessage(base)).toBe("Olá! Sou João, da Tabacaria Central, em Anápolis – GO. Quero revender os rapés Xingu.");
  });

  it("acrescenta CNPJ e WhatsApp em linhas próprias e limpa espaços", () => {
    const msg = buildRevendaMessage({ ...base, nome: "  João   Silva ", whatsapp: "(62) 99999-0000", cnpj: "34.565.939/0001-15" });
    expect(msg.split("\n")).toEqual([
      "Olá! Sou João Silva, da Tabacaria Central, em Anápolis – GO. Quero revender os rapés Xingu.",
      "CNPJ: 34.565.939/0001-15",
      "WhatsApp: (62) 99999-0000",
    ]);
  });
});

describe("waLink", () => {
  it("codifica a mensagem para o wa.me", () => {
    expect(waLink("5562994775811")).toBe("https://wa.me/5562994775811");
    const url = waLink("5562994775811", "Olá! Sou João & cia.\nCNPJ: 1");
    expect(url).toBe("https://wa.me/5562994775811?text=Ol%C3%A1!%20Sou%20Jo%C3%A3o%20%26%20cia.%0ACNPJ%3A%201");
    expect(decodeURIComponent(url.split("text=")[1] ?? "")).toBe("Olá! Sou João & cia.\nCNPJ: 1");
  });
});

describe("telefone", () => {
  it("formata enquanto digita", () => {
    expect(formatPhoneBR("")).toBe("");
    expect(formatPhoneBR("6")).toBe("(6");
    expect(formatPhoneBR("62")).toBe("(62");
    expect(formatPhoneBR("62994")).toBe("(62) 994");
    expect(formatPhoneBR("6233334444")).toBe("(62) 3333-4444");
    expect(formatPhoneBR("62994775811")).toBe("(62) 99477-5811");
    expect(formatPhoneBR("62 99477-5811 999")).toBe("(62) 99477-5811");
  });

  it("valida celular com 9 e fixo com 10 dígitos", () => {
    expect(isValidPhoneBR("(62) 99477-5811")).toBe(true);
    expect(isValidPhoneBR("(62) 3333-4444")).toBe(true);
    expect(isValidPhoneBR("(62) 89477-5811")).toBe(false);
    expect(isValidPhoneBR("(62) 9947")).toBe(false);
    expect(isValidPhoneBR("(02) 99477-5811")).toBe(false);
  });
});

describe("CNPJ", () => {
  it("formata enquanto digita", () => {
    expect(formatCNPJ("34")).toBe("34");
    expect(formatCNPJ("34565")).toBe("34.565");
    expect(formatCNPJ("34565939")).toBe("34.565.939");
    expect(formatCNPJ("345659390001")).toBe("34.565.939/0001");
    expect(formatCNPJ("34565939000115")).toBe("34.565.939/0001-15");
  });

  it("confere os dígitos verificadores", () => {
    expect(isValidCNPJ("34.565.939/0001-15")).toBe(true); // CNPJ da Fumopil
    expect(isValidCNPJ("34.565.939/0001-16")).toBe(false);
    expect(isValidCNPJ("11.111.111/1111-11")).toBe(false);
    expect(isValidCNPJ("123")).toBe(false);
  });
});
