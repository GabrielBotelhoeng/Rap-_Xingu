/**
 * Fotos padronizadas dos sabores: lata aberta + tampa, vistas de cima, com fundo transparente.
 * Recortadas por scripts/recortar-fotos.py a partir de assets/raw/fotos-padronizadas/ — todas as latas
 * com o mesmo diâmetro e a tampa na mesma escala, então os sabores aparecem do mesmo tamanho.
 * Os arquivos são quadrados (o círculo ocupa a caixa inteira); `-sm` é a metade, para o celular.
 * Atenção: as fotos vieram retocadas por IA e o texto miúdo dos rótulos tem defeitos
 * (ex.: "CNPJ 34.565.989" no Super Mentolado). Trocar pelas fotos originais quando a fábrica mandar.
 */
export type ProductId = "eucaliptus-selva" | "super-mentolado" | "puro-tabaco" | "puro-vick";

export interface ProductPhotos {
  tin: string;
  tinSm: string;
  lid: string;
  lidSm: string;
  /** Largura (= altura) dos arquivos grandes, em px. */
  tinPx: number;
  lidPx: number;
  /** Cor do pó (r,g,b) para as partículas que sobem quando a tampa sai. */
  powder: string;
}

const photos = (id: ProductId, tinPx: number, lidPx: number, powder: string): ProductPhotos => ({
  tin: `img/produtos/${id}-lata.webp`,
  tinSm: `img/produtos/${id}-lata-sm.webp`,
  lid: `img/produtos/${id}-tampa.webp`,
  lidSm: `img/produtos/${id}-tampa-sm.webp`,
  tinPx,
  lidPx,
  powder,
});

export const PRODUCTS: Record<ProductId, ProductPhotos> = {
  "eucaliptus-selva": photos("eucaliptus-selva", 808, 846, "78,56,24"),
  "super-mentolado": photos("super-mentolado", 808, 837, "74,48,22"),
  "puro-tabaco": photos("puro-tabaco", 806, 852, "96,70,40"),
  "puro-vick": photos("puro-vick", 808, 820, "76,52,24"),
};

/** Diâmetro da tampa em diâmetros da lata (a tampa encaixa por fora, é um pouco maior). */
export const lidRatio = (p: ProductPhotos) => p.lidPx / p.tinPx;

/** As 4 tampas em leque (slide da fábrica no hero), também gerado pelo script. */
export const LID_FAN = { src: "img/produtos/tampas-leque.webp", srcSm: "img/produtos/tampas-leque-sm.webp", width: 1616, height: 569 };
