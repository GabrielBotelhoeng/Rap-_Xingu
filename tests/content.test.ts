import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { IndexHtmlTransformHook } from "vite";
import { contentPlugin } from "../build/content-plugin";
import { FLAVORS, LINE_ORDER, filterFlavors, flavorById } from "../src/content/catalog";
import { HERBS, herbSrc } from "../src/content/herbs";
import { esc, renderCatalogCards, renderDestaques, renderFlavorOptions, renderJsonLd, withPlaceholders } from "../src/content/render";
import { DESTAQUES_CONFIG } from "../src/destaques/destaques.config";
import { HERO_CONFIG } from "../src/hero/hero.config";

const root = fileURLToPath(new URL("..", import.meta.url));
const publicFile = (src: string) => resolve(root, "public", src.replace(/^\//, ""));

describe("catálogo (copy › Catálogo)", () => {
  it("tem os 14 sabores da copy, com ids únicos", () => {
    expect(FLAVORS).toHaveLength(14);
    expect(new Set(FLAVORS.map((f) => f.id)).size).toBe(14);
  });

  it("toda linha do filtro tem sabor", () => {
    for (const line of LINE_ORDER) expect(filterFlavors(FLAVORS, line).length).toBeGreaterThan(0);
    expect(filterFlavors(FLAVORS, "todos")).toHaveLength(14);
    expect(filterFlavors(FLAVORS, "joao-de-barro").map((f) => f.name)).toEqual(["Sete Ervas"]);
  });

  it("nenhuma composição faz alegação de saúde", () => {
    const banned = /cura|trata|desintox|terap|medicin|sinusite|limpeza/i;
    for (const f of FLAVORS) expect(f.composition ?? "").not.toMatch(banned);
  });

  it("as fotos existem em public/", () => {
    for (const f of FLAVORS) if (f.photo) expect(existsSync(publicFile(f.photo.src)), f.photo.src).toBe(true);
  });
});

describe("destaques e hero", () => {
  it("destaques apontam para sabores do catálogo e para ervas recortadas", () => {
    for (const item of DESTAQUES_CONFIG.items) {
      expect(flavorById(item.flavorId), item.flavorId).toBeDefined();
      expect(item.herbs.length).toBeLessThanOrEqual(6);
      for (const h of item.herbs) {
        expect(HERBS[h]).toBeDefined();
        expect(existsSync(publicFile(herbSrc(h))), h).toBe(true);
      }
      if (item.lid) expect(existsSync(publicFile(item.lid.src))).toBe(true);
    }
    expect(existsSync(publicFile(DESTAQUES_CONFIG.openTin.src))).toBe(true);
  });

  it("slides do hero têm imagem e posição válidas", () => {
    expect(HERO_CONFIG.slides.length).toBeGreaterThan(1);
    for (const s of HERO_CONFIG.slides) {
      expect(existsSync(publicFile(s.image.src)), s.image.src).toBe(true);
      expect(s.product.size).toBeGreaterThan(0);
      expect(s.colors.from).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe("render", () => {
  it("escapa HTML e marca [placeholders]", () => {
    expect(esc(`<a href="x">'&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
    expect(withPlaceholders("Há [25] anos")).toBe('Há <span class="tbc">[25]</span> anos');
  });

  it("gera um card por sabor e latinha provisória para quem não tem foto", () => {
    const html = renderCatalogCards();
    expect(html.match(/<li class="card"/g)).toHaveLength(14);
    expect(html.match(/class="tin-ph /g)).toHaveLength(FLAVORS.filter((f) => !f.photo).length);
    expect(html).toContain("[a confirmar]");
    expect(html.match(/data-pick="/g)).toHaveLength(14);
  });

  it("gera as opções de sabor do formulário", () => {
    expect(renderFlavorOptions().match(/type="checkbox"/g)).toHaveLength(14);
  });

  it("gera os destaques com o texto da copy", () => {
    const html = renderDestaques();
    expect(html).not.toContain("Os mais pedidos"); // o título fica no index.html
    expect(html.match(/data-dq-item="/g)).toHaveLength(3);
    expect(html).toContain("Quero revender este sabor");
    expect(html).toContain("Latinha de 10g · caixa com 12");
  });

  it("JSON-LD LocalBusiness com o endereço de Alexânia", () => {
    const tag = renderJsonLd("https://exemplo.com.br");
    const data = JSON.parse(tag.replace(/^<script[^>]*>|<\/script>$/g, ""));
    expect(data["@type"]).toBe("LocalBusiness");
    expect(data.address.addressLocality).toBe("Alexânia");
    expect(data.address.postalCode).toBe("72930-000");
    expect(data.image).toBe("https://exemplo.com.br/og.jpg");
  });
});

describe("plugin de conteúdo", () => {
  it("preenche todos os marcadores do index.html", async () => {
    const html = readFileSync(resolve(root, "index.html"), "utf8");
    const plugin = contentPlugin({ siteUrl: "https://exemplo.com.br/" });
    const hook = plugin.transformIndexHtml as { handler: IndexHtmlTransformHook };
    const out = (await hook.handler.call({} as never, html, {} as never)) as string;
    expect(out).not.toMatch(/<!--@|\{\{/);
    expect(out).toContain('content="https://exemplo.com.br/og.jpg"');
    expect(out).toContain("Eucaliptu’s Selva");
  });
});
