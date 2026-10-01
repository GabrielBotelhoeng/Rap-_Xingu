/* =========================================================================
   CONFIGURAÇÃO DO HERO — tudo que muda fica aqui
   (lógica portada de docs/referencias/hero-rape-xingu/index.html)
   -------------------------------------------------------------------------
   holdSeconds        tempo que cada sabor fica parado (depois de abrir)
   transitionSeconds  duração da troca (produto + texto + fundo)
   openSeconds        a tampa desliza e abre a lata depois que o produto pousa
   autoplay           troca sozinha em loop infinito quando ninguém rola a página
   tabletScale        multiplica o tamanho do produto em tablets deitados
   overlap            quanto da altura da palavra o produto pode cobrir (0–1); o resto
                      fica sempre livre, então a palavra se lê em qualquer tela
   scroll             trecho de scroll (em alturas de tela) que avança um sabor
                      enquanto o hero fica preso; depois a página é liberada
   slides[]:
     word         palavra grande acima do produto
     line, name, composition, swatchLabel   textos do painel
     product      { kind: "pair", id } = lata + tampa da foto padronizada (src/content/products.ts)
                  { kind: "image", … } = uma imagem só (slide da fábrica: as tampas em leque)
     colors       from = centro (luz atrás do produto), to = bordas
     swatch       cor da bolinha do seletor
     size         largura do produto aberto, em % da menor dimensão do hero (desktop)
     sizeMobile   idem no celular, em % da largura da tela
     rotate       giro do produto parado (graus)
     enter        direção de entrada: 'right' | 'left' | 'top' | 'bottom'
     dust         cor do pó (r,g,b) que levanta quando o produto pousa
   floaters[]     latinhas, folhas e especiarias flutuando no fundo (ver Floater)
   ========================================================================= */
// caminho relativo com .ts: este arquivo também roda no build (build/content-plugin.ts), sem o alias "@"
import { LID_FAN, PRODUCTS, type ProductId } from "../content/products.ts";

export type EnterFrom = "right" | "left" | "top" | "bottom";

export type HeroProduct =
  | { kind: "pair"; id: ProductId }
  | { kind: "image"; src: string; srcSm: string; width: number; height: number };

export interface HeroSlide {
  word: string;
  line: string;
  name: string;
  composition: string;
  swatchLabel: string;
  product: HeroProduct;
  colors: { from: string; to: string };
  swatch: string;
  size: number;
  sizeMobile: number;
  rotate: number;
  enter: EnterFrom;
  dust: string;
}

/**
 * Elemento flutuando atrás da palavra. Posições em % da largura/altura do hero, tamanho em % da
 * menor dimensão. depth: 0 = longe (pequeno, desfocado, bem apagado) · 1 = meio · 2 = perto.
 * `mobile: false` tira o item do celular; um objeto troca posição e tamanho lá.
 */
export interface Floater {
  src: string;
  width: number;
  height: number;
  x: number;
  y: number;
  size: number;
  rotate: number;
  depth: 0 | 1 | 2;
  mobile?: { x: number; y: number; size: number } | false;
}

export interface HeroConfig {
  holdSeconds: number;
  transitionSeconds: number;
  openSeconds: number;
  autoplay: boolean;
  tabletScale: number;
  overlap: number;
  scroll: { perSlide: number; perSlideMobile: number };
  slides: HeroSlide[];
  floaters: Floater[];
}

const half = (px: number) => Math.round(px / 2);
const lid = (id: ProductId) => ({ src: PRODUCTS[id].lidSm, width: half(PRODUCTS[id].lidPx), height: half(PRODUCTS[id].lidPx) });
const tin = (id: ProductId) => ({ src: PRODUCTS[id].tinSm, width: half(PRODUCTS[id].tinPx), height: half(PRODUCTS[id].tinPx) });
const art = (name: string, width: number, height: number) => ({ src: `img/fundo/${name}.webp`, width, height });

