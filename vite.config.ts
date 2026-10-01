import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";
import { contentPlugin } from "./build/content-plugin.ts";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    // caminhos relativos: o build funciona na raiz do domínio (Vercel/Netlify) ou numa subpasta
    base: "./",
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    plugins: [contentPlugin({ siteUrl: env.VITE_SITE_URL ?? "", noindex: env.VITE_NOINDEX === "1" })],
    build: {
      target: "es2020",
      cssCodeSplit: false,
    },
    test: {
      environment: "node",
      include: ["tests/**/*.test.ts"],
    },
  };
});
