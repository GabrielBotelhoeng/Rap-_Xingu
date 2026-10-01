# PROJETO — Landing Page Rapé Xingu

## Contexto
- Cliente: Rapé Xingu (Fumopil Indústria e Comércio LTDA, CNPJ 34.565.939/0001-15), fábrica de rapé em Alexânia–GO.
- Objetivo: site institucional + captação de revendedores (tabacarias e distribuidores). Não é e-commerce.
- Conversão principal: formulário "Seja revendedor" que monta uma mensagem e abre o WhatsApp da fábrica.
- Copy completa: `docs/copy.md` (exportada do doc de copy). Use o texto de lá; não invente copy nova.
- Textos entre `[colchetes]` na copy ainda dependem de confirmação do dono. Mantenha visíveis como placeholder.

## Regras de conteúdo (obrigatórias)
- Produto derivado do tabaco: **age gate (+18)** antes de qualquer conteúdo; guardar a confirmação em `localStorage`.
- Advertência sanitária oficial no age gate e no rodapé (placeholder até o texto chegar).
- **Nenhuma alegação de saúde ou efeito** (cura, trata, desintoxica, terapêutico). Só composição, aroma, fábrica, formatos.
- Logo: usar só o arquivo original em `assets/brand/`. Nunca redesenhar o índio nem imitar a fonte do "XINGU".
- O logo é a única figura indígena da página. Ilustrações = ervas e natureza (sem cocares, pinturas ou grafismos extras).

## Stack
- Vite + TypeScript, sem framework (landing estática e leve).
- GSAP + ScrollTrigger (pins e frame-sequence), Lenis (scroll suave só no desktop).
- Canvas 2D para a frame-sequence dos destaques.
- Fontes: Google Fonts — Fraunces (títulos) e Manrope (texto).
- Deploy: Vercel ou Netlify (estático).

## Estrutura de pastas
```
/assets/brand/          logo original (svg/png transparente)
/assets/raw/            fotos originais das latinhas e da fábrica + vídeos gerados no Higgsfield
/public/frames/<sabor>/desktop/0001.webp ...   frame-sequence 16:9
/public/frames/<sabor>/mobile/0001.webp ...    frame-sequence 9:16
/public/img/            fotos otimizadas (webp/avif) para cards e seção da fábrica
/docs/copy.md           copy final
/docs/prompts.md        registro de todo prompt usado no Higgsfield (prompt, modelo, job id, resultado)
/src/                   código
```

## Ordem das seções
1. Age gate (+18)
2. Header (logo, menu Destaques · Catálogo · A fábrica · Revenda, botão WhatsApp)
3. Hero cinético (carrossel de sabores com cor de fundo por sabor) — ver "Hero cinético" abaixo
4. Destaques animados — tema Mata (3 mais vendidos, um por vez, latinha abrindo com o scroll) — opcional, decidir depois de ver o hero pronto
5. Catálogo — tema Terra (grade com filtros Todos · Zero Grau · Xingu · João de Barro)
6. A fábrica — tema Terra
7. Seja revendedor (formulário → WhatsApp) — tema Terra
8. FAQ + Rodapé — rodapé no campo mata

## Design system
Os "temas" são por seção, não modo claro/escuro do sistema. Aplicar com classe na `<section>`.