export const HERO_CONFIG: HeroConfig = {
  holdSeconds: 2,
  transitionSeconds: 1.15,
  openSeconds: 0.85,
  autoplay: true,
  tabletScale: 0.85,
  overlap: 0.16,
  scroll: { perSlide: 0.5, perSlideMobile: 0.4 },
  slides: [
    {
      word: "Xingu",
      line: "Linha Xingu",
      name: "Eucaliptu’s Selva",
      composition: "Fumo, eucalipto e mentol.",
      swatchLabel: "Eucaliptu’s Selva",
      product: { kind: "pair", id: "eucaliptus-selva" },
      colors: { from: "#46A862", to: "#164D2B" },
      swatch: "#3E9A57",
      size: 54,
      sizeMobile: 88,
      rotate: -4,
      enter: "right",
      dust: "28,18,10",
    },
    {
      word: "Zero°",
      line: "Linha Zero Grau",
      name: "Super Mentolado",
      composition: "Fumo, cravo, canela, anis, alecrim, eucalipto e mentol.",
      swatchLabel: "Super Mentolado",
      product: { kind: "pair", id: "super-mentolado" },
      colors: { from: "#3A56CC", to: "#0E1A5E" },
      swatch: "#23399E",
      size: 54,
      sizeMobile: 88,
      rotate: 4,
      enter: "top",
      dust: "10,14,40",
    },
    {
      word: "Puro",
      line: "Linha Xingu",
      name: "Puro Tabaco",
      composition: "Fumo torrado e moído.",
      swatchLabel: "Puro Tabaco",
      product: { kind: "pair", id: "puro-tabaco" },
      colors: { from: "#D08A42", to: "#6A3612" },
      swatch: "#B8692A",
      size: 54,
      sizeMobile: 88,
      rotate: -3,
      enter: "left",
      dust: "46,26,10",
    },
    {
      word: "Vick",
      line: "Linha Zero Grau",
      name: "Puro Vick",
      composition: "Composição [a confirmar].",
      swatchLabel: "Puro Vick",
      product: { kind: "pair", id: "puro-vick" },
      colors: { from: "#3AA6D0", to: "#0B3D5A" },
      swatch: "#1F8CBF",
      size: 54,
      sizeMobile: 88,
      rotate: 3,
      enter: "bottom",
      dust: "12,30,44",
    },
    {
      word: "Raiz",
      line: "Fábrica de rapé em Alexânia, Goiás",
      name: "Tabaco, ervas e tempo.",
      composition:
        "Há [25] anos a Xingu torra o fumo, mói as ervas e enche cada latinha na própria fábrica. Conheça a linha e leve para a sua tabacaria.",
      swatchLabel: "A fábrica",
      product: { kind: "image", ...LID_FAN },
      colors: { from: "#31785D", to: "#0C2E24" },
      swatch: "#1E5642",
      size: 58,
      sizeMobile: 86,
      rotate: 0,
      enter: "right",
      dust: "12,24,18",
    },
  ],
  floaters: [
    // longe: pequenos, desfocados e bem apagados
    { ...lid("super-mentolado"), x: 13, y: 15, size: 7, rotate: -18, depth: 0, mobile: { x: 88, y: 13, size: 15 } },
    { ...lid("puro-vick"), x: 58, y: 9, size: 6, rotate: 12, depth: 0, mobile: false },
    { ...art("folha-tabaco-2", 187, 440), x: 37, y: 13, size: 10, rotate: 35, depth: 0, mobile: { x: 10, y: 19, size: 20 } },
    { ...art("cravo-1", 274, 360), x: 73, y: 91, size: 4.5, rotate: -40, depth: 0, mobile: false },
    { ...lid("puro-tabaco"), x: 90, y: 72, size: 7.5, rotate: 20, depth: 0, mobile: false },
    { ...art("anis-1", 347, 360), x: 21, y: 86, size: 5, rotate: 10, depth: 0, mobile: { x: 50, y: 7, size: 10 } },
    { ...art("eucalipto-2", 202, 360), x: 47, y: 93, size: 6, rotate: 70, depth: 0, mobile: false },
    // meio
    { ...lid("eucaliptus-selva"), x: 84, y: 17, size: 11, rotate: -14, depth: 1, mobile: { x: 92, y: 47, size: 17 } },
    { ...tin("puro-tabaco"), x: 23, y: 22, size: 9, rotate: 0, depth: 1, mobile: { x: 7, y: 49, size: 16 } },
    { ...art("folha-tabaco-1", 418, 440), x: 6, y: 88, size: 15, rotate: -50, depth: 1, mobile: false },
    { ...art("hortela-1", 241, 360), x: 95, y: 91, size: 8, rotate: 25, depth: 1, mobile: false },
    { ...art("canela-1", 360, 320), x: 74, y: 8, size: 8, rotate: 40, depth: 1, mobile: false },
    { ...art("folha-tabaco-4", 439, 440), x: 96, y: 33, size: 13, rotate: 60, depth: 1, mobile: false },
    // perto: maiores, parcialmente fora da tela
    { ...art("folha-tabaco-5", 421, 440), x: 2, y: 76, size: 17, rotate: 25, depth: 2, mobile: false },
    { ...lid("super-mentolado"), x: 99, y: 79, size: 15, rotate: -25, depth: 2, mobile: false },
    { ...art("folha-tabaco-6", 206, 440), x: 71, y: 101, size: 15, rotate: -70, depth: 2, mobile: false },
  ],
};
