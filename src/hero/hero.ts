/* ================= MOTOR DO HERO CINÉTICO =================
   Portado de docs/referencias/hero-rape-xingu/index.html, mesma lógica de animação.
   Diferenças pedidas no PROJETO.md:
   - a roda do mouse não é sequestrada: o hero fica preso (ScrollTrigger) por N trechos
     de scroll, cada trecho avança um sabor, e depois a página é liberada;
   - o autoplay continua valendo enquanto ninguém rola.
   Os textos, imagens, cores e tempos ficam em hero.config.ts. */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollStep, wrapIndex } from "@/lib/progress";
import { setRichText } from "@/lib/dom";
import { HERO_CONFIG, type EnterFrom, type HeroPlacement, type HeroSlide } from "./hero.config";
import { createDust } from "./dust";

gsap.registerPlugin(ScrollTrigger);

const asset = (src: string) => `${import.meta.env.BASE_URL}${src}`;

const MQ_MOBILE = "(max-width: 760px), (orientation: portrait) and (max-width: 1100px)";
const MQ_TABLET = "(min-width: 761px) and (max-width: 1180px) and (orientation: landscape)";

/** direção de entrada → vetor (a saída usa o oposto) */
const ENTER_VEC: Record<EnterFrom, [number, number]> = {
  right: [1, -0.55],
  left: [-1, -0.45],
  top: [0.35, -1],
  bottom: [-0.3, 1],
};

type Source = "auto" | "user";

export interface HeroController {
  /** Toca a entrada e libera o autoplay. Chamado depois do age gate. */
  start(): void;
}

