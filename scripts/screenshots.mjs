/**
 * Screenshots de verificação (PROJETO.md › Responsividade): 375, 768, 1280 e 1440 px, mais dois
 * celulares com a altura real do Safari (barras abertas = 100svh): iPhone SE e iPhone 13.
 * Uso: npm run build && npm run shots [-- --only=1440,375s --reduced=1 --base=http://localhost:4173/]
 * Requer o Chrome instalado; salva em .shots/ (fora do git). Além das imagens, confere os bugs de
 * layout já vistos: palavra do hero coberta pelo produto (no máximo a base das letras), palavra sobre o
 * painel ou fora da tela, rolagem horizontal, CTA dos destaques fora da tela ou sob a barra de WhatsApp
 * e header sem fundo no fim da página.
 */
import { chromium } from "playwright-core";
import { preview } from "vite";
import { mkdirSync, existsSync } from "node:fs";

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")));
const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
].find((p) => existsSync(p));

const VIEWPORTS = [
  { name: "375", width: 375, height: 812, mobile: true },
  { name: "375s", width: 375, height: 548, mobile: true }, // iPhone SE no Safari
  { name: "390s", width: 390, height: 664, mobile: true }, // iPhone 13/14 no Safari
  { name: "768", width: 768, height: 1024, mobile: true },
  { name: "1280", width: 1280, height: 800, mobile: false },
  { name: "1440", width: 1440, height: 900, mobile: false },
].filter((v) => !args.only || args.only.split(",").includes(v.name));

const OUT = ".shots";
mkdirSync(OUT, { recursive: true });