```css
.theme-terra {
  --surface: #EFE6D6; --surface-raised: #F8F3EA; --line: #D8CBB4;
  --ink: #2E2119; --ink-muted: #66564A;
  --accent: #9A4A24; --accent-soft: #F1DCC8; --on-accent: #FFFFFF;
  --oliva: #5A6136; --mata: #1E2A1F; --on-mata: #EFE6D6; --ouro: #C9A45C;
}
.theme-mata {
  --surface: #0F140F; --surface-raised: #1A241B; --line: #2E3B2F;
  --ink: #EFE6D6; --ink-muted: #A99F8B;
  --accent: #D4AE63; --accent-soft: #2F2A18; --on-accent: #0F140F;
  --oliva: #A7AD74; --mata: #33472F; --on-mata: #EFE6D6; --ouro: #D4AE63;
}
:root {
  --font-display: "Fraunces", Georgia, serif;
  --font-sans: "Manrope", system-ui, sans-serif;
  --space-2: 8px; --space-4: 16px; --space-6: 32px; --space-8: 64px;
  --radius-sm: 4px; --radius-md: 12px; --radius-pill: 999px;
}
```
- Tipografia: display 64px/0.95 (44px no mobile), h1 40/44, h2 28/34 em Fraunces; body 16/26, small 14/20, label 15/20 600 em Manrope; eyebrow 12px, 700, caixa alta, letter-spacing .14em.
- Botão principal: pílula, `--accent` com texto `--on-accent`, no máximo um por tela. Secundário: contornado.
- Selos: "Mais vendido" em `--accent-soft` + texto `--accent`; linha do produto contornada em `--oliva`.
- Textura de grão sutil no fundo Terra.
- Contraste: todas as combinações texto/fundo acima passam WCAG AA. Não usar `--ouro` como texto sobre o Terra.

## Hero cinético
Protótipo de referência: `docs/referencias/hero-rape-xingu/index.html` (HTML + CSS + JS + GSAP, sem vídeo), com as imagens recortadas em `docs/referencias/hero-rape-xingu/img/`. Portar para o projeto mantendo a mesma lógica (não copiar o arquivo inteiro):
- Mover `HERO_CONFIG` para um módulo próprio (ex.: `src/hero/hero.config.ts`) e o motor da animação para `src/hero/hero.ts`.
- GSAP via npm (não CDN); fontes Big Shoulders Display, Fraunces e Manrope self-hosted (ex.: @fontsource).
- Copiar as imagens de `img/` para `public/img/` (provisórias até as fotos da fábrica chegarem).
- Cada slide = palavra grande (Big Shoulders Display 900) + latinha recortada na frente + fundo em gradiente radial com a cor do rótulo do sabor + partículas de pó (canvas) quando a latinha pousa.
- Transição cinética (~1,15 s): latinha sai na diagonal com giro e blur, letras sobem em cascata, nova cor nasce num círculo a partir da latinha, letras novas sobem, latinha nova entra girando com leve overshoot.
- Cada slide fica ~1,8 s parado (latinha flutuando, palavra derivando devagar) e o loop é infinito.
- Navegação: bolinhas de sabor (clique), setas do teclado, swipe no celular.
- Tudo editável no objeto `HERO_CONFIG`: textos, imagem, cores, posição/rotação/tamanho do produto (desktop e mobile), direção de entrada, cor do pó, tempos.
- No site completo, **não** sequestrar a roda do mouse em loop: usar ScrollTrigger com pin por N slides (cada trecho de scroll avança um sabor) e depois liberar a página. Autoplay continua valendo quando o usuário não rola.
- Trocar as imagens do protótipo (fotos de revendedores, algumas em baixa resolução) pelas fotos próprias recortadas, em `public/img/`.

## Destaques animados (frame-sequence)
- Cada destaque: latinha grande no centro abrindo conforme o scroll; névoa fina de pó subindo atrás; ervas do sabor flutuando (ex.: Super Mentolado → eucalipto, cravo, alecrim).
- A névoa/luz de fundo pode puxar levemente a cor do rótulo de cada sabor (verde, marrom, roxo). A UI continua no tema Mata.
- Latinha e fundo em camadas separadas: a latinha é a frame-sequence; névoa e folhas são outra camada (vídeo em loop ou canvas).
- Implementação:
  - `gsap.matchMedia()` para carregar `frames/<sabor>/desktop` (16:9, 120–150 frames) ou `frames/<sabor>/mobile` (9:16, 60–80 frames).
  - Desenhar no canvas com lógica "cover"; limitar `devicePixelRatio` a 2.
  - Pré-carregar os primeiros frames e o resto progressivamente; mostrar o 1º frame enquanto carrega.
  - Usar `100svh` (não `100vh`) e `ScrollTrigger.config({ ignoreMobileResize: true })`.
  - Lenis com scroll nativo no touch (sem `syncTouch`).
  - `prefers-reduced-motion`: imagem estática da latinha aberta, sem pin.

