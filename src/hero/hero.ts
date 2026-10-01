/* ================= MOTOR DO HERO CINÉTICO =================
   Portado de docs/referencias/hero-rape-xingu/index.html, mesma lógica de animação, com:
   - a roda do mouse não é sequestrada: o hero fica preso (ScrollTrigger) por N trechos de scroll,
     cada trecho avança um sabor, e depois a página é liberada; o autoplay vale enquanto ninguém rola;
   - produto = lata aberta + tampa das fotos padronizadas: chega fechado (a tampa por cima da lata),
     pousa e abre — a tampa desliza para o lado e o pó levanta;
   - a palavra fica acima do produto, que só encosta na base das letras (placement.ts › stackLayout);
   - fundo flutuante de latinhas, folhas e especiarias (floaters.ts).
   Os textos, imagens, cores e tempos ficam em hero.config.ts. */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollStep, wrapIndex } from "@/lib/progress";
import { setRichText } from "@/lib/dom";
import { PRODUCTS, lidRatio } from "@/content/products";
import { HERO_CONFIG, type EnterFrom, type HeroSlide } from "./hero.config";
import { createDust } from "./dust";
import { initFloaters } from "./floaters";
import { OPEN_GAP, boxExtents, pairCenters, pairExtents, perWidth, stackLayout, type Extents, type StackLayout } from "./placement";

gsap.registerPlugin(ScrollTrigger);

const asset = (src: string) => `${import.meta.env.BASE_URL}${src}`;

const MQ_MOBILE = "(max-width: 760px), (orientation: portrait) and (max-width: 1100px)";
const MQ_TABLET = "(min-width: 761px) and (max-width: 1180px) and (orientation: landscape)";

/** Desktop: folga entre o centro (palavra e produto) e o painel de textos ou o seletor (px). */
const SIDE_GAP = 24;
/** Folga abaixo do header e acima do painel (celular) ou da barra de baixo (desktop), em px. */
const EDGE_GAP = 14;
/** Quanto a flutuação sobe o produto (px). Entra na conta da sobreposição com a palavra. */
const FLOAT = 8;

/** direção de entrada → vetor (a saída usa o oposto) */
const ENTER_VEC: Record<EnterFrom, [number, number]> = {
  right: [1, -0.55],
  left: [-1, -0.45],
  top: [0.35, -1],
  bottom: [-0.3, 1],
};

type Source = "auto" | "user";

/** Geometria do produto de um slide, em unidades da largura da composição aberta. */
interface Geometry {
  /** altura da caixa / largura */
  ratio: number;
  /** extents girados por unidade de largura */
  ext: Extents;
  /** lata e tampa: centros (em diâmetros da lata) e largura da composição */
  pair: { tin: number; lid: number; width: number; lidD: number } | null;
}

function geometry(s: HeroSlide): Geometry {
  if (s.product.kind === "image") {
    const ratio = s.product.height / s.product.width;
    return { ratio, ext: boxExtents(1, ratio, s.rotate), pair: null };
  }
  const g = { lid: lidRatio(PRODUCTS[s.product.id]), gap: OPEN_GAP };
  const c = pairCenters(g);
  return {
    ratio: Math.max(1, g.lid) / c.width,
    ext: perWidth(pairExtents(g, s.rotate), c.width),
    pair: { ...c, lidD: g.lid },
  };
}

export interface HeroController {
  /** Toca a entrada e libera o autoplay. Chamado depois do age gate. */
  start(): void;
}

