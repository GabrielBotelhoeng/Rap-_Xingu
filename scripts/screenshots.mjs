/**
 * Screenshots de verificação (PROJETO.md › Responsividade): 375, 768, 1280 e 1440 px, mais dois
 * celulares com a altura real do Safari (barras abertas = 100svh): iPhone SE e iPhone 13.
 * Uso: npm run build && npm run shots [-- --only=1440,375s --reduced=1 --base=http://localhost:4173/]
 * Requer o Chrome instalado; salva em .shots/ (fora do git). Além das imagens, confere os bugs de
 * layout já vistos (CTA dos destaques fora da tela ou sob a barra de WhatsApp, header sem fundo).
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
    await sleep(2200);
    await shot("01-hero");
    // a palavra do hero cabe na tela e, no desktop, não invade o painel de textos
    // (com movimento reduzido ela saía gigante: o fitWord media durante uma transição de CSS)
    const word = await page.evaluate(() => {
      const w = document.querySelector("[data-hero-word]")?.getBoundingClientRect();
      const i = document.querySelector("[data-hero-info]")?.getBoundingClientRect();
      return w && i ? { left: w.left, right: w.right, infoRight: i.right, vw: window.innerWidth } : null;
    });
    if (word && !vp.mobile && word.left < word.infoRight) problem(`01-hero: palavra sobre o painel de textos`);
    if (word && (word.left < -1 || word.right > word.vw + 1)) problem(`01-hero: palavra sai da tela`);

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
        destaques: top("#destaques"),
        dqStep: pinStep("[data-dq]", document.querySelectorAll("[data-dq-item]").length),
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

    // cada sabor do hero: o meio do trecho de scroll dele
    for (let k = 1; pos.heroStep > 0 && k < pos.slides; k++) {
      await go(pos.heroStep * k, 1600);
      await shot(`0${k + 1}-hero-${k + 1}`);
    }

    const dq = [
      ["10-destaque1-fechada", 0, 0.08],
      ["11-destaque1-abrindo", 0, 0.42],
      ["12-destaque1-aberta", 0, 0.8],
      ["13-destaque2-aberta", 1, 1.8],
      ["14-destaque3-aberta", 2, 2.8],
    ];
    const dqStep = pos.dqStep || pos.vh;
    for (const [label, i, f] of dq) {
      await go(pos.destaques + dqStep * f, 1500);
      await shot(label);
      // o botão do sabor na tela tem que estar inteiro e livre da barra de WhatsApp
      const cta = await page.evaluate((n) => {
        const btn = document.querySelector(`.destaques.is-animated [data-dq-item="${n}"] .dq__cta`);
        const bar = document.querySelector("[data-wa-bar].is-visible");
        if (!btn) return null;
        const b = btn.getBoundingClientRect();
        const w = bar && getComputedStyle(bar).display !== "none" ? bar.getBoundingClientRect() : null;
        return { bottom: b.bottom, vh: window.innerHeight, bar: w ? w.top : null };
      }, i);
      if (cta && cta.bottom > cta.vh) problem(`${label}: CTA sai da tela (${Math.round(cta.bottom)} > ${cta.vh})`);
      if (cta?.bar !== null && cta?.bar !== undefined && cta.bottom > cta.bar) problem(`${label}: CTA sob a barra de WhatsApp`);
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
