/**
 * Ervas recortadas da folha gerada no Higgsfield (ver docs/prompts.md).
 * Arquivos em public/img/ervas/<id>.webp, fundo transparente.
 */
export type HerbId =
  | "eucalipto"
  | "cravo"
  | "alecrim"
  | "canela"
  | "anis-estrelado"
  | "noz-moscada"
  | "casca-de-laranja"
  | "hortela"
  | "tabaco"
  | "erva-doce";

export interface Herb {
  label: string;
  width: number;
  height: number;
}

export const HERBS: Record<HerbId, Herb> = {
  eucalipto: { label: "Folha de eucalipto", width: 224, height: 440 },
  cravo: { label: "Cravo", width: 168, height: 374 },
  alecrim: { label: "Alecrim", width: 219, height: 440 },
  canela: { label: "Canela em pau", width: 242, height: 440 },
  "anis-estrelado": { label: "Anis-estrelado", width: 417, height: 421 },
  "noz-moscada": { label: "Noz-moscada", width: 278, height: 352 },
  "casca-de-laranja": { label: "Casca de laranja", width: 216, height: 440 },
  hortela: { label: "Folha de hortelã", width: 272, height: 440 },
  tabaco: { label: "Folha de tabaco", width: 218, height: 440 },
  "erva-doce": { label: "Erva-doce", width: 305, height: 440 },
};

export const herbSrc = (id: HerbId) => `/img/ervas/${id}.webp`;