export function initHero(root: HTMLElement, { reducedMotion }: { reducedMotion: boolean }): HeroController {
  const C = HERO_CONFIG;
  const S = C.slides;
  const N = S.length;
  const $ = <T extends Element = HTMLElement>(sel: string, scope: ParentNode = root): T => {
    const el = scope.querySelector<T>(sel);
    if (!el) throw new Error(`[hero] elemento não encontrado: ${sel}`);
    return el;
  };

  const wordEl = $("[data-hero-word]");
  const move = $("[data-hero-move]");
  const flt = $("[data-hero-float]");
  const pairEl = $("[data-hero-pair]");
  const tinEl = $<HTMLImageElement>("[data-hero-tin]");
  const lidEl = $<HTMLImageElement>("[data-hero-lid]");
  const bar = $("[data-hero-progress]");
  const info = $("[data-hero-info]");
  const pickerLabel = $("[data-hero-picker-label]");
  const pauseBtn = $<HTMLButtonElement>("[data-hero-pause]");
  const layers = { cur: $("[data-hero-layer='current']"), nxt: $("[data-hero-layer='next']") };
  const infoItems = Array.from(info.querySelectorAll<HTMLElement>("[data-hero-item]"));
  const picker = $(".hero__picker");
  const bottomBar = $(".hero__bottom");
  const fadeIns = [...infoItems, picker, bottomBar];
  const header = document.querySelector<HTMLElement>("[data-site-header]");
  const dust = createDust($<HTMLCanvasElement>("[data-hero-dust]"), root);
  const floaters = initFloaters(root, { reducedMotion });

  const mq = matchMedia(MQ_MOBILE);
  const tablet = matchMedia(MQ_TABLET);
  const slide = (i: number) => S[wrapIndex(i, N)] as HeroSlide;
  const geo = S.map(geometry);
  const geoOf = (s: HeroSlide) => geo[S.indexOf(s)] ?? geometry(s);

  let index = 0; // slide visível (troca no meio da transição)
  let target = 0; // destino da transição em curso ou pendente
  let busy = false;
  let started = false;
  let pending: number | null = null;
  let holdTween: gsap.core.Tween | null = null;
  let floatTween: gsap.core.Tween | null = null;
  let driftTween: gsap.core.Tween | null = null;
  let inView = true;
  let pageVisible = !document.hidden;
  let userPaused = false;
  let focusInside = false;
  let wordAspect = 2; // largura da palavra / font-size, medida em buildWord
  let current: StackLayout | null = null;

  gsap.set(wordEl, { xPercent: -50, yPercent: -50, x: 0, y: 0 }); // centralização feita pelo GSAP
  gsap.set(move, { x: 0, y: 0, rotation: 0 });

  const minDim = () => Math.min(root.clientWidth, root.clientHeight * (mq.matches ? 1 : 1.25));

  /** Desktop/tablet deitado: largura livre no centro, entre o painel de textos e o seletor. */
  function freeWidth(): number {
    const box = root.getBoundingClientRect();
    const left = info.getBoundingClientRect().right - box.left;
    const right = box.right - picker.getBoundingClientRect().left;
    return Math.max(0, box.width - 2 * (Math.max(left, right) + SIDE_GAP));
  }

  /** Onde ficam a palavra e o produto nesta tela. No celular depende do painel de textos que está
      no DOM — chame depois de setInfo/buildWord. */
  function layout(s: HeroSlide): StackLayout {
    const g = geoOf(s);
    const box = root.getBoundingClientRect();
    const W = root.clientWidth;
    const H = root.clientHeight;
    const top = (header?.offsetHeight ?? 0) + EDGE_GAP;
    if (mq.matches) {
      return stackLayout({
        top,
        bottom: info.getBoundingClientRect().top - box.top - EDGE_GAP,
        width: W * 0.92,
        wordAspect,
        maxFont: (H * 0.28) / 0.8,
        productWidth: (W * s.sizeMobile) / 100,
        extents: g.ext,
        overlap: C.overlap,
        float: FLOAT,
        minScale: 0.55,
      });
    }
    const free = freeWidth();
    const scale = tablet.matches ? C.tabletScale : 1;
    return stackLayout({
      top,
      bottom: bottomBar.getBoundingClientRect().top - box.top - EDGE_GAP,
      width: free,
      wordAspect,
      maxFont: Math.min((H * 0.36) / 0.8, (W * (tablet.matches ? 0.4 : 0.46)) / wordAspect),
      productWidth: ((minDim() * s.size) / 100) * scale,
      extents: g.ext,
      overlap: C.overlap,
      float: FLOAT,
      minScale: 0.6,
    });
  }

  /** Centro do produto em relação ao centro do hero (o .hero__product fica no meio). */
  const productY = (L: StackLayout) => L.productCy - root.clientHeight / 2;

  function applyWord(L: StackLayout) {
    wordEl.style.fontSize = `${L.fontSize}px`;
    wordEl.style.top = `${L.wordCy}px`;
  }

  /** Tamanho da caixa do produto e posição da lata e da tampa (abertas) dentro dela. */
  function sizeProduct(s: HeroSlide, L: StackLayout) {
    const g = geoOf(s);
    const w = L.productWidth;
    const h = w * g.ratio;
    Object.assign(pairEl.style, { width: `${w}px`, height: `${h}px`, left: `${-w / 2}px`, top: `${-h / 2}px` });
    if (!g.pair) {
      Object.assign(tinEl.style, { width: `${w}px`, height: `${h}px`, left: "0px", top: "0px" });
      tinEl.sizes = `${Math.round(w)}px`;
      return;
    }
    const D = w / g.pair.width;
    const lidD = D * g.pair.lidD;
    const cx = (x: number) => (x + g.pair!.width / 2) * D; // centro → px a partir da esquerda da caixa
    Object.assign(tinEl.style, { width: `${D}px`, height: `${D}px`, left: `${cx(g.pair.tin) - D / 2}px`, top: `${(h - D) / 2}px` });
    Object.assign(lidEl.style, {
      width: `${lidD}px`,
      height: `${lidD}px`,
      left: `${cx(g.pair.lid) - lidD / 2}px`,
      top: `${(h - lidD) / 2}px`,
    });
    tinEl.sizes = `${Math.round(D)}px`;
    lidEl.sizes = `${Math.round(lidD)}px`;
  }

  /** Deslocamentos (px) que levam lata e tampa para o centro da caixa: a lata fechada. */
  function closedOffsets(s: HeroSlide, L: StackLayout) {
    const g = geoOf(s);
    if (!g.pair) return { tin: 0, lid: 0 };
    const D = L.productWidth / g.pair.width;
    return { tin: -g.pair.tin * D, lid: -g.pair.lid * D };
  }

  function closePair(s: HeroSlide, L: StackLayout) {
    const off = closedOffsets(s, L);
    gsap.set(tinEl, { x: off.tin, rotation: 0, scale: 1 });
    gsap.set(lidEl, { x: off.lid, rotation: -14, scale: 1 });
  }

  function openPairNow() {
    gsap.set([tinEl, lidEl], { x: 0, rotation: 0, scale: 1 });
  }

  /** A tampa desliza para o lado (subindo um pouco) e a lata vai junto para o lugar dela; o pó levanta. */
  function openTimeline(s: HeroSlide): gsap.core.Timeline {
    const tl = gsap.timeline();
    if (s.product.kind !== "pair") return tl;
    const O = C.openSeconds;
    tl.to(lidEl, { x: 0, rotation: 0, duration: O, ease: "power3.inOut" }, 0)
      .to(lidEl, { scale: 1.07, duration: O * 0.42, ease: "sine.out" }, 0)
      .to(lidEl, { scale: 1, duration: O * 0.58, ease: "sine.in" }, O * 0.42)
      .to(tinEl, { x: 0, duration: O, ease: "power3.inOut" }, 0)
      .add(() => puff(s), O * 0.32);
    return tl;
  }

  function setBg(layer: HTMLElement, s: HeroSlide) {
    layer.style.setProperty("--from", s.colors.from);
    layer.style.setProperty("--to", s.colors.to);
  }

  function buildWord(s: HeroSlide) {
    wordEl.replaceChildren(
      ...[...s.word].map((c) => {
        const sp = document.createElement("span");
        sp.className = "ch";
        sp.textContent = c;
        return sp;
      }),
    );
    wordEl.style.fontSize = "100px";
    wordAspect = (wordEl.scrollWidth || 200) / 100;
  }

  function setImage(s: HeroSlide) {
    const p = s.product;
    if (p.kind === "image") {
      tinEl.srcset = `${asset(p.srcSm)} ${Math.round(p.width / 2)}w, ${asset(p.src)} ${p.width}w`;
      tinEl.src = asset(p.src);
      lidEl.hidden = true;
      return;
    }
    const ph = PRODUCTS[p.id];
    tinEl.srcset = `${asset(ph.tinSm)} ${Math.round(ph.tinPx / 2)}w, ${asset(ph.tin)} ${ph.tinPx}w`;
    tinEl.src = asset(ph.tin);
    lidEl.srcset = `${asset(ph.lidSm)} ${Math.round(ph.lidPx / 2)}w, ${asset(ph.lid)} ${ph.lidPx}w`;
    lidEl.src = asset(ph.lid);
    lidEl.hidden = false;
  }

  function setInfo(s: HeroSlide) {
    const [line, name, comp] = infoItems;
    if (line) line.textContent = s.line;
    if (name) name.textContent = s.name;
    if (comp) setRichText(comp, s.composition);
    pickerLabel.textContent = s.swatchLabel;
    swatches.forEach((b, i) => b.setAttribute("aria-pressed", String(i === index)));
  }

  /** Conteúdo e posição de um slide, de uma vez (estado inicial, movimento reduzido e resize). */
  function render(s: HeroSlide) {
    buildWord(s);
    setInfo(s);
    setImage(s);
    current = layout(s); // depois da palavra e do painel: no celular a posição depende dos dois
    applyWord(current);
    sizeProduct(s, current);
    gsap.set(move, { x: 0, y: productY(current), rotation: s.rotate });
  }

  /* ---------- seletor de sabores ---------- */
  const swatches = S.map((s, i) => {
    const b = document.createElement("button");
    b.className = "swatch";
    b.type = "button";
    b.style.setProperty("--c", s.swatch);
    b.setAttribute("aria-label", s.swatchLabel);
    b.setAttribute("aria-pressed", String(i === 0));
    b.addEventListener("click", () => goTo(i, "user"));
    $("[data-hero-swatches]").appendChild(b);
    return b;
  });

  /* ---------- flutuação e deriva da palavra ---------- */
  function startFloat() {
    floatTween?.kill();
    driftTween?.kill();
    if (reducedMotion) return;
    gsap.set(flt, { y: 0, rotation: 0 });
    floatTween = gsap.to(flt, { y: -FLOAT, rotation: 1.2, duration: 1.7, ease: "sine.inOut", yoyo: true, repeat: -1 });
    driftTween = gsap.fromTo(
      wordEl,
      { xPercent: -50 },
      { xPercent: -51.2, duration: C.holdSeconds + C.transitionSeconds + C.openSeconds, ease: "none" },
    );
    syncPlayback();
  }

  /** Pó que levanta quando o produto pousa. */
  function burst(s: HeroSlide) {
    if (reducedMotion || !current) return;
    const g = geoOf(s);
    const w = current.productWidth;
    dust.burst(root.clientWidth / 2, current.productCy, (w * Math.min(1, g.ratio * 1.2)) / 2, s.dust, mq.matches ? 60 : 120);
  }

  /** Pó que sobe da lata quando a tampa sai. */
  function puff(s: HeroSlide) {
    if (reducedMotion || !current || s.product.kind !== "pair") return;
    const g = geoOf(s);
    if (!g.pair) return;
    const D = current.productWidth / g.pair.width;
    const r = (s.rotate * Math.PI) / 180;
    const x = root.clientWidth / 2 + Math.cos(r) * g.pair.tin * D;
    const y = current.productCy + Math.sin(r) * g.pair.tin * D;
    dust.burst(x, y, D * 0.32, PRODUCTS[s.product.id].powder, mq.matches ? 50 : 90);
  }

  /* ---------- transição ---------- */
  function goTo(raw: number, source: Source) {
    const next = wrapIndex(raw, N);
    info.setAttribute("aria-live", source === "user" ? "polite" : "off");
    target = next;
    if (busy) {
      pending = next;
      return;
    }
    if (next === index) {
      hold();
      return;
    }
    busy = true;
    holdTween?.kill();

    const from = slide(index);
    const to = slide(next);
    const T = C.transitionSeconds;
    const W = root.clientWidth;
    const H = root.clientHeight;
    const yFrom = current ? productY(current) : 0;
    let lTo: StackLayout | null = null; // refeito na troca de conteúdo, com o texto novo no painel
    const [ex, ey] = ENTER_VEC[to.enter];
    const ox = 50;
    const oy = 50 + (yFrom / H) * 100;
    const blur = (v: number) => (!mq.matches ? `blur(${v}px)` : "blur(0px)"); // blur animado pesa no celular

    if (reducedMotion) {
      gsap.to([wordEl, move, ...infoItems], {
        opacity: 0,
        duration: 0.25,
        onComplete: () => {
          index = next;
          setBg(layers.cur, to);
          render(to);
          openPairNow();
          gsap.to([wordEl, move, ...infoItems], { opacity: 1, duration: 0.3, onComplete: done });
        },
      });
      return;
    }

    floaters.kick(-ex, -ey, T);
    setBg(layers.nxt, to);
    const tl = gsap.timeline({ defaults: { ease: "power3.inOut" }, onComplete: done });

    // 1. saída: produto escapa na diagonal oposta, letras sobem em cascata
    tl.to(
      move,
      {
        x: -ex * W * 0.55,
        y: yFrom - ey * H * 0.45,
        rotation: from.rotate - ex * 38,
        scale: 0.72,
        filter: blur(4),
        duration: T * 0.5,
        ease: "power3.in",
      },
      0,
    )
      .to(wordEl.children, { yPercent: -110, opacity: 0, rotation: -6, duration: T * 0.42, stagger: T * 0.04, ease: "power2.in" }, 0)
      .to(infoItems, { y: -14, opacity: 0, duration: T * 0.3, stagger: 0.03, ease: "power2.in" }, 0)

      // 2. fundo: a cor nova nasce num círculo a partir do produto
      .fromTo(
        layers.nxt,
        { clipPath: `circle(0% at ${ox}% ${oy}%)` },
        { clipPath: `circle(150% at ${ox}% ${oy}%)`, duration: T * 0.75, ease: "power2.inOut" },
        T * 0.12,
      )

      // 3. troca de conteúdo no meio: o produto novo chega fechado
      .add(() => {
        index = next;
        buildWord(to);
        setInfo(to);
        setImage(to);
        lTo = layout(to);
        current = lTo;
        applyWord(lTo);
        sizeProduct(to, lTo);
        closePair(to, lTo);
        gsap.set(move, {
          x: ex * W * 0.6,
          y: productY(lTo) + ey * H * 0.5,
          rotation: to.rotate + ex * 40,
          scale: 0.7,
          filter: blur(6),
        });
        gsap.set(wordEl, { xPercent: -50 + ex * 6 });
        gsap.set(infoItems, { y: 16, opacity: 0 });
        // as letras novas só existem agora, então a entrada delas é criada aqui
        gsap.fromTo(
          wordEl.children,
          { yPercent: 115, opacity: 0, rotation: 5 },
          { yPercent: 0, opacity: 1, rotation: 0, duration: T * 0.55, stagger: T * 0.05, ease: "power3.out", delay: T * 0.02 },
        );
      }, T * 0.5)

      // 4. entrada: letras sobem, palavra desliza, produto pousa girando
      .to(wordEl, { xPercent: -50, duration: T * 0.8, ease: "power3.out" }, T * 0.52)
      // valores em função: o GSAP só os lê quando o tween começa, depois do layout refeito no passo 3
      .to(
        move,
        {
          x: 0,
          y: () => (lTo ? productY(lTo) : 0),
          rotation: () => to.rotate,
          scale: 1,
          filter: "blur(0px)",
          duration: T * 0.62,
          ease: "back.out(1.25)",
        },
        T * 0.56,
      )
      .add(() => burst(to), T * 1.02)
      .to(infoItems, { y: 0, opacity: 1, duration: T * 0.4, stagger: 0.05, ease: "power2.out" }, T * 0.78)
      // 5. a tampa abre (os .to() só leem a posição de partida quando começam: já fechada no passo 3)
      .add(openTimeline(to), T * 1.08)
      .to({}, { duration: 0 }, T * 1.3);
  }

  function done() {
    // a camada nova vira a atual
    setBg(layers.cur, slide(index));
    gsap.set(layers.nxt, { clipPath: "circle(0% at 50% 50%)" });
    busy = false;
    startFloat();
    if (pending !== null) {
      const p = pending;
      pending = null;
      goTo(p, "user");
      return;
    }
    hold();
  }

  function hold() {
    holdTween?.kill();
    holdTween = null;
    gsap.set(bar, { scaleX: 0 });
    if (!C.autoplay || reducedMotion || !started) return;
    holdTween = gsap.to(bar, {
      scaleX: 1,
      duration: C.holdSeconds,
      ease: "none",
      onComplete: () => goTo(index + 1, "auto"),
    });
    syncPlayback();
  }

  /** Autoplay, flutuação e fundo só se mexem com o hero visível, a aba ativa, sem pausa e sem foco no carrossel. */
  function syncPlayback() {
    const motionOn = inView && pageVisible && !userPaused;
    const advanceOn = motionOn && !focusInside;
    if (holdTween) {
      if (advanceOn) holdTween.resume();
      else holdTween.pause();
    }
    [floatTween, driftTween].forEach((t) => {
      if (!t) return;
      if (motionOn) t.resume();
      else t.pause();
    });
    floaters.setActive(motionOn);
  }

  /* ---------- pausa (WCAG 2.2.2) ---------- */
  // sem autoplay não há o que pausar nem progresso para mostrar
  if (reducedMotion || !C.autoplay) $(".hero__timer").hidden = true;
  pauseBtn.addEventListener("click", () => {
    userPaused = !userPaused;
    pauseBtn.setAttribute("aria-pressed", String(userPaused));
    pauseBtn.setAttribute("aria-label", userPaused ? "Continuar animação" : "Pausar animação");
    syncPlayback();
  });
  root.addEventListener("focusin", () => {
    focusInside = true;
    syncPlayback();
  });
  root.addEventListener("focusout", (e) => {
    if (root.contains(e.relatedTarget as Node | null)) return;
    focusInside = false;
    syncPlayback();
  });

  /* ---------- navegação: clique, teclado, swipe e scroll ---------- */
  document.addEventListener("keydown", (e) => {
    if (!inView || e.altKey || e.ctrlKey || e.metaKey || e.defaultPrevented) return;
    const t = e.target as HTMLElement | null;
    const outside = t && t !== document.body && !root.contains(t);
    if (outside || t?.closest("input, textarea, select, [contenteditable='true']")) return;
    if (e.key === "ArrowRight") goTo(target + 1, "user");
    if (e.key === "ArrowLeft") goTo(target - 1, "user");
  });

  let sx: number | null = null;
  let sy = 0;
  root.addEventListener("pointerdown", (e) => {
    if ((e.target as HTMLElement).closest("a, button")) return;
    sx = e.clientX;
    sy = e.clientY;
  });
  root.addEventListener("pointerup", (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    sx = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) goTo(target + (dx < 0 ? 1 : -1), "user");
  });
  root.addEventListener("pointercancel", () => (sx = null));

  if (!reducedMotion) {
    let lastStep = 0;
    let idle = 0;
    ScrollTrigger.create({
      trigger: root,
      start: "top top",
      end: () => `+=${Math.round(N * (mq.matches ? C.scroll.perSlideMobile : C.scroll.perSlide) * window.innerHeight)}`,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate(self) {
        floaters.setProgress(self.progress);
        const step = scrollStep(self.progress, N);
        if (step !== lastStep) {
          const delta = step - lastStep;
          lastStep = step;
          if (started) goTo(target + delta, "user");
        }
        // enquanto a pessoa rola, o autoplay espera
        if (!started || busy) return;
        holdTween?.pause(0);
        window.clearTimeout(idle);
        idle = window.setTimeout(hold, 400);
      },
    });
  }

  document.addEventListener("visibilitychange", () => {
    pageVisible = !document.hidden;
    syncPlayback();
  });
  new IntersectionObserver(([entry]) => {
    inView = Boolean(entry?.isIntersecting);
    syncPlayback();
  }).observe(root);

  // o hero usa 100svh, que não muda quando a barra de endereço do celular encolhe: refazer é barato
  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      dust.resize();
      if (busy) return; // a troca em curso já calcula a posição do próximo sabor
      const s = slide(index);
      current = layout(s);
      applyWord(current);
      sizeProduct(s, current);
      gsap.set(move, { y: productY(current) });
    }, 120);
  });

  /* ---------- estado inicial (o primeiro slide já vem no HTML) ---------- */
  const first = slide(0);
  setBg(layers.cur, first);
  render(first);
  // pré-carrega os outros sabores no arquivo que o navegador vai escolher (sizes antes do srcset)
  const preload = (sm: string, big: string, w: number, sizes: string) => {
    const im = new Image();
    im.decoding = "async";
    im.sizes = sizes;
    im.srcset = `${asset(sm)} ${Math.round(w / 2)}w, ${asset(big)} ${w}w`;
  };
  S.slice(1).forEach((s) => {
    const p = s.product;
    if (p.kind === "image") return preload(p.srcSm, p.src, p.width, pairEl.style.width || "60vw");
    const ph = PRODUCTS[p.id];
    preload(ph.tinSm, ph.tin, ph.tinPx, tinEl.sizes);
    preload(ph.lidSm, ph.lid, ph.lidPx, lidEl.sizes);
  });
  root.classList.add("is-ready");
  if (!reducedMotion) {
    closePair(first, current!);
    gsap.set(wordEl.children, { yPercent: 115, opacity: 0 });
    gsap.set(move, { opacity: 0 });
    gsap.set(fadeIns, { opacity: 0 });
  }

  return {
    start() {
      if (started) return;
      started = true;
      if (reducedMotion) {
        startFloat();
        hold();
        return;
      }
      const L = current!;
      const [ex, ey] = ENTER_VEC[first.enter];
      gsap.set(move, { opacity: 1 });
      const tl = gsap.timeline({
        onComplete: () => {
          startFloat();
          hold();
        },
      });
      tl.to(wordEl.children, { yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.06, ease: "power3.out" }, 0.1)
        .from(
          move,
          {
            x: ex * root.clientWidth * 0.6,
            y: productY(L) + ey * root.clientHeight * 0.5,
            rotation: first.rotate + 40,
            scale: 0.7,
            filter: mq.matches ? "blur(0px)" : "blur(6px)",
            duration: 0.9,
            ease: "back.out(1.25)",
          },
          0.2,
        )
        .add(() => burst(first), 0.95)
        .fromTo(fadeIns, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: "power2.out" }, 0.5)
        .add(openTimeline(first), 1.05);
    },
  };
}
