/**
 * Linha completa de sabores. Fonte: tabela do Catálogo em docs/copy.md.
 * Para trocar a foto de um sabor, coloque o arquivo em public/img/latas/ e preencha `photo`.
 */
export type LineId = "zero-grau" | "xingu" | "joao-de-barro";

export const LINES: Record<LineId, string> = {
  "zero-grau": "Zero Grau",
  xingu: "Xingu",
  "joao-de-barro": "João de Barro",
};

/** Ordem dos filtros no topo da grade (depois de “Todos”). */
export const LINE_ORDER: readonly LineId[] = ["zero-grau", "xingu", "joao-de-barro"];

export interface Photo {
  src: string;
  width: number;
  height: number;
}

export interface Flavor {
  id: string;
  name: string;
  line: LineId;
  /** Composição exatamente como no rótulo. `null` = ainda “[a confirmar]”. */
  composition: string | null;
  /** Foto provisória da tampa (miniatura do card). Sem foto, o card mostra a latinha provisória. */
  photo?: Photo;
  /** Cor da latinha provisória enquanto a foto não chega. */
  tint: string;
  bestSeller?: boolean;
}

const TINT: Record<LineId, string> = {
  "zero-grau": "#25386F",
  xingu: "#2F4A2E",
  "joao-de-barro": "#7A4528",
};

export const FLAVORS: readonly Flavor[] = [
  {
    id: "super-mentolado",
    name: "Super Mentolado",
    line: "zero-grau",
    composition: "Fumo, cravo, canela, anis, alecrim, eucalipto e mentol",
    photo: { src: "/img/latas/super-mentolado.webp", width: 480, height: 480 },
    tint: "#23399E",
    bestSeller: true,
  },
  { id: "super-vick", name: "Super Vick", line: "zero-grau", composition: null, tint: TINT["zero-grau"] },
  { id: "vick-ouro", name: "Vick Ouro", line: "zero-grau", composition: null, tint: TINT["zero-grau"] },
  { id: "super-chiclete", name: "Super Chiclete", line: "zero-grau", composition: null, tint: TINT["zero-grau"] },
  { id: "canela-com-menta", name: "Canela com Menta", line: "zero-grau", composition: null, tint: TINT["zero-grau"] },
  {
    id: "eucaliptus-selva",
    name: "Eucaliptu’s Selva",
    line: "xingu",
    composition: "Fumo, eucalipto e mentol",
    photo: { src: "/img/latas/eucaliptus-selva.webp", width: 480, height: 472 },
    tint: "#2E8C4A",
  },
  { id: "cravo", name: "Cravo", line: "xingu", composition: "Fumo, cravo e mentol", tint: TINT.xingu },
  {
    id: "puro-tabaco",
    name: "Puro Tabaco",
    line: "xingu",
    composition: "Fumo torrado e moído",
    photo: { src: "/img/latas/puro-tabaco.webp", width: 465, height: 480 },
    tint: "#5A3418",
  },
  {
    id: "tradicional-da-aldeia",
    name: "Tradicional da Aldeia",
    line: "xingu",
    composition: "Fumo, noz-moscada, erva-doce, anis e mentol",
    tint: TINT.xingu,
  },
  {
    id: "pai-vinicius",
    name: "Pai Vinicius",
    line: "xingu",
    composition: "Fumo, noz-moscada, casca de laranja, eucalipto e cravo",
    tint: TINT.xingu,
  },
  {
    id: "royal-cacau",
    name: "Royal Cacau",
    line: "xingu",
    composition: "Fumo, imburana, cravo, canela, agentes de sabor e mentol",
    tint: TINT.xingu,
  },
  { id: "laranja", name: "Laranja", line: "xingu", composition: "Fumo, aroma artificial de laranja e mentol", tint: TINT.xingu },
  { id: "morango", name: "Morango", line: "xingu", composition: "Fumo, aroma artificial de morango e mentol", tint: TINT.xingu },
  { id: "sete-ervas", name: "Sete Ervas", line: "joao-de-barro", composition: null, tint: TINT["joao-de-barro"] },
];

export const PENDING_COMPOSITION = "[a confirmar]";

export function flavorById(id: string): Flavor | undefined {
  return FLAVORS.find((f) => f.id === id);
}

/** Sabores visíveis para um filtro (`"todos"` ou uma linha). */
export function filterFlavors(flavors: readonly Flavor[], filter: LineId | "todos"): Flavor[] {
  return filter === "todos" ? [...flavors] : flavors.filter((f) => f.line === filter);
}