export function initHero(root: HTMLElement, { reducedMotion }: { reducedMotion: boolean }): HeroController {
  const C = HERO_CONFIG;
  const S = C.slides;
  const N = S.length;
  const $ = <T extends Element = HTMLElement>(sel: string): T => {
    const el = root.querySelector<T>(sel);
    if (!el) throw new Error(`[hero] elemento não encontrado: ${sel}`);
    return el;
  };

  const wordEl = $("[data-hero-word]");
  const img = $<HTMLImageElement>("[data-hero-img]");
  const move = $("[data-hero-move]");
  const flt = $("[data-hero-float]");
  const bar = $("[data-hero-progress]");
  const info = $("[data-hero-info]");
  const pickerLabel = $("[data-hero-picker-label]");
  const pauseBtn = $<HTMLButtonElement>("[data-hero-pause]");
  const layers = { cur: $("[data-hero-layer='current']"), nxt: $("[data-hero-layer='next']") };
  const infoItems = Array.from(info.querySelectorAll<HTMLElement>("[data-hero-item]"));
  const fadeIns = [...infoItems, $(".hero__picker"), $(".hero__bottom")];
  const dust = createDust($<HTMLCanvasElement>("[data-hero-dust]"), root);

  const mq = matchMedia(MQ_MOBILE);
  const tablet = matchMedia(MQ_TABLET);
  const slide = (i: number) => S[wrapIndex(i, N)] as HeroSlide;

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

  // pré-carrega as imagens dos slides
  S.forEach((s) => {
    const i = new Image();
    i.decoding = "async";
    i.src = asset(s.image.src);
  });

  gsap.set(wordEl, { xPercent: -50, yPercent: -50, x: 0, y: 0 }); // centralização feita pelo GSAP

  const minDim = () => Math.min(root.clientWidth, root.clientHeight * (mq.matches ? 1 : 1.25));
  const pos = (s: HeroSlide): HeroPlacement => {
    const p = { ...s.product, ...(mq.matches && s.mobile ? s.mobile : {}) };
    if (tablet.matches) p.size *= C.tabletScale;
    return p;
  };
  const px = (v: number) => (v / 100) * minDim();
  const blurOn = () => !mq.matches; // blur animado pesa no celular

  function setBg(layer: HTMLElement, s: HeroSlide) {
    layer.style.setProperty("--from", s.colors.from);
    layer.style.setProperty("--to", s.colors.to);
  }

  function placeProduct(s: HeroSlide) {
    const p = pos(s);
    root.style.setProperty("--pw", `${px(p.size)}px`);
    gsap.set(move, { x: px(p.x), y: px(p.y), rotation: p.rotate, scale: 1, opacity: 1, filter: "blur(0px)" });
  }

  function fitWord() {
    wordEl.style.fontSize = "100px";
    const w = wordEl.scrollWidth || 1;
    const targetW = root.clientWidth * (mq.matches ? 0.92 : tablet.matches ? 0.4 : 0.46);
    const maxH = root.clientHeight * (mq.matches ? 0.3 : 0.5);
    wordEl.style.fontSize = `${Math.min((100 * targetW) / w, maxH / 0.8)}px`;
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
    fitWord();
  }

  function setImage(s: HeroSlide) {
    img.src = asset(s.image.src);
    img.width = s.image.width;
    img.height = s.image.height;
  }

  function setInfo(s: HeroSlide) {
    const [line, name, comp] = infoItems;
    if (line) line.textContent = s.line;
    if (name) name.textContent = s.name;
    if (comp) setRichText(comp, s.composition);
    pickerLabel.textContent = s.swatchLabel;
    swatches.forEach((b, i) => b.setAttribute("aria-pressed", String(i === index)));
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
    floatTween = gsap.to(flt, { y: -12, rotation: 1.6, duration: 1.6, ease: "sine.inOut", yoyo: true, repeat: -1 });
    driftTween = gsap.fromTo(
      wordEl,
      { xPercent: -50 },
      { xPercent: -51.5, duration: C.holdSeconds + C.transitionSeconds, ease: "none" },
    );
    syncPlayback();
  }

  function burst(s: HeroSlide) {
    if (reducedMotion) return;
    const p = pos(s);
    dust.burst(
      root.clientWidth / 2 + px(p.x),
      root.clientHeight / 2 + px(p.y),
      px(p.size) / 2,
      s.dust,
      mq.matches ? 70 : 140,
    );
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
    const pTo = pos(to);
    const pf = pos(from);
    const W = root.clientWidth;
    const H = root.clientHeight;
    const [ex, ey] = ENTER_VEC[to.enter];
    const ox = 50 + (px(pf.x) / W) * 100;
    const oy = 50 + (px(pf.y) / H) * 100;
    const blur = (v: number) => (blurOn() ? `blur(${v}px)` : "blur(0px)");

    if (reducedMotion) {
      gsap.to([wordEl, move, ...infoItems], {
        opacity: 0,
        duration: 0.25,
        onComplete: () => {
          index = next;
          setBg(layers.cur, to);
          buildWord(to);
          placeProduct(to);
          setImage(to);
          setInfo(to);
          gsap.to([wordEl, move, ...infoItems], { opacity: 1, duration: 0.3, onComplete: done });
        },
      });
      return;
    }

    setBg(layers.nxt, to);
    const tl = gsap.timeline({ defaults: { ease: "power3.inOut" }, onComplete: done });

    // 1. saída: produto escapa na diagonal oposta, letras sobem em cascata
    tl.to(
      move,
      {
        x: px(pf.x) - ex * W * 0.55,
        y: px(pf.y) - ey * H * 0.45,
        rotation: pf.rotate - ex * 38,
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

      // 3. troca de conteúdo no meio
      .add(() => {
        index = next;
        buildWord(to);
        setInfo(to);
        setImage(to);
        root.style.setProperty("--pw", `${px(pTo.size)}px`);
        gsap.set(move, {
          x: px(pTo.x) + ex * W * 0.6,
          y: px(pTo.y) + ey * H * 0.5,
          rotation: pTo.rotate + ex * 40,
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
      .to(
        move,
        { x: px(pTo.x), y: px(pTo.y), rotation: pTo.rotate, scale: 1, filter: "blur(0px)", duration: T * 0.62, ease: "back.out(1.25)" },
        T * 0.56,
      )
      .add(() => burst(to), T * 1.02)
      .to(infoItems, { y: 0, opacity: 1, duration: T * 0.4, stagger: 0.05, ease: "power2.out" }, T * 0.78)
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

  /** Autoplay e flutuação só rodam com o hero visível, a aba ativa, sem pausa e sem foco no carrossel. */
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
  }

  /* ---------- pausa (WCAG 2.2.2) ---------- */
  if (reducedMotion || !C.autoplay) pauseBtn.hidden = true;
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

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      dust.resize();
      fitWord();
      if (!busy) placeProduct(slide(index));
    }, 120);
  });

  /* ---------- estado inicial (o primeiro slide já vem no HTML) ---------- */
  const first = slide(0);
  setBg(layers.cur, first);
  buildWord(first);
  placeProduct(first);
  setInfo(first);
  root.classList.add("is-ready");
  if (!reducedMotion) {
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
      const p = pos(first);
      const [ex, ey] = ENTER_VEC[first.enter];
      gsap.set(move, { opacity: 1 });
      gsap
        .timeline({
          onComplete: () => {
            startFloat();
            hold();
          },
        })
        .to(wordEl.children, { yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.06, ease: "power3.out" }, 0.1)
        .from(
          move,
          {
            x: px(p.x) + ex * root.clientWidth * 0.6,
            y: px(p.y) + ey * root.clientHeight * 0.5,
            rotation: p.rotate + 40,
            scale: 0.7,
            filter: blurOn() ? "blur(6px)" : "blur(0px)",
            duration: 0.9,
            ease: "back.out(1.25)",
          },
          0.2,
        )
        .add(() => burst(first), 0.95)
        .fromTo(fadeIns, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: "power2.out" }, 0.5);
    },
  };
}
