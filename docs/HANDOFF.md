# Handoff — Landing Rapé Xingu

Estado em **2026-10-01**, fim da 3ª sessão: story 1.2 (hero com fotos padronizadas, destaques redesenhados e
celular) implementada no branch `feat/1.2-hero-destaques-mobile` e publicada na **prévia** para o usuário revisar.
O `main` continua na versão aprovada da sessão 2 até o ok dele ("commitar e subir" → fast-forward + push).
Leia junto com `PROJETO.md` (spec), `docs/copy.md` (texto oficial) e `docs/stories/1.2.hero-destaques-mobile.story.md`.

## Como rodar

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # tsc + vite build → dist/
npm test             # vitest (41 testes)
npm run lint && npm run typecheck
npm run build && npm run shots                  # screenshots em .shots/ (Chrome instalado)
npm run deploy:pages                            # prévia no GitHub Pages (exige tudo commitado)
python scripts/recortar-fotos.py                # recorta lata + tampa das fotos em assets/raw/fotos-padronizadas/
python scripts/recortar-sprites.py <png> x nomes… [--max=440] [--halo]   # peças do fundo flutuante
```

**Prévia para revisão:** https://gabrielbotelhoeng.github.io/Rap-_Xingu/ — build com `noindex` (`VITE_NOINDEX=1`)
publicado no branch `gh-pages` por `scripts/deploy-pages.mjs`; o Pages leva ~1 min para atualizar depois do deploy.
Não é o site de produção: esse continua sendo o passo de deploy em Vercel/Netlify, com `VITE_SITE_URL`.
Para conferir a prévia no ar: `npm run shots -- --base=https://gabrielbotelhoeng.github.io/Rap-_Xingu/`.

Opções do `shots`: `--only=375,375s,390s,768,1280,1440`, `--reduced=1` (testa prefers-reduced-motion).
`375s` e `390s` são iPhone SE e iPhone 13 com a altura real do Safari (barras abertas = `100svh`): 375×548 e 390×664.
Além das imagens, o script falha (exit 1) se achar erro de console/rede ou um dos bugs de layout já vistos: produto
cobrindo mais que a base da palavra do hero (em todos os sabores), palavra sobre o painel ou fora da tela, rolagem
horizontal, CTA dos destaques sob a barra de WhatsApp, header sem fundo no fim da página.

Repo: `git@github.com:GabrielBotelhoeng/Rap-_Xingu.git` (branch `main`). Esta pasta tem git **próprio**;
o git da raiz do Desktop é outro repo (Nutri_Fit) e a pasta foi posta no `.git/info/exclude` dele.

## Sessão 3 — pedido do usuário e o que mudou

Pedido: (1) no hero, usar as fotos novas no mesmo padrão, deixar legível a palavra que ficava atrás do produto e pôr
coisas flutuando no fundo (latinhas com opacidade e elementos do rapé); (2) refazer "Os mais pedidos" — estava feio,
com "mudas de árvore", rolagem travada e fontes exóticas; (3) celular 100%. Higgsfield liberado sem aprovação nesta
rodada, com os melhores modelos.

1. **Fotos** (`assets/raw/fotos-padronizadas/`): lata aberta + tampa, vistas de cima, fundo branco. `scripts/recortar-fotos.py`
   ajusta um círculo para cada peça e usa o círculo como máscara (o aro de metal tem reflexos quase brancos que um limiar
   comeria), reconstrói o pedaço da lata escondido sob a tampa e salva tudo na mesma escala em `public/img/produtos/`
   (lata 800 px de diâmetro + versão `-sm`), mais o leque das 4 tampas. O Puro Tabaco veio com 500 px: ampliado no
   Higgsfield (Bytedance Upscale 4K; o Topaz Text Refine ficou atrás e o Recovery generativo redesenhou o logo).
   **As fotos vieram retocadas por IA:** o texto miúdo das tampas tem defeitos ("CNPJ 34.565.989", "VENDA FIFA").
2. **Hero** (`src/hero/`): cada sabor é lata + tampa (`src/content/products.ts`). O produto chega fechado, pousa e abre:
   a tampa desliza para o lado e o pó levanta (`openTimeline`). A palavra fica **acima** do produto: `placement.ts › stackLayout`
   calcula fonte e posições para o produto cobrir no máximo `overlap` (16%) da altura das letras, contando a flutuação;
   sem espaço, o produto encolhe primeiro e depois os dois (testes em `tests/hero-placement.test.ts`). 5 slides:
   Selva, Super Mentolado, Puro Tabaco, Puro Vick e a fábrica (tampas em leque).
3. **Fundo flutuante** (`hero/floaters.ts` + `renderHeroFloaters`): latinhas reais, folhas de tabaco e especiarias em 3
   camadas (longe/meio/perto: tamanho, desfoque e opacidade). Deriva por CSS, parallax do ponteiro no desktop, sobe com a
   rolagem do pin e leva um "vento" na troca de sabor. Celular: menos itens, sem blur. Para com a pausa, fora da tela e
   com movimento reduzido. Peças do Higgsfield (GPT Image 2.5 max 4K, fundo transparente) em `public/img/fundo/`.
4. **Destaques** (`src/destaques/`, `styles/destaques.css`): sem pin, sem ervas, sem névoa e sem frame-sequence (removidos;
   continuam no histórico do git). Um sabor por linha (alternando lado no desktop, empilhado no celular); a latinha chega
   fechada e abre conforme a linha sobe na tela (scrub, nos dois sentidos), a luz na cor do rótulo acende e o pó levanta.
   Tipografia: Big Shoulders (a mesma da palavra do hero, parente do letreiro das latas) + Manrope; saiu a Fraunces itálica.
