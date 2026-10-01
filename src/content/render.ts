/**
 * Renderização em tempo de build (plugin do Vite em build/content-plugin.ts).
 * Gera HTML estático a partir dos dados, para o conteúdo já chegar pronto no HTML.
 * Este módulo roda no Node: nada de window/document aqui.
 */
import { FLAVORS, LINES, PENDING_COMPOSITION, type Flavor, type Photo } from "./catalog.ts";
import { SITE, ADDRESS_LINE } from "./site.ts";
import { DESTAQUES_CONFIG, DESTAQUE_FORMAT, type DestaqueItem } from "../destaques/destaques.config.ts";
import { HERO_CONFIG, type Floater } from "../hero/hero.config.ts";
import { PRODUCTS, lidRatio, type ProductId } from "./products.ts";
import { OPEN_GAP, pairCenters } from "../hero/placement.ts";

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c] ?? c);

/** Texto entre [colchetes] ainda depende do dono: fica visível e marcado. */
export const withPlaceholders = (s: string) => esc(s).replace(/\[([^\]]+)\]/g, '<span class="tbc">[$1]</span>');

const img = (p: Photo, alt: string, cls: string, lazy = true) =>
  `<img class="${cls}" src="${p.src}" width="${p.width}" height="${p.height}" alt="${esc(alt)}"${
    lazy ? ' loading="lazy"' : ""
  } decoding="async">`;

/** Latinha provisória (aro dourado + cor da linha) enquanto a foto real não chega. */
export function tinPlaceholder(f: Pick<Flavor, "name" | "tint">, cls = ""): string {
  return `<div class="tin-ph ${cls}" style="--tint:${f.tint}" role="img" aria-label="${esc(
    `${f.name}: foto da latinha a confirmar`,
  )}"><span class="tin-ph__name">${esc(f.name)}</span><span class="tin-ph__note">[foto da latinha]</span></div>`;
}

const ARROW =
  '<svg class="icon" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M4 10h11m-4.5-4.5L15 10l-4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function renderCatalogCards(flavors: readonly Flavor[] = FLAVORS): string {
  return flavors
    .map((f) => {
      const media = f.photo
        ? img(f.photo, `Tampa da latinha de rapé ${f.name}`, "card__photo")
        : tinPlaceholder(f, "card__ph");
      const badges = [
        f.bestSeller ? '<span class="badge badge--accent">Mais vendido</span>' : "",
        `<span class="badge badge--oliva">${esc(LINES[f.line])}</span>`,
      ].join("");
      const comp = f.composition ? esc(f.composition) : withPlaceholders(PENDING_COMPOSITION);
      return `<li class="card" data-line="${f.line}">
  <div class="card__tin">${media}</div>
  <div class="card__body">
    <div class="card__badges">${badges}</div>
    <h3 class="card__name">${esc(f.name)}</h3>
    <p class="card__comp">${comp}</p>
    <a class="card__cta" href="#revenda" data-pick="${f.id}">Pedir no WhatsApp ${ARROW}</a>
  </div>
</li>`;
    })
    .join("\n");
}

export function renderFlavorOptions(flavors: readonly Flavor[] = FLAVORS): string {
  return flavors
    .map(
      (f) =>
        `<label class="chip"><input type="checkbox" name="sabores" value="${esc(f.name)}" data-flavor="${f.id}"><span>${esc(
          f.name,
        )}</span></label>`,
    )
    .join("\n");
}

/** Lata + tampa abertas lado a lado, em % da caixa (o JS só desliza as duas para o centro e de volta). */
function pairMarkup(id: ProductId, cls: string, sizes: { tin: string; lid: string }): string {
  const p = PRODUCTS[id];
  const lid = lidRatio(p);
  const c = pairCenters({ lid, gap: OPEN_GAP });
  const pct = (v: number) => `${(v * 100).toFixed(3)}%`;
  const srcset = (sm: string, big: string, w: number) => `/${sm} ${Math.round(w / 2)}w, /${big} ${w}w`;
  // posição de cada peça aberta; data-closed = deslocamento (xPercent) que a leva para o centro: lata fechada
  const tinStyle = `left:${pct((c.tin + c.width / 2 - 0.5) / c.width)};top:${pct((lid - 1) / 2 / lid)};width:${pct(1 / c.width)}`;
  const lidStyle = `left:${pct((c.lid + c.width / 2 - lid / 2) / c.width)};top:0;width:${pct(lid / c.width)}`;
  return `<div class="${cls}__pair" style="aspect-ratio:${c.width.toFixed(4)} / ${lid.toFixed(4)}" data-dq-pair>
      <img class="${cls}__tin" style="${tinStyle}" data-closed="${(-c.tin * 100).toFixed(2)}" src="/${p.tin}" srcset="${srcset(p.tinSm, p.tin, p.tinPx)}" sizes="${sizes.tin}" width="${p.tinPx}" height="${p.tinPx}" alt="" loading="lazy" decoding="async">
      <img class="${cls}__lid" style="${lidStyle}" data-closed="${((-c.lid / lid) * 100).toFixed(2)}" src="/${p.lid}" srcset="${srcset(p.lidSm, p.lid, p.lidPx)}" sizes="${sizes.lid}" width="${p.lidPx}" height="${p.lidPx}" alt="" loading="lazy" decoding="async">
    </div>`;
}