// servidor do próprio Vite (API, sem processo filho: no Windows o kill() deixava o preview órfão)
let server = null;
let base = args.base;
if (!base) {
  server = await preview({ preview: { port: 4173, strictPort: false, open: false }, logLevel: "warn" });
  base = server.resolvedUrls?.local[0] ?? "http://localhost:4173/";
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const problems = [];

try {
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.mobile ? 2 : 1,
      isMobile: vp.mobile && vp.width < 700,
      hasTouch: vp.mobile,
      reducedMotion: args.reduced ? "reduce" : "no-preference",
      locale: "pt-BR",
    });
    const page = await context.newPage();
    const problem = (msg) => problems.push(`[${vp.name}] ${msg}`);
    page.on("console", (m) => m.type() === "error" && problem(`console: ${m.text()}`));
    page.on("pageerror", (e) => problem(`pageerror: ${e.message}`));
    page.on("requestfailed", (r) => problem(`falhou: ${r.url()}`));

    await page.goto(base, { waitUntil: "networkidle" });
    const shot = (label) => page.screenshot({ path: `${OUT}/${vp.name}-${label}.png` });
    await sleep(400);
    await shot("00-age-gate");

    await page.click("[data-age-yes]");
    await page.mouse.move(0, 0); // o ponteiro parado no meio da tela deixava um card em :hover
    await sleep(2600); // entrada + a tampa abrindo
    await shot("01-hero");

    // a palavra do hero cabe na tela, não invade o painel (desktop) e o produto cobre no máximo a base dela
    // (a tinta das maiúsculas da Big Shoulders vai de 0,015 em acima da caixa até 0,8 em; ver placement.ts)
    const checkHero = async (label) => {
      const r = await page.evaluate(() => {
        const word = document.querySelector("[data-hero-word]");
        const info = document.querySelector("[data-hero-info]")?.getBoundingClientRect();
        const parts = [...document.querySelectorAll("[data-hero-tin], [data-hero-lid]")]
          .filter((el) => !el.hidden)
          .map((el) => el.getBoundingClientRect());
        if (!word || !info || !parts.length) return null;
        const w = word.getBoundingClientRect();
        const fs = parseFloat(getComputedStyle(word).fontSize);
        const inkTop = w.top - 0.015 * fs;
        const productTop = Math.min(...parts.map((p) => p.top));
        return {
          left: w.left,
          right: w.right,
          infoRight: info.right,
          vw: window.innerWidth,
          visible: (productTop - inkTop) / (0.8 * fs),
        };
      });
      if (!r) return problem(`${label}: hero sem palavra ou produto`);
      if (!vp.mobile && r.left < r.infoRight) problem(`${label}: palavra sobre o painel de textos`);
      if (r.left < -1 || r.right > r.vw + 1) problem(`${label}: palavra sai da tela`);
      // 0,16 de sobreposição no config; a folga cobre a caixa da imagem girada (maior que o círculo)
      if (r.visible < 0.74) problem(`${label}: produto cobre ${Math.round((1 - r.visible) * 100)}% da palavra`);
    };
    await checkHero("01-hero");

    // posições reais: os pins somam espaçadores, então o passo de cada um sai do .pin-spacer
    const pos = await page.evaluate(() => {
      const top = (sel) => {
        const el = document.querySelector(sel);
        return el ? el.getBoundingClientRect().top + window.scrollY : 0;
      };
      const pinStep = (sel, count) => {
        const spacer = document.querySelector(sel)?.parentElement;
        if (!spacer?.classList.contains("pin-spacer") || count === 0) return 0;
        return (spacer.offsetHeight - window.innerHeight) / count;
      };
      return {
        vh: window.innerHeight,
        heroStep: pinStep("#inicio", document.querySelectorAll(".swatch").length),
        slides: document.querySelectorAll(".swatch").length,
        // centro do palco de cada destaque (sem pin: a posição é a do documento)
        dqStages: [...document.querySelectorAll(".dq-item__stage")].map((el) => {
          const r = el.getBoundingClientRect();
          return r.top + window.scrollY + r.height / 2;
        }),
        catalogo: top("#catalogo"),
        fabrica: top("#fabrica"),
        revenda: top("#revenda"),
        faq: top("#faq"),
        max: document.documentElement.scrollHeight - window.innerHeight,
      };
    });
    const go = async (y, wait = 1300) => {
      await page.evaluate((v) => window.scrollTo(0, v), Math.round(y));
      await sleep(wait);
    };

    // cada sabor do hero: o meio do trecho de scroll dele (espera a troca e a tampa abrir)
    for (let k = 1; pos.heroStep > 0 && k < pos.slides; k++) {
      await go(pos.heroStep * k, 2600);
      await shot(`0${k + 1}-hero-${k + 1}`);
      await checkHero(`0${k + 1}-hero-${k + 1}`);
    }

    // destaques: cada latinha abrindo (palco a 3/4 da tela) e aberta (palco no meio)
    for (const [i, center] of pos.dqStages.entries()) {
      for (const [label, at] of [
        [`1${i * 2}-destaque${i + 1}-abrindo`, 0.78],
        [`1${i * 2 + 1}-destaque${i + 1}-aberta`, 0.5],
      ]) {
        await go(center - pos.vh * at, 1500);
        await shot(label);
        // o botão do sabor, quando está na tela, fica livre da barra de WhatsApp
        const cta = await page.evaluate((n) => {
          const btn = document.querySelectorAll(".dq-item__cta")[n];
          const bar = document.querySelector("[data-wa-bar].is-visible");
          if (!btn) return null;
          const b = btn.getBoundingClientRect();
          const w = bar && getComputedStyle(bar).display !== "none" ? bar.getBoundingClientRect() : null;
          return { top: b.top, bottom: b.bottom, vh: window.innerHeight, bar: w ? w.top : null };
        }, i);
        const onScreen = cta && cta.top < cta.vh && cta.bottom > 0;
        if (onScreen && cta.bar !== null && cta.bottom > cta.bar) problem(`${label}: CTA sob a barra de WhatsApp`);
      }
    }

    await go(pos.catalogo);
    await shot("20-catalogo");
    await go(pos.catalogo + pos.vh * 0.85);
    await shot("21-catalogo-grade");
    await go(pos.fabrica);
    await shot("30-fabrica");
    await go(pos.revenda);
    await shot("40-revenda");
    await go(pos.revenda + pos.vh * 0.8);
    await shot("41-revenda-form");
    await go(pos.faq);
    await shot("50-faq");
    await go(pos.max, 900);
    await shot("60-rodape");
    // nada pode criar rolagem lateral (no celular ela aparece como a página "dançando" para o lado)
    const wide = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (wide > 1) problem(`rolagem horizontal de ${wide}px`);
    // no fim da página o header continua com fundo (o trigger fica inativo em progress 1)
    const solid = await page.evaluate(() => document.querySelector("[data-site-header]")?.classList.contains("is-solid"));
    if (!solid) problem("60-rodape: header sem fundo no fim da página");
    await context.close();
    console.log(`ok ${vp.name}`);
  }
} finally {
  await browser.close();
  await server?.close();
}

if (problems.length) {
  console.log("\nProblemas:\n" + [...new Set(problems)].join("\n"));
  process.exitCode = 1;
} else {
  console.log("\nSem erros de console, de página, de rede ou de layout conhecidos.");
}
