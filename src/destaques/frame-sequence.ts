/**
 * Frame-sequence em canvas 2D (PROJETO.md › Destaques animados):
 * desenho em modo "cover", DPR limitado a 2, primeiros frames pré-carregados
 * e o resto em segundo plano; enquanto um frame não chega, desenha o mais próximo já carregado.
 */
import type { FrameSet } from "./destaques.config";

export const frameUrl = (set: FrameSet, i: number, base = "") => `${base}${set.dir}${String(i + 1).padStart(4, "0")}.webp`;

/** Retângulo "cover": preenche o destino sem distorcer, cortando o excesso. */
export function coverRect(srcW: number, srcH: number, dstW: number, dstH: number) {
  const scale = Math.max(dstW / srcW, dstH / srcH);
  const w = srcW * scale;
  const h = srcH * scale;
  return { x: (dstW - w) / 2, y: (dstH - h) / 2, w, h };
}

export class FrameSequence {
  private readonly images: (HTMLImageElement | undefined)[];
  private readonly ready: boolean[];
  private readonly ctx: CanvasRenderingContext2D | null;
  private current = -1;
  private wanted = 0;
  private queued = false;
  /** O canvas é um só para todos os sabores: só a sequência do sabor na tela desenha nele. */
  private active = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly set: FrameSet,
    private readonly base = import.meta.env.BASE_URL,
  ) {
    this.images = new Array(set.count);
    this.ready = new Array<boolean>(set.count).fill(false);
    this.ctx = canvas.getContext("2d");
  }

  /** Carrega os primeiros `eager` frames já, e o resto em lotes pequenos. */
  load(eager = 10, concurrency = 4): void {
    const order = [...Array(this.set.count).keys()];
    const first = order.slice(0, eager);
    const rest = order.slice(eager);
    first.forEach((i) => this.fetch(i));
    let cursor = 0;
    const next = (): void => {
      const i = rest[cursor++];
      if (i === undefined) return;
      this.fetch(i).then(next, next);
    };
    for (let k = 0; k < concurrency; k++) next();
  }

  private fetch(i: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        this.ready[i] = true;
        if (i === 0 || Math.abs(i - this.wanted) < Math.abs(this.current - this.wanted)) this.request(this.wanted);
        resolve();
      };
      img.onerror = () => reject(new Error(`frame ${i + 1} não carregou`));
      img.src = frameUrl(this.set, i, this.base);
      this.images[i] = img;
    });
  }

  resize(): void {
    const r = Math.min(window.devicePixelRatio || 1, 2);
    const { width, height } = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.max(1, Math.round(width * r));
    this.canvas.height = Math.max(1, Math.round(height * r));
    this.current = -1;
    this.request(this.wanted);
  }

  /**
   * Liga ou desliga o desenho. Inativa, a sequência continua carregando, mas não desenha — sem isto
   * os frames de outro sabor que terminavam de carregar apareciam por cima do sabor na tela.
   * Ao voltar a ser a ativa, redesenha mesmo que o frame seja o mesmo: o canvas pode estar com o de outro.
   */
  setActive(on: boolean): void {
    this.active = on;
    if (!on) return;
    this.current = -1;
    this.request(this.wanted);
  }

  /** Pede um frame; o desenho acontece no próximo requestAnimationFrame. */
  request(index: number): void {
    this.wanted = Math.min(this.set.count - 1, Math.max(0, index));
    if (!this.active || this.queued) return;
    this.queued = true;
    requestAnimationFrame(() => {
      this.queued = false;
      this.draw(this.nearestReady(this.wanted));
    });
  }

  private nearestReady(index: number): number {
    for (let d = 0; d < this.set.count; d++) {
      if (this.ready[index - d]) return index - d;
      if (this.ready[index + d]) return index + d;
    }
    return -1;
  }

  private draw(i: number): void {
    const img = this.images[i];
    if (!this.active || !this.ctx || i < 0 || i === this.current || !img) return;
    const { width, height } = this.canvas;
    const r = coverRect(img.naturalWidth, img.naturalHeight, width, height);
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.drawImage(img, r.x, r.y, r.w, r.h);
    this.current = i;
  }
}