/** "Os mais pedidos.": um sabor por linha (o título da seção fica no index.html). */
export function renderDestaques(items: readonly DestaqueItem[] = DESTAQUES_CONFIG.items): string {
  const sizes = { tin: "(max-width: 900px) 44vw, min(23vw, 300px)", lid: "(max-width: 900px) 46vw, min(24vw, 312px)" };
  const rows = items.map((it, i) => {
    const support = it.support ? `\n    <p class="dq-item__support">${esc(it.support)}</p>` : "";
    return `<li class="dq-item" style="--glow:${it.glow}" data-dq-item>
  <div class="dq-item__stage" aria-hidden="true">
    <div class="dq-item__glow"></div>
    <div class="dq-item__float">
    ${pairMarkup(it.product, "dq-item", sizes)}
    </div>
    <canvas class="dq-item__dust" data-dq-dust></canvas>
  </div>
  <div class="dq-item__copy" data-dq-copy>
    <p class="dq-item__eyebrow"><span class="dq-item__num">${String(i + 1).padStart(2, "0")}</span><span class="eyebrow">${esc(it.eyebrow)}</span></p>
    <h3 class="dq-item__name" id="dq-name-${i}">${esc(it.title)}</h3>${support}
    <p class="dq-item__comp">${esc(it.composition)}</p>
    <p class="dq-item__format">${esc(DESTAQUE_FORMAT)}</p>
    <a class="btn btn--primary dq-item__cta" href="#revenda" data-pick="${it.flavorId}">Quero revender este sabor</a>
  </div>
</li>`;
  });
  return `<ol class="dq__list">\n${rows.join("\n")}\n</ol>`;
}

/** Primeiro slide já no HTML (sem JS ainda, o hero não fica vazio): valores dos marcadores {{hero.*}}. */
export function heroInitial(): Record<string, string> {
  const s = HERO_CONFIG.slides[0]!;
  if (s.product.kind !== "pair") throw new Error("[hero] o primeiro slide precisa ser uma lata (lata + tampa)");
  const p = PRODUCTS[s.product.id];
  const srcset = (sm: string, big: string, w: number) => `/${sm} ${Math.round(w / 2)}w, /${big} ${w}w`;
  return {
    "hero.word": esc(s.word),
    "hero.line": esc(s.line),
    "hero.name": esc(s.name),
    "hero.comp": withPlaceholders(s.composition),
    "hero.tin": `/${p.tin}`,
    "hero.tinSrcset": srcset(p.tinSm, p.tin, p.tinPx),
    "hero.tinPx": String(p.tinPx),
    "hero.lid": `/${p.lid}`,
    "hero.lidSrcset": srcset(p.lidSm, p.lid, p.lidPx),
    "hero.lidPx": String(p.lidPx),
  };
}

/** Fundo flutuante do hero, em três camadas de profundidade (o movimento fica em hero/floaters.ts). */
export function renderHeroFloaters(floaters: readonly Floater[] = HERO_CONFIG.floaters): string {
  const layers = [0, 1, 2].map((depth) => {
    const items = floaters
      .filter((f) => f.depth === depth)
      .map((f, i) => {
        const m = f.mobile;
        const vars = [
          `--x:${f.x}%`,
          `--y:${f.y}%`,
          `--s:${f.size}`,
          `--r:${f.rotate}deg`,
          `--i:${i}`,
          ...(m ? [`--mx:${m.x}%`, `--my:${m.y}%`, `--ms:${m.size}`] : []),
        ].join(";");
        const cls = m === false ? "fl fl--desk" : "fl";
        return `<span class="${cls}" style="${vars}"><img src="/${f.src}" width="${f.width}" height="${f.height}" alt="" decoding="async" fetchpriority="low"></span>`;
      });
    return `<div class="hero__fl-layer" data-fl-layer="${depth}"><div class="hero__fl-inner">${items.join("")}</div></div>`;
  });
  return `<div class="hero__floaters" aria-hidden="true" data-hero-floaters>${layers.join("")}</div>`;
}

export function renderJsonLd(siteUrl: string): string {
  const url = siteUrl ? `${siteUrl.replace(/\/$/, "")}/` : undefined;
  const data = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: SITE.name,
    legalName: SITE.legalName,
    taxID: SITE.cnpj,
    slogan: SITE.slogan,
    description: "Fábrica de rapé em Alexânia, Goiás.",
    ...(url ? { url, image: `${url}og.jpg` } : {}),
    telephone: `+${SITE.whatsapp.main.e164}`,
    email: SITE.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.address.street,
      addressLocality: SITE.address.city,
      addressRegion: SITE.address.region,
      postalCode: SITE.address.postalCode,
      addressCountry: SITE.address.country,
    },
    contactPoint: [SITE.whatsapp.main, SITE.whatsapp.alt].map((p) => ({
      "@type": "ContactPoint",
      telephone: `+${p.e164}`,
      contactType: "sales",
      areaServed: "BR",
      availableLanguage: "pt-BR",
    })),
  };
  // "<" escapado para o JSON não fechar a tag <script> por acidente
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
}

export { ADDRESS_LINE };