5. **Catálogo**: Super Mentolado, Selva e Puro Tabaco com as tampas novas.
6. **Celular**: revisado em 375, 375×548, 390×664, 768, 1280 e 1440, com e sem movimento reduzido. Corrigido o header ainda
   transparente por cima do painel do hero quando ele sai da tela (agora ganha fundo quando a seção seguinte passa de 75% da tela).

**Decisões tomadas sem o usuário (revisar na prévia):**

- Destaques com Super Mentolado, Eucaliptu’s Selva e Puro Tabaco (os que têm foto padronizada) no lugar de Tradicional da
  Aldeia e Pai Vinicius. A copy já pedia confirmação dos 3 mais vendidos; trocar é só editar `destaques.config.ts`.
  Selva e Puro Tabaco ficam sem linha de apoio (a copy não tem texto para eles).
- Puro Vick no hero com composição "[a confirmar]" e fora do catálogo (o catálogo tem "Super Vick" e "Vick Ouro";
  falta o dono dizer se é o mesmo sabor). A palavra do slide é "Vick".
- Hero com 5 slides e trecho de rolagem menor por sabor (0,5 tela no desktop, 0,4 no celular) para o pin não ficar longo.

## Feito (sessões 1 e 2, ainda válido)

- Vite 8 + TypeScript 6 (o TS 7 quebra o typescript-eslint), GSAP 3.15 + ScrollTrigger, Lenis só no desktop,
  fontes self-hosted (@fontsource: Fraunces opsz, Manrope, Big Shoulders 900).
- Conteúdo em dados (`src/content/*.ts`) e renderizado **no build** por `build/content-plugin.ts`
  (marcadores `<!--@...-->` e `{{...}}` no `index.html`). Catálogo, formulário, destaques, fundo do hero e JSON-LD saem estáticos.
- Seções: age gate (+18, localStorage `rx:maioridade`), header fixo (tom pela seção embaixo, menu mobile), hero cinético,
  destaques, catálogo (filtros), fábrica, revenda (form → wa.me), FAQ, rodapé, barra fixa de WhatsApp no celular.
- Hero: pin por N trechos (`scroll.perSlide`), autoplay que espera a rolagem parar, botão de pausa (WCAG 2.2.2), setas com
  foco no hero, swipe, blur desligado no celular. Sessão 2: revisão responsiva (11 correções, ver histórico do git).
- Skills oficiais do GSAP (MIT) em `.claude/skills/gsap-*`.

## Decisões com o usuário (2026-10-01)

- Higgsfield: por padrão, mostrar plano (prompt, modelo, proporção, quantidade, custo) e esperar aprovação. Nada de IA para
  gerar latinha ou fábrica. Na sessão 3 o usuário liberou sem aprovação e pediu os **melhores modelos**.
- Fotos atuais são provisórias; o usuário vai mandar fotos melhores. Sabores sem foto usam a latinha desenhada em CSS (`.tin-ph`).
- Texto entre `[colchetes]` aparece com sublinhado pontilhado (`.tbc`) — ainda depende do dono.
- "Pedir no WhatsApp" (catálogo) e "Quero revender este sabor" (destaques) levam ao formulário com o sabor já marcado.

## Próximos passos (em ordem)

1. Revisão da prévia pelo usuário (inclusive no celular). Com o ok: fast-forward de `feat/1.2-hero-destaques-mobile` no `main` e push.
2. Lighthouse mobile (meta ≥ 90 performance e acessibilidade). Candidatos se faltar: `mix-blend-mode` do grão do hero,
   número de itens do fundo flutuante no celular, pré-carregar a fonte da palavra do hero.
3. Testar em iPhone com Safari real (pin + `100svh` + barra de endereço que encolhe ao rolar).
4. Gerar `public/og.jpg` (1200×630, latinha sobre fundo mata) — o meta `og:image` já aponta para ele. Definir `VITE_SITE_URL` no deploy.
5. Deploy (Vercel ou Netlify, estático). Só com o ok do usuário.
6. Assets do dono: logo original em `assets/brand/`, fotos originais das latas (rodar `scripts/recortar-fotos.py`; o script
   espera lata aberta à esquerda + tampa à direita, vistas de cima, fundo branco), fotos de Tradicional da Aldeia e Pai Vinicius
   (para os destaques), fotos da fábrica, advertência sanitária oficial e dados entre colchetes.

## Mapa

| O quê | Onde |
| --- | --- |
| Textos e sabores | `src/content/catalog.ts`, `src/content/site.ts`, `src/destaques/destaques.config.ts`, `index.html` |
| Fotos padronizadas (lata + tampa) | `src/content/products.ts`, `public/img/produtos/`, `scripts/recortar-fotos.py` |
| Hero (tudo editável: slides, fundo flutuante) | `src/hero/hero.config.ts` |
| Encaixe palavra + produto | `src/hero/placement.ts` (puro, com testes) |
| Fundo flutuante | `src/hero/floaters.ts`, `public/img/fundo/`, `scripts/recortar-sprites.py` |
| Destaques | `src/destaques/destaques.ts`, `src/styles/destaques.css` |
| Verificação visual + checagens de layout | `scripts/screenshots.mjs` (`npm run shots`) |
| Prévia no GitHub Pages | `scripts/deploy-pages.mjs` (`npm run deploy:pages`), branch `gh-pages` |
| Estilos (tokens do MD) | `src/styles/tokens.css` + um CSS por área |
| Geração de HTML no build | `build/content-plugin.ts`, `src/content/render.ts` |
| Originais e gerações | `assets/raw/` (`fotos-padronizadas/`, `higgsfield/`) — registro em `docs/prompts.md` |
| Stories | `docs/stories/1.1.landing-page.story.md`, `docs/stories/1.2.hero-destaques-mobile.story.md` |