## Pipeline de mídia com Higgsfield (MCP)
O Higgsfield gasta créditos. **Antes de qualquer geração, mostre o plano (prompt, modelo, proporção, quantidade) e espere minha aprovação.** Gere 1 teste antes de gerar em lote.

1. Ponto de partida: sempre fotos reais em `assets/raw/` (latinha fechada e aberta, mesmo ângulo e mesma luz). Nunca gerar a latinha do zero, porque a IA deforma o texto do rótulo.
2. Recorte: remover o fundo das fotos (remove_background) antes de animar.
3. Abertura da latinha: image-to-video com a foto **fechada como primeiro frame** e a **aberta como último frame**. Gerar uma versão 16:9 e uma 9:16, com a lata centralizada e margem de segurança.
4. Fundo: gerar separado (névoa de pó + ervas do sabor, fundo escuro), em loop curto, nas duas proporções.
5. Salvar tudo em `assets/raw/` e registrar em `docs/prompts.md`.
6. Extrair frames com ffmpeg, por exemplo:
   ```
   ffmpeg -i assets/raw/super-mentolado-desktop.mp4 -vf "fps=30,scale=1600:-1" -c:v libwebp -quality 78 public/frames/super-mentolado/desktop/%04d.webp
   ffmpeg -i assets/raw/super-mentolado-mobile.mp4 -vf "fps=24,scale=720:-1" -c:v libwebp -quality 72 public/frames/super-mentolado/mobile/%04d.webp
   ```

## Responsividade e performance
- Mobile first. Testar em 375px, 768px, 1280px e 1440px+. Testar em iPhone com Safari real.
- Grade do catálogo: `grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))`.
- No mobile: menu recolhido e botão de WhatsApp fixo no rodapé da tela.
- Meta: Lighthouse mobile ≥ 90 em performance e acessibilidade; nenhuma imagem acima de 300 KB fora das frame-sequences.
- Imagens com `width`/`height` definidos e `loading="lazy"` abaixo da dobra.

## Formulário de revenda
- Campos: nome, nome da loja, cidade/UF, WhatsApp, CNPJ (opcional), sabores de interesse (pílulas multisseleção).
- Ao enviar: montar a mensagem da copy e abrir `https://wa.me/5562994775811?text=<mensagem codificada>`.
- Nenhum dado é salvo em servidor.

## SEO básico
- `<title>`, meta description, Open Graph com imagem da latinha, `lang="pt-BR"`, dados estruturados `LocalBusiness` com endereço de Alexânia.

## Assets pendentes (vêm do dono da fábrica)
- [ ] Logo original em vetor ou PNG transparente (provavelmente com a gráfica ou o designer dos rótulos)
- [ ] Rótulos planificados de todos os sabores
- [ ] Fotos das latinhas dos 3 mais vendidos, fechadas e abertas
- [ ] Fotos da fábrica (torra, mistura, envase)
- [ ] Confirmação dos 3 mais vendidos e dos dados entre colchetes na copy
- [ ] Texto oficial da advertência sanitária

## Definição de pronto
- Todas as seções com a copy final, nos dois temas, responsivas.
- Animação fluida (60 fps no desktop, sem travar no iPhone), com fallback de movimento reduzido.
- Age gate, advertência e rodapé legal presentes.
- Formulário abrindo o WhatsApp com a mensagem correta.
- Lighthouse mobile ≥ 90.
