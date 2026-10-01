# Handoff — Landing Rapé Xingu

Estado em **2026-10-01**, fim da 2ª sessão (revisão responsiva): prévia revisada e aprovada pelo usuário ("muito bom"),
trabalho mesclado no `main`. Leia junto com `PROJETO.md` (spec) e `docs/copy.md` (texto oficial).

## Como rodar

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # tsc + vite build → dist/
npm test             # vitest (42 testes)
npm run lint && npm run typecheck
npm run build && npm run shots                  # screenshots em .shots/ (Chrome instalado)
npm run deploy:pages                            # prévia no GitHub Pages (exige tudo commitado)
```

**Prévia para revisão:** https://gabrielbotelhoeng.github.io/Rap-_Xingu/ — build com `noindex` (`VITE_NOINDEX=1`)
publicado no branch `gh-pages` por `scripts/deploy-pages.mjs`; o Pages leva ~1 min para atualizar depois do deploy.
Não é o site de produção: esse continua sendo o passo de deploy em Vercel/Netlify, com `VITE_SITE_URL`.
Para conferir a prévia no ar: `npm run shots -- --base=https://gabrielbotelhoeng.github.io/Rap-_Xingu/`.

Opções do `shots`: `--only=375,375s,390s,768,1280,1440`, `--reduced=1` (testa prefers-reduced-motion).
`375s` e `390s` são iPhone SE e iPhone 13 com a altura real do Safari (barras abertas = `100svh`): 375×548 e 390×664.
O headless força reduced-motion por padrão; o script já liga `reducedMotion: "no-preference"`.
Além das imagens, o script falha (exit 1) se achar erro de console/rede ou um dos bugs de layout já vistos:
CTA dos destaques fora da tela ou sob a barra de WhatsApp, palavra do hero sobre o painel ou fora da tela,
header sem fundo no fim da página. O preview sobe pela API do Vite e é encerrado no fim (a versão antiga, com
`spawn`, deixava um `vite preview` órfão na porta 4173 no Windows).

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
  `frames` em `destaques.config.ts` (testado com frames sintéticos na sessão 2). `gsap.matchMedia()` desktop/mobile/reduce.
  Sem JS ou com movimento reduzido: vitrine estática.
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

## Sessão 2 — revisão responsiva (2026-10-01)

Shots em 375, 768, 1280 e 1440 revisados, mais medições em 12 tamanhos (celulares com a altura real do Safari e do
Chrome, 1024×768, 1280×720, 1366×657). Corrigido:

1. **Hero no celular**: em telas baixas (Safari com barras: 375×548, 390×664; 360×640, 430×740) a latinha cobria o painel
   de textos. Novo `src/hero/placement.ts`: as posições do `hero.config.ts` continuam sendo o ideal, e o motor só sobe ou
   encolhe o produto quando ele encostaria no painel (folga de 8 px), sem subir além do terço de cima da palavra. A conta
   inclui o deslocamento que o giro do protótipo dá à imagem (até ~40 px). 12 testes em `tests/hero-placement.test.ts`.
2. **Hero no desktop**: entre ~1180 e 1440 px a palavra e o produto invadiam o painel (o "Ver catálogo" ficava embaixo
   do "XINGU" e da latinha). Agora os dois respeitam a largura livre entre o painel e o seletor (folga de 24 px).
3. **Hero com movimento reduzido**: a palavra saía gigante (500 px), cobrindo o painel e o seletor. O reset de
   `prefers-reduced-motion` (`transition-duration: 0.01ms` em `*`) criava uma transição em toda mudança de estilo,
   e o `fitWord` media o tamanho antigo. Agora é `0s` (`base.css`). Sem autoplay, o timer (pausa + progresso) fica escondido.
4. **`hidden` não escondia** quando o CSS dava `display` ao elemento: no age gate, depois de "Não, sair", a pergunta e o
   botão "Sim, entrar" continuavam na tela; o botão de pausa aparecia sem autoplay. Regra global
   `[hidden] { display: none !important }` em `base.css`.
5. **Destaques**: o "Quero revender este sabor" ficava cortado ou em cima da navegação 01/02/03 em 1280×720 e 1280×800
   (Tradicional da Aldeia, com o nome em 2 linhas) e embaixo da barra de WhatsApp em todos os celulares. Os textos agora
   ficam empilhados no grid (a linha reserva a altura do maior) e, no celular, o palco usa a sobra da linha.
   A barra de WhatsApp também some nos destaques (lá o botão principal é o do sabor).
