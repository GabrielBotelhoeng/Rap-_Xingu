/**
 * Renderização em tempo de build (plugin do Vite em build/content-plugin.ts).
 * Gera HTML estático a partir dos dados, para o conteúdo já chegar pronto no HTML.
 * Este módulo roda no Node: nada de window/document aqui.
 */
import { FLAVORS, LINES, PENDING_COMPOSITION, flavorById, type Flavor, type Photo } from "./catalog.ts";
import { HERBS, herbSrc, type HerbId } from "./herbs.ts";
import { SITE, ADDRESS_LINE } from "./site.ts";
import { DESTAQUES_CONFIG, DESTAQUE_FORMAT, type DestaqueItem } from "../destaques/destaques.config.ts";
import { HERO_CONFIG } from "../hero/hero.config.ts";

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

/** Posições das ervas em volta da latinha (em % do palco). depth: 0 = fundo, 1 = frente. */
const HERB_SLOTS = [
  { x: 14, y: 20, w: 15, r: -24, depth: 0.85 },
  { x: 86, y: 18, w: 13, r: 28, depth: 0.45 },
  { x: 9, y: 70, w: 12, r: 38, depth: 0.35 },
  { x: 88, y: 74, w: 15, r: -32, depth: 0.9 },
  { x: 54, y: 5, w: 10, r: 12, depth: 0.25 },
  { x: 40, y: 95, w: 12, r: -14, depth: 0.6 },
] as const;

function renderHerbs(herbs: readonly HerbId[], index: number): string {
  const tags = herbs.slice(0, HERB_SLOTS.length).map((id, i) => {
    const s = HERB_SLOTS[i]!;
    const h = HERBS[id];
    // o <span> recebe o movimento do scroll; o <img> flutua sozinho via CSS
    return `<span class="dq__herb" style="--x:${s.x}%;--y:${s.y}%;--w:${s.w}%;--r:${s.r}deg;--depth:${s.depth};--i:${i}"><img src="${herbSrc(
      id,
    )}" width="${h.width}" height="${h.height}" alt="" loading="lazy" decoding="async"></span>`;
  });
  return `<div class="dq__herbs" data-dq-herbs="${index}">${tags.join("")}</div>`;
}

function renderLid(item: DestaqueItem, index: number): string {
  const flavor = flavorById(item.flavorId);
  const inner = item.lid
    ? img(item.lid, "", "dq__lid-img")
    : tinPlaceholder({ name: item.title, tint: flavor?.tint ?? "#2F4A2E" }, "dq__lid-ph");
  return `<div class="dq__lid" data-dq-lid="${index}">${inner}</div>`;
}

export function renderDestaques(items: readonly DestaqueItem[] = DESTAQUES_CONFIG.items): string {
  const glows = items
    .map((it, i) => `<div class="dq__glow" data-dq-glow="${i}" style="--glow:${it.glow}"></div>`)
    .join("");
  const herbs = items.map((it, i) => renderHerbs(it.herbs, i)).join("");
  const lids = items.map((it, i) => renderLid(it, i)).join("");
  const copy = items
    .map(
      (it, i) => `<article class="dq__item" data-dq-item="${i}" aria-labelledby="dq-name-${i}">
  <p class="eyebrow dq__eyebrow">${esc(it.eyebrow)}</p>
  <h3 class="dq__name" id="dq-name-${i}">${esc(it.title)}</h3>
  <p class="dq__support">${esc(it.support)}</p>
  <p class="dq__comp">${esc(it.composition)}</p>
  <p class="dq__format">${esc(DESTAQUE_FORMAT)}</p>
  <a class="btn btn--primary dq__cta" href="#revenda" data-pick="${it.flavorId}">Quero revender este sabor</a>
</article>`,
    )
    .join("\n");
  const nav = items
    .map(
      (it, i) =>
        `<li class="dq__nav-item" data-dq-nav="${i}"><span class="dq__nav-num">${String(i + 1).padStart(2, "0")}</span><span class="dq__nav-name">${esc(it.title)}</span></li>`,
    )
    .join("");
  const tin = DESTAQUES_CONFIG.openTin;
  return `<div class="dq__stage" aria-hidden="true">
  ${glows}
  <canvas class="dq__mist" data-dq-mist></canvas>
  ${herbs}
  <div class="dq__tin">
    <img class="dq__base" src="${tin.src}" width="${tin.width}" height="${tin.height}" alt="" loading="lazy" decoding="async">
    <canvas class="dq__seq" data-dq-seq></canvas>
    ${lids}
  </div>
</div>
<div class="dq__copy">
${copy}
</div>
<ol class="dq__nav" aria-label="Destaques">${nav}</ol>`;
}

export interface HeroInitial {
  line: string;
  name: string;
  composition: string;
  imageSrc: string;
  imageAlt: string;
  imageWidth: string;
  imageHeight: string;
}

/** Primeiro slide já no HTML (sem JS ainda, o hero não fica vazio). */
export function heroInitial(): HeroInitial {
  const s = HERO_CONFIG.slides[0]!;
  return {
    line: esc(s.line),
    name: esc(s.name),
    composition: withPlaceholders(s.composition),
    imageSrc: `/${s.image.src}`,
    imageAlt: esc(s.image.alt),
    imageWidth: String(s.image.width),
    imageHeight: String(s.image.height),
  };
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
