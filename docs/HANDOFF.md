# Handoff — Landing Rapé Xingu

Estado em **2026-10-01**, fim da 1ª sessão. Leia junto com `PROJETO.md` (spec) e `docs/copy.md` (texto oficial).

## Como rodar

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # tsc + vite build → dist/
npm test             # vitest (29 testes)
npm run lint && npm run typecheck
npm run build && npm run shots -- --only=1440   # screenshots em .shots/ (Chrome instalado)
```

Opções do `shots`: `--only=375,768,1280,1440`, `--reduced=1` (testa prefers-reduced-motion).
O headless força reduced-motion por padrão; o script já liga `reducedMotion: "no-preference"`.

Repo: `git@github.com:GabrielBotelhoeng/Rap-_Xingu.git` (branch `main`). Esta pasta tem git **próprio**;
o git da raiz do Desktop é outro repo (Nutri_Fit) e a pasta foi posta no `.git/info/exclude` dele.

## Feito

- Vite 8 + TypeScript 6 (o TS 7 quebra o typescript-eslint), GSAP 3.15 + ScrollTrigger, Lenis só no desktop,
  fontes self-hosted (@fontsource: Fraunces opsz, Manrope, Big Shoulders 900).
- Conteúdo em dados (`src/content/*.ts`) e renderizado **no build** por `build/content-plugin.ts`
  (marcadores `<!--@...-->` e `{{...}}` no `index.html`). Catálogo, opções do formulário, destaques e JSON-LD saem estáticos.
- Seções na ordem do MD: age gate (+18, localStorage `rx:maioridade`, script no `<head>` evita piscar),
  header fixo (tom claro/escuro pela seção embaixo, fundo depois do hero, menu mobile), hero cinético,
  destaques, catálogo (filtros), fábrica, revenda (form → wa.me), FAQ, rodapé no campo mata, barra fixa de WhatsApp no celular.
- **Hero**: portado do protótipo (`docs/referencias/hero-rape-xingu/`) para `src/hero/hero.config.ts` + `hero.ts`, mesma lógica.
  Pin do ScrollTrigger por N trechos (`scroll.perSlide`), passos relativos (não pula para trás quando o autoplay já andou),
  autoplay espera o usuário parar de rolar, botão de pausa (WCAG 2.2.2), setas só com foco no hero, swipe, blur desligado no celular.
- **Destaques**: timeline única "scrubada"; a tampa real (foto) sobe e descansa ao lado da lata aberta (recorte do `puro-tabaco-aberto`),
  ervas se afastam, névoa de pó em canvas (`mist.ts`). Motor de frame-sequence pronto (`frame-sequence.ts`): basta preencher
  `frames` em `destaques.config.ts`. `gsap.matchMedia()` desktop/mobile/reduce. Sem JS ou com movimento reduzido: vitrine estática.
  Flag `DESTAQUES_CONFIG.enabled` esconde a seção e o item do menu.
- Higgsfield: 1 geração aprovada (folha com 10 ervas, GPT Image 2.5, 2,75 créditos) → `public/img/ervas/`. Registro em `docs/prompts.md`.
  Projeto Higgsfield "Rapé Xingu — Landing" (`796f29b2-5c26-4bc9-9e45-1b314cff88fd`), saldo ~951 créditos.
- Skills oficiais do GSAP (MIT) instaladas no projeto em `.claude/skills/gsap-*`.
- Verificado: build, lint, typecheck, 29 testes, screenshots 1440px sem erro de console/rede.

## Decisões com o usuário (2026-10-01)

- Higgsfield: sempre mostrar plano (prompt, modelo, proporção, quantidade, custo) e esperar aprovação. Nada de IA para latinha ou fábrica.
- Destaques construídos agora (aprovado), com placeholder para os sabores sem foto.
- Fotos atuais (de revendedores) ficam como provisórias; o usuário vai mandar fotos melhores.
- Sabores sem foto usam a latinha provisória desenhada em CSS (`.tin-ph`), marcada `[foto da latinha]`.
- Texto entre `[colchetes]` aparece com sublinhado pontilhado (`.tbc`) — ainda depende do dono.
- "Pedir no WhatsApp" (catálogo) e "Quero revender este sabor" (destaques) levam ao formulário com o sabor já marcado.
- Mensagem do WhatsApp = template da copy + linhas `CNPJ:` e `WhatsApp:` quando preenchidos (sem sabor marcado, a frase de sabores some).
- Grade do catálogo usa `auto-fill` em vez do `auto-fit` do MD (com 1 card, o auto-fit esticava o card na largura toda).

## Próximos passos (em ordem)

1. **Rodar `npm run shots` em 375, 768 e 1280** e revisar. Só o 1440 foi revisado depois das correções. Pontos de atenção:
   no celular, painel do hero (texto longo do slide "Raiz") pode encostar na latinha; destaques no celular (palco 44svh + texto).
2. Conferir os destaques 2 e 3 (tampa provisória + ervas) e a volta do scroll (scrub reverso) no navegador real.
3. Lighthouse mobile (meta ≥ 90 performance e acessibilidade). Candidatos se faltar: `mix-blend-mode` do grão do hero,
   tamanho das ervas (erva-doce 87 KB), pré-carregar a fonte da palavra do hero.
4. Testar em iPhone com Safari real (pin + `100svh` + barra de endereço).
5. Gerar `public/og.jpg` (1200×630, latinha sobre fundo mata) — o meta `og:image` já aponta para ele. Definir `VITE_SITE_URL` no deploy.
6. Deploy (Vercel ou Netlify, estático). Só com o ok do usuário.
7. Quando chegarem os assets do dono: logo original em `assets/brand/` (trocar o "Rapé Xingu" em Fraunces do header/rodapé),
   fotos das latinhas (trocar `photo` em `src/content/catalog.ts` e `lid` em `destaques.config.ts`), fotos da fábrica
   (trocar os `.ph-photo` no `index.html`), confirmação dos 3 mais vendidos, advertência sanitária oficial e dados entre colchetes.
8. Com fotos fechada/aberta dos 3 mais vendidos: pipeline do MD (remove_background → image-to-video 16:9 e 9:16 → ffmpeg → `public/frames/`).
   Mostrar o plano e o custo antes.

## Mapa

| O quê | Onde |
| --- | --- |
| Textos e sabores | `src/content/catalog.ts`, `src/content/site.ts`, `src/destaques/destaques.config.ts`, `index.html` |
| Hero (tudo editável) | `src/hero/hero.config.ts` |
| Estilos (tokens do MD) | `src/styles/tokens.css` + um CSS por área |
| Geração de HTML no build | `build/content-plugin.ts`, `src/content/render.ts` |
| Imagens | `public/img/` (`latas/`, `ervas/`, fotos do hero na raiz) |
| Originais e gerações | `assets/raw/` (`higgsfield/ervas-sprite-v1.png`) |
| Story e checklist | `docs/stories/1.1.landing-page.story.md` |
