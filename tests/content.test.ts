import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { IndexHtmlTransformHook } from "vite";
import { contentPlugin } from "../build/content-plugin";
import { FLAVORS, LINE_ORDER, filterFlavors, flavorById } from "../src/content/catalog";
import { PRODUCTS } from "../src/content/products";
import {
  esc,
  heroInitial,
  renderCatalogCards,
  renderDestaques,
  renderFlavorOptions,
  renderHeroFloaters,
  renderJsonLd,
  withPlaceholders,
} from "../src/content/render";
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
  it("destaques apontam para sabores do catálogo com fotos padronizadas", () => {
    expect(DESTAQUES_CONFIG.items.length).toBeGreaterThan(0);
    for (const item of DESTAQUES_CONFIG.items) {
      expect(flavorById(item.flavorId), item.flavorId).toBeDefined();
      const p = PRODUCTS[item.product];
      for (const f of [p.tin, p.tinSm, p.lid, p.lidSm]) expect(existsSync(publicFile(f)), f).toBe(true);
      expect(item.glow).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("slides do hero têm fotos, tamanho e cores válidos", () => {
    expect(HERO_CONFIG.slides.length).toBeGreaterThan(1);
    expect(HERO_CONFIG.slides[0]?.product.kind).toBe("pair"); // o 1º slide vem no HTML como lata + tampa
    for (const s of HERO_CONFIG.slides) {
      const p = s.product;
      const files =
        p.kind === "pair"
          ? [PRODUCTS[p.id].tin, PRODUCTS[p.id].tinSm, PRODUCTS[p.id].lid, PRODUCTS[p.id].lidSm]
          : [p.src, p.srcSm];
      for (const f of files) expect(existsSync(publicFile(f)), f).toBe(true);
      expect(s.size).toBeGreaterThan(0);
      expect(s.sizeMobile).toBeGreaterThan(0);
      expect(s.colors.from).toMatch(/^#[0-9a-f]{6}$/i);
      expect(s.dust).toMatch(/^\d+,\d+,\d+$/);
    }
  });

  it("o fundo flutuante usa arquivos que existem e só ervas, folhas e latinhas reais", () => {
    expect(HERO_CONFIG.floaters.length).toBeGreaterThan(5);
    for (const f of HERO_CONFIG.floaters) {
      expect(existsSync(publicFile(f.src)), f.src).toBe(true);
      expect(f.src).toMatch(/^img\/(fundo|produtos)\//);
    }
    expect(HERO_CONFIG.floaters.some((f) => f.mobile !== false)).toBe(true);
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

  it("gera os destaques com o texto da copy, sem pin e com a latinha já aberta no HTML", () => {
    const html = renderDestaques();
    const n = DESTAQUES_CONFIG.items.length;
    expect(html).not.toContain("Os mais pedidos"); // o título fica no index.html
    expect(html.match(/data-dq-item>/g)).toHaveLength(n);
    expect(html.match(/Quero revender este sabor/g)).toHaveLength(n);
    expect(html).toContain("Latinha de 10g · caixa com 12");
    expect(html).toContain("Mentol intenso sobre um fundo de cravo e alecrim.");
    // lata e tampa com a posição aberta no style e o deslocamento para fechar em data-closed
    expect(html.match(/class="dq-item__tin" style="left:[\d.]+%;top:[\d.]+%;width:[\d.]+%" data-closed="[\d.-]+"/g)).toHaveLength(n);
    expect(html.match(/class="dq-item__lid" style="left:[\d.]+%;top:0;width:[\d.]+%" data-closed="-[\d.]+"/g)).toHaveLength(n);
    // linha de apoio só onde a copy tem
    expect(html.match(/dq-item__support/g)).toHaveLength(DESTAQUES_CONFIG.items.filter((i) => i.support).length);
  });

  it("gera o fundo flutuante do hero em 3 camadas, com os itens só do desktop marcados", () => {
    const html = renderHeroFloaters();
    expect(html.match(/data-fl-layer="/g)).toHaveLength(3);
    expect(html.match(/<span class="fl/g)).toHaveLength(HERO_CONFIG.floaters.length);
    expect(html.match(/class="fl fl--desk"/g)).toHaveLength(HERO_CONFIG.floaters.filter((f) => f.mobile === false).length);
    expect(html).toContain('aria-hidden="true"');
  });

  it("o hero começa no HTML com a palavra, a lata e a tampa do 1º sabor", () => {
    const v = heroInitial();
    expect(v["hero.word"]).toBe("Xingu");
    expect(v["hero.tin"]).toMatch(/^\/img\/produtos\/.+-lata\.webp$/);
    expect(v["hero.lidSrcset"]).toMatch(/-tampa-sm\.webp \d+w, \/img\/produtos\/.+-tampa\.webp \d+w$/);
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
    expect(out).not.toContain('name="robots"');
  });

  it("marca a prévia como noindex só quando pedido (VITE_NOINDEX=1)", async () => {
    const html = readFileSync(resolve(root, "index.html"), "utf8");
    const plugin = contentPlugin({ siteUrl: "", noindex: true });
    const hook = plugin.transformIndexHtml as { handler: IndexHtmlTransformHook };
    const out = (await hook.handler.call({} as never, html, {} as never)) as string;
    expect(out).toContain('<meta name="robots" content="noindex, nofollow" />');
    expect(out.indexOf('name="robots"')).toBeLessThan(out.indexOf("</head>"));
  });
});
