/** Mapeamentos de progresso de scroll (0–1) usados pelo hero. */

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Hero preso: em quantos passos a rolagem já avançou.
 * O 1º avanço acontece em meio trecho e o último sabor fica um trecho e meio
 * antes da página ser liberada.
 */
export function scrollStep(progress: number, slides: number): number {
  if (slides <= 1) return 0;
  return Math.min(slides - 1, Math.max(0, Math.floor(clamp01(progress) * slides + 0.5)));
}

/** Índice circular (loop infinito do carrossel). */
export const wrapIndex = (i: number, n: number) => ((i % n) + n) % n;
