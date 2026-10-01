/**
 * Prévia no GitHub Pages: gera o build com noindex (VITE_NOINDEX=1) e publica dist/ no branch gh-pages.
 * Uso: npm run deploy:pages
 * Endereço: https://gabrielbotelhoeng.github.io/Rap-_Xingu/ (o GitHub leva ~1 min para atualizar)
 *
 * - Só publica com a árvore de trabalho limpa: o site no ar sempre corresponde a um commit.
 * - Não usa push --force: cada deploy é um commit novo em cima do gh-pages (o primeiro cria o branch órfão).
 * - DEPLOY_TRAILERS (opcional) é anexado à mensagem do commit de deploy.
 * O site de produção (Vercel/Netlify, com VITE_SITE_URL) é outro passo — ver docs/HANDOFF.md.
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const BRANCH = "gh-pages";
const URL_PAGES = "https://gabrielbotelhoeng.github.io/Rap-_Xingu/";

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: "utf8", ...opts });
  if (r.status !== 0) {
    const out = `${r.stderr ?? ""}${r.stdout ?? ""}`.trim();
    throw new Error(`${cmd} ${args.join(" ")} falhou${out ? `:\n${out}` : ""}`);
  }
  return (r.stdout ?? "").trim();
}
const git = (args, cwd = ROOT) => run("git", args, { cwd });
const gitOk = (args) => spawnSync("git", args, { cwd: ROOT }).status === 0;

// 1. só o que está commitado vai para o ar
const dirty = git(["status", "--porcelain"]);
if (dirty) {
  console.error(`Há mudanças não commitadas — faça o commit antes do deploy:\n${dirty}`);
  process.exit(1);
}
const sha = git(["rev-parse", "--short", "HEAD"]);
const source = git(["rev-parse", "--abbrev-ref", "HEAD"]);

// 2. build da prévia
run("npm", ["run", "build"], { stdio: "inherit", shell: true, env: { ...process.env, VITE_NOINDEX: "1" } });
if (!existsSync(join(ROOT, "dist", "index.html"))) throw new Error("dist/index.html não foi gerado");

// 3. gh-pages num worktree temporário
git(["worktree", "prune"]);
const dir = join(mkdtempSync(join(tmpdir(), "rx-pages-")), "site");
if (gitOk(["ls-remote", "--exit-code", "--heads", "origin", BRANCH])) {
  git(["fetch", "origin", BRANCH]);
  git(["worktree", "add", "-B", BRANCH, dir, `origin/${BRANCH}`]);
} else if (gitOk(["show-ref", "--verify", "--quiet", `refs/heads/${BRANCH}`])) {
  git(["worktree", "add", dir, BRANCH]);
} else {
  git(["worktree", "add", "--orphan", "-b", BRANCH, dir]);
}

try {
  // 4. troca o conteúdo pelo dist/ novo
  for (const name of readdirSync(dir)) if (name !== ".git") rmSync(join(dir, name), { recursive: true, force: true });
  cpSync(join(ROOT, "dist"), dir, { recursive: true });
  writeFileSync(join(dir, ".nojekyll"), ""); // sem Jekyll: o Pages serve os arquivos como estão
  git(["add", "-A"], dir);
  if (spawnSync("git", ["diff", "--cached", "--quiet"], { cwd: dir }).status === 0) {
    console.log(`\nNada mudou desde o último deploy (${sha}).`);
  } else {
    const trailers = process.env.DEPLOY_TRAILERS?.trim();
    const message = `deploy: prévia de ${sha} (${source})${trailers ? `\n\n${trailers}` : ""}`;
    git(["commit", "-q", "-m", message], dir);
    git(["push", "-q", "origin", BRANCH], dir);
    console.log(`\nPublicado ${sha} (${source}) no branch ${BRANCH}.`);
  }
} finally {
  spawnSync("git", ["worktree", "remove", "--force", dir], { cwd: ROOT });
}
console.log(`Endereço: ${URL_PAGES}`);