6. **Frame-sequence** (bugs latentes, que só apareceriam com os frames): o canvas ficava com altura 0 (a lata, que dá a
   altura da caixa, saía do layout); ao voltar a um sabor, o canvas compartilhado mostrava o frame de outro; e frames de
   outro sabor que terminavam de carregar desenhavam por cima do sabor na tela. Agora usa `visibility` em vez de
   `display`/`hidden`, e `FrameSequence.setActive()` deixa só o sabor na tela desenhar. Testado com frames sintéticos
   (19 imagens diferentes nos sabores 1 e 3): frame certo em cada passo, na ida e na volta, e nenhum desenho fora de hora.
7. **Header sem fundo no fim da página** (o FAQ passava por baixo do logo): no fim o trigger fica inativo (`progress 1`);
   agora decide por `progress > 0`, também no `onRefresh`.
8. **Blur do header não funcionava no Chrome**: com `backdrop-filter` e `-webkit-backdrop-filter` escritos à mão
   (o prefixado por último), o Lightning CSS do build mantinha só o `-webkit-`. Agora fica só a propriedade padrão e o build gera as duas.
9. **Hover grudado no toque**: no celular, desmarcar um sabor no formulário deixava a borda do `:hover` (parecia marcado).
   Hovers de chips, filtros, cards, botões e pílulas agora só valem com `@media (hover: hover)`.
10. **Fontes antes de medir**: o hero espera também Fraunces e Manrope (no celular a altura do painel entra na posição da latinha).
11. A legenda "Sabores de interesse" alinhada com os outros rótulos (o navegador dava 2 px de recuo).

Também conferido (item 2 da sessão 1): os destaques 2 e 3 com tampa provisória e ervas, e o scrub reverso. O estado de
cada sabor (opacidade e `transform` da tampa, textos, ervas, luz, navegação) é idêntico na ida e na volta pela mesma posição,
em 1280 e 390 px. Verificado no fim: build, lint, typecheck, 41 testes e `npm run shots` nos 6 tamanhos, com e sem
movimento reduzido, sem erro de console, rede ou layout.

**Decisões desta sessão** (o usuário revisou a prévia com elas e aprovou sem objeções; nenhuma foi discutida em separado):

- Barra fixa de WhatsApp escondida também nos destaques (antes, só no hero e no formulário).
- No celular, o hero pode subir ou diminuir a latinha de um sabor para não cobrir o texto; o `hero.config.ts` segue como posição ideal.

## Próximos passos (em ordem)

1. Lighthouse mobile (meta ≥ 90 performance e acessibilidade). Candidatos se faltar: `mix-blend-mode` do grão do hero,
   tamanho das ervas (erva-doce 87 KB), pré-carregar a fonte da palavra do hero.
2. Testar em iPhone com Safari real (pin + `100svh` + barra de endereço que encolhe ao rolar). O hero e os destaques
   foram medidos com a altura de barras abertas, o pior caso.
3. Gerar `public/og.jpg` (1200×630, latinha sobre fundo mata) — o meta `og:image` já aponta para ele. Definir `VITE_SITE_URL` no deploy.
4. Deploy (Vercel ou Netlify, estático). Só com o ok do usuário.
5. Quando chegarem os assets do dono: logo original em `assets/brand/` (trocar o "Rapé Xingu" em Fraunces do header/rodapé),
   fotos das latinhas (trocar `photo` em `src/content/catalog.ts` e `lid` em `destaques.config.ts`), fotos da fábrica
   (trocar os `.ph-photo` no `index.html`), confirmação dos 3 mais vendidos, advertência sanitária oficial e dados entre colchetes.
6. Com fotos fechada/aberta dos 3 mais vendidos: pipeline do MD (remove_background → image-to-video 16:9 e 9:16 → ffmpeg → `public/frames/`).
   Mostrar o plano e o custo antes. O motor já roda com frames (testado na sessão 2); os frames 16:9 são desenhados em
   "cover" num palco quase quadrado, então a lata precisa estar centrada no vídeo, com margem nas laterais.

## Mapa

| O quê | Onde |
| --- | --- |
| Textos e sabores | `src/content/catalog.ts`, `src/content/site.ts`, `src/destaques/destaques.config.ts`, `index.html` |
| Hero (tudo editável) | `src/hero/hero.config.ts` |
| Encaixe do produto do hero na tela | `src/hero/placement.ts` (puro, com testes) |
| Verificação visual + checagens de layout | `scripts/screenshots.mjs` (`npm run shots`) |
| Prévia no GitHub Pages | `scripts/deploy-pages.mjs` (`npm run deploy:pages`), branch `gh-pages` |
| Estilos (tokens do MD) | `src/styles/tokens.css` + um CSS por área |
| Geração de HTML no build | `build/content-plugin.ts`, `src/content/render.ts` |
| Imagens | `public/img/` (`latas/`, `ervas/`, fotos do hero na raiz) |
| Originais e gerações | `assets/raw/` (`higgsfield/ervas-sprite-v1.png`) |
| Story e checklist | `docs/stories/1.1.landing-page.story.md` |
