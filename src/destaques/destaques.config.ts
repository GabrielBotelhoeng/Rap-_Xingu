/**
 * DESTAQUES — os mais pedidos, uma latinha por vez abrindo com o scroll.
 * Textos: tabela "Destaques animados" de docs/copy.md. [Confirmar com o dono quais são os 3 mais vendidos.]
 *
 * Enquanto a frame-sequence não existe, a abertura é feita em duas camadas de foto real:
 * a lata aberta (pó) embaixo e a tampa do sabor por cima, que sai com o scroll.
 * Quando os frames forem extraídos (ver PROJETO.md), preencha `frames` com a pasta e a quantidade:
 *   frames: { desktop: { dir: "frames/super-mentolado/desktop/", count: 140 },
 *             mobile:  { dir: "frames/super-mentolado/mobile/",  count: 72 } }
 * e a sequência no canvas assume o lugar das duas camadas.
 */
import type { HerbId } from "@/content/herbs";
import type { Photo } from "@/content/catalog";

export interface FrameSet {
  /** Pasta dentro de public/, terminando em "/" (arquivos 0001.webp, 0002.webp…). */
  dir: string;
  count: number;
}

export interface DestaqueItem {
  flavorId: string;
  eyebrow: string;
  title: string;
  support: string;
  composition: string;
  /** Luz de fundo: puxa levemente a cor do rótulo. */
  glow: string;
  /** Foto da tampa (vista de cima). `null` = tampa provisória até a foto chegar. */
  lid: Photo | null;
  /** Ervas que flutuam atrás da latinha (até 6). */
  herbs: HerbId[];
  frames: { desktop: FrameSet | null; mobile: FrameSet | null };
}

export const DESTAQUES_CONFIG: {
  enabled: boolean;
  scrollPerItem: number;
  scrollPerItemMobile: number;
  openTin: Photo;
  items: DestaqueItem[];
} = {
  /** Desligue para esconder a seção inteira (e o item "Destaques" do menu). */
  enabled: true,
  /** Quanto de scroll (em alturas de tela) cada sabor ocupa. */
  scrollPerItem: 1.25,
  scrollPerItemMobile: 1,
  /** Lata aberta compartilhada pelos sabores sem frame-sequence. */
  openTin: { src: "/img/latas/lata-aberta.webp", width: 533, height: 552 },
  items: [
    {
      flavorId: "super-mentolado",
      eyebrow: "Mais vendido · Linha Zero Grau",
      title: "Super Mentolado",
      support: "Mentol intenso sobre um fundo de cravo e alecrim.",
      composition: "Fumo, cravo, canela, anis, alecrim, eucalipto e mentol.",
      glow: "#3150D8",
      lid: { src: "/img/zero-grau.webp", width: 800, height: 800 },
      herbs: ["hortela", "cravo", "alecrim", "eucalipto", "canela", "anis-estrelado"],
      frames: { desktop: null, mobile: null },
    },
    {
      flavorId: "tradicional-da-aldeia",
      eyebrow: "Clássico da casa",
      title: "Tradicional da Aldeia",
      support: "O sabor que o cliente da tabacaria já pede pelo nome.",
      composition: "Fumo, noz-moscada, erva-doce, anis e mentol.",
      glow: "#B87332", // provisória: ajustar para a cor do rótulo
      lid: null,
      herbs: ["noz-moscada", "erva-doce", "anis-estrelado", "hortela", "tabaco"],
      frames: { desktop: null, mobile: null },
    },
    {
      flavorId: "pai-vinicius",
      eyebrow: "Especiarias",
      title: "Pai Vinicius",
      support: "Noz-moscada e casca de laranja, com um toque de cravo.",
      composition: "Fumo, noz-moscada, casca de laranja, eucalipto e cravo.",
      glow: "#8A4FB0", // provisória: ajustar para a cor do rótulo
      lid: null,
      herbs: ["casca-de-laranja", "noz-moscada", "cravo", "eucalipto", "tabaco"],
      frames: { desktop: null, mobile: null },
    },
  ],
};

/** Linha de formato abaixo de cada destaque (copy). */
export const DESTAQUE_FORMAT = "Latinha de 10g · caixa com 12";
