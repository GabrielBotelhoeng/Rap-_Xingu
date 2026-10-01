/**
 * DESTAQUES — "Os mais pedidos.": um sabor por linha, a latinha abre conforme a página rola
 * (sem prender a rolagem). Textos: tabela "Destaques animados" de docs/copy.md e o catálogo.
 *
 * [Confirmar com o dono quais são os 3 mais vendidos.] A copy sugere Super Mentolado, Tradicional da
 * Aldeia e Pai Vinicius, mas só há foto padronizada (lata + tampa) do Super Mentolado; os outros dois
 * entram aqui quando as fotos chegarem. Por ora: Super Mentolado + os dois da linha Xingu com foto.
 * `support` é a linha de apoio da copy — só existe para os sabores que a copy cobre.
 */
// caminho relativo com .ts: este arquivo também roda no build (build/content-plugin.ts), sem o alias "@"
import type { ProductId } from "../content/products.ts";

export interface DestaqueItem {
  /** Sabor no catálogo (o botão marca este sabor no formulário). */
  flavorId: string;
  /** Fotos padronizadas (src/content/products.ts). */
  product: ProductId;
  eyebrow: string;
  title: string;
  support: string | null;
  composition: string;
  /** Luz atrás da latinha: a cor do rótulo. */
  glow: string;
}

export const DESTAQUES_CONFIG: { enabled: boolean; items: DestaqueItem[] } = {
  /** Desligue para esconder a seção inteira (e o item "Destaques" do menu). */
  enabled: true,
  items: [
    {
      flavorId: "super-mentolado",
      product: "super-mentolado",
      eyebrow: "Mais vendido · Linha Zero Grau",
      title: "Super Mentolado",
      support: "Mentol intenso sobre um fundo de cravo e alecrim.",
      composition: "Fumo, cravo, canela, anis, alecrim, eucalipto e mentol.",
      glow: "#3651D6",
    },
    {
      flavorId: "eucaliptus-selva",
      product: "eucaliptus-selva",
      eyebrow: "Linha Xingu",
      title: "Eucaliptu’s Selva",
      support: null,
      composition: "Fumo, eucalipto e mentol.",
      glow: "#2E9F57",
    },
    {
      flavorId: "puro-tabaco",
      product: "puro-tabaco",
      eyebrow: "Linha Xingu",
      title: "Puro Tabaco",
      support: null,
      composition: "Fumo torrado e moído.",
      glow: "#C47A33",
    },
  ],
};

/** Linha de formato abaixo de cada destaque (copy). */
export const DESTAQUE_FORMAT = "Latinha de 10g · caixa com 12";
