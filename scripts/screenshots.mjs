/**
 * Screenshots de verificação em 375, 768, 1280 e 1440 px (PROJETO.md › Responsividade).
 * Uso: npm run build && npm run shots [-- --only=1440 --base=http://localhost:4173/]
 * Requer o Chrome instalado; salva em .shots/ (fora do git).
 */
import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")));
const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
].find((p) => existsSync(p));

const VIEWPORTS = [
  { name: "375", width: 375, height: 812, mobile: true },
  { name: "768", width: 768, height: 1024, mobile: true },
  { name: "1280", width: 1280, height: 800, mobile: false },
  { name: "1440", width: 1440, height: 900, mobile: false },
].filter((v) => !args.only || args.only.split(",").includes(v.name));

const OUT = ".shots";
mkdirSync(OUT, { recursive: true });

let server;
let base = args.base;
if (!base) {
  server = spawn("npx", ["vite", "preview", "--port", "4173", "--strictPort"], { shell: true, stdio: "ignore" });
  base = "http://localhost:4173/";
  await new Promise((r) => setTimeout(r, 2500));
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
    page.on("console", (m) => m.type() === "error" && problems.push(`[${vp.name}] console: ${m.text()}`));
    page.on("pageerror", (e) => problems.push(`[${vp.name}] pageerror: ${e.message}`));
    page.on("requestfailed", (r) => problems.push(`[${vp.name}] falhou: ${r.url()}`));

    await page.goto(base, { waitUntil: "networkidle" });
    const shot = (label) => page.screenshot({ path: `${OUT}/${vp.name}-${label}.png` });
    await sleep(400);
    await shot("00-age-gate");

    await page.click("[data-age-yes]");
    await sleep(2200);
    await shot("01-hero");

    // posições reais (os pins somam espaçadores)
    const pos = await page.evaluate(() => {
      const top = (sel) => {
        const el = document.querySelector(sel);
        return el ? el.getBoundingClientRect().top + window.scrollY : 0;
      };
      return {
        vh: window.innerHeight,
        destaques: top("#destaques"),
        catalogo: top("#catalogo"),
        fabrica: top("#fabrica"),
        revenda: top("#revenda"),
        faq: top("#faq"),
        footer: top("footer"),
        max: document.documentElement.scrollHeight - window.innerHeight,
      };
    });
    const go = async (y, wait = 1300) => {
      await page.evaluate((v) => window.scrollTo(0, v), Math.round(y));
      await sleep(wait);
    };

    await go(pos.vh * 0.4);
    await shot("02-hero-scroll-1");
    await go(pos.vh * 1.0);
    await shot("03-hero-scroll-2");

    const item = pos.vh * (vp.width <= 900 ? 1 : 1.25);
    const dq = [
      ["10-destaque1-fechada", 0.08],
      ["11-destaque1-abrindo", 0.42],
      ["12-destaque1-aberta", 0.8],
      ["13-destaque2-aberta", 1.8],
      ["14-destaque3-aberta", 2.8],
    ];
    for (const [label, f] of dq) {
      await go(pos.destaques + item * f, 1500);
      await shot(label);
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
    await context.close();
    console.log(`ok ${vp.name}`);
  }
} finally {
  await browser.close();
  server?.kill();
}

if (problems.length) {
  console.log("\nProblemas:\n" + [...new Set(problems)].join("\n"));
  process.exitCode = 1;
} else {
  console.log("\nSem erros de console, de página ou de rede.");
}
