import type { Plugin } from "vite";
import {
  heroInitial,
  renderCatalogCards,
  renderDestaques,
  renderFlavorOptions,
  renderJsonLd,
} from "../src/content/render.ts";
import { DESTAQUES_CONFIG } from "../src/destaques/destaques.config.ts";

interface Options {
  /** URL pública do site (VITE_SITE_URL), usada no og:image e no JSON-LD. */
  siteUrl: string;
  /** Prévia (VITE_NOINDEX=1): pede aos buscadores para não indexar a página nem seguir os links. */
  noindex?: boolean;
}

/**
 * Preenche o index.html com o conteúdo gerado a partir de src/content/.
 * Marcadores: <!--@nome--> (blocos) e {{chave}} (valores). Marcador sem valor quebra o build.
 * Blocos <!--@if destaques--> … <!--@endif--> somem quando DESTAQUES_CONFIG.enabled = false.
 */
export function contentPlugin({ siteUrl, noindex = false }: Options): Plugin {
  return {
    name: "rx-content",
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        const hero = heroInitial();
        const base = siteUrl.replace(/\/$/, "");
        const blocks: Record<string, string> = {
          "catalog-cards": renderCatalogCards(),
          "flavor-options": renderFlavorOptions(),
          destaques: renderDestaques(),
          jsonld: renderJsonLd(base),
          robots: noindex ? '<meta name="robots" content="noindex, nofollow" />' : "",
        };
        const values: Record<string, string> = {
          "hero.line": hero.line,
          "hero.name": hero.name,
          "hero.comp": hero.composition,
          "hero.img": hero.imageSrc,
          "hero.alt": hero.imageAlt,
          "hero.w": hero.imageWidth,
          "hero.h": hero.imageHeight,
          "og.image": base ? `${base}/og.jpg` : "og.jpg",
          "site.url": base ? `${base}/` : "",
        };

        let out = html.replace(/<!--@if destaques-->([\s\S]*?)<!--@endif-->/g, (_, inner: string) =>
          DESTAQUES_CONFIG.enabled ? inner : "",
        );
        out = out.replace(/<!--@([\w-]+)-->/g, (_, key: string) => {
          const block = blocks[key];
          if (block === undefined) throw new Error(`[rx-content] bloco desconhecido: ${key}`);
          return block;
        });
        out = out.replace(/\{\{([\w.]+)\}\}/g, (_, key: string) => {
          const value = values[key];
          if (value === undefined) throw new Error(`[rx-content] valor desconhecido: ${key}`);
          return value;
        });
        return out;
      },
    },
  };
}
