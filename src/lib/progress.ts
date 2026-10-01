/** Mapeamentos de progresso de scroll (0–1) usados pelo hero e pelos destaques. */

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

/** Índice do frame (0…count-1) para um progresso. */
export function frameForProgress(progress: number, count: number): number {
  if (count <= 0) return 0;
  return Math.min(count - 1, Math.round(clamp01(progress) * (count - 1)));
}

/** Divide o progresso total em `count` trechos iguais: qual trecho e o progresso local dentro dele. */
export function segmentFor(progress: number, count: number): { index: number; local: number } {
  if (count <= 0) return { index: 0, local: 0 };
  const scaled = clamp01(progress) * count;
  const index = Math.min(count - 1, Math.floor(scaled));
  return { index, local: clamp01(scaled - index) };
}

/** Índice circular (loop infinito do carrossel). */
export const wrapIndex = (i: number, n: number) => ((i % n) + n) % n;
