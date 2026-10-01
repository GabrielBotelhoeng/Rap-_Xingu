# Registro de gerações no Higgsfield

Toda geração passa por aprovação antes (plano com prompt, modelo, proporção e quantidade) e fica registrada aqui.
Projeto no Higgsfield: **Rapé Xingu — Landing** (`796f29b2-5c26-4bc9-9e45-1b314cff88fd`).

Regras do `PROJETO.md` que valem para qualquer geração:

- Nunca gerar a latinha do zero: a IA deforma o texto do rótulo. Vídeos de abertura partem de fotos reais (fechada = 1º frame, aberta = último).
- Fábrica: só fotos reais da visita. Nada de IA nem banco de imagens.
- Ilustrações só de ervas e natureza. O logo é a única figura indígena da página.

| Data | Item | Modelo | Proporção / qualidade | Qtd | Créditos | Job id | Resultado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-10-01 | Folha de 10 ervas (teste) | GPT Image 2.5 (`gpt_image_2_5`, flare) | 3:2 · high · 2K · fundo transparente | 1 | 2,75 | `2400ada6-7280-4e8e-ae1b-6fb6cdff8daf` | Aprovado. Original em `assets/raw/higgsfield/ervas-sprite-v1.png`; recortes em `public/img/ervas/` |
| 2026-10-01 | Ampliar a foto do Puro Tabaco (500 px) | Bytedance Upscale (`upscale_image`) | 4K | 1 | 2 | `0cfe0d9e-cb25-47d0-b3c7-bc71a836e87e` | **Usado.** `assets/raw/fotos-padronizadas/puro-tabaco-4k.webp` (demorou ~1 h na fila) |
| 2026-10-01 | Idem (reserva) | Bytedance Upscale | 2K | 1 | — | `f71ba9a3-a454-4025-8f23-90231d8519a2` | Não usado |
| 2026-10-01 | Idem | Topaz (`topaz_image`, Text Refine / Low Resolution V2) | 2000×1060 | 2 | — | `1baec557-…`, `7743ac46-…` | Não usados: texto mais áspero que o da Bytedance |
| 2026-10-01 | Idem | Topaz generativo (`topaz_image_generative`, Recovery V2) | 2000×1060 | 1 | — | `e2241edf-dcdb-47af-8bef-d7d23c72c74e` | Descartado: redesenhou o índio do logo |
| 2026-10-01 | Idem | Nano Banana Pro (referência) | 16:9 · 4K | 1 | — | `10fbe960-468f-4efa-8ac2-89751fda6d09` | Não usado (ficou na fila) |
| 2026-10-01 | Folhas de tabaco curadas (6) | GPT Image 2.5 (flare) | 3:2 · high · 2K · transparente | 2 | — | `a1da5535-…`, `b3d110a0-…` | Substituídas pela versão max |
| 2026-10-01 | Especiarias (8) | GPT Image 2.5 (flare) | 3:2 · high · 2K · transparente | 2 | — | `d8a78957-…`, `9cd5850e-…` | Substituídas pela versão max |
| 2026-10-01 | Folhas de tabaco curadas (6) | GPT Image 2.5 (flare) | 3:2 · **max · 4K** · transparente | 1 | — | `a3d12c6c-59b2-47e5-8b31-ae9c8ae73ac4` | **Usado.** `assets/raw/higgsfield/tabaco-folhas-max4k.webp` → `public/img/fundo/folha-tabaco-*` |
| 2026-10-01 | Especiarias (8) | GPT Image 2.5 (flare) | 3:2 · **max · 4K** · transparente | 1 | — | `c8d6cb64-c6fd-4c8b-a911-42a1464daf7e` | **Usado** com limpeza do halo claro (`recortar-sprites.py --halo`) → `public/img/fundo/` |

Sessão 3 (2026-10-01): o usuário liberou o Higgsfield sem aprovação prévia e pediu os melhores modelos. Total da
sessão: 55 créditos (951,25 → 896,25). Nenhuma latinha foi gerada por IA: as do fundo flutuante são as fotos reais recortadas.

## Prompts

### 2026-10-01 · Folha de 10 ervas (teste)

```
Botanical ingredient sprite sheet: ten separate natural ingredients laid out in a loose 5x2 grid with generous empty space between each one, nothing touching or overlapping: a fresh eucalyptus leaf, a single whole dried clove, a small rosemary sprig, a cinnamon stick, a star anise pod, a whole nutmeg, a curled strip of dried orange peel, a fresh mint leaf, a dried golden-brown tobacco leaf, a small sprig of fennel with seeds. Photorealistic studio macro photography, soft warm top-left key light, true-to-life colors, crisp detail, each object fully in frame, transparent background, no text, no labels, no props, no hands.
```

Recorte: componentes conectados do canal alfa (com dilatação para manter as sementes junto da erva-doce), WebP qualidade 80, no máximo 440 px no lado maior. Arquivos: `eucalipto`, `cravo`, `alecrim`, `canela`, `anis-estrelado`, `noz-moscada`, `casca-de-laranja`, `hortela`, `tabaco`, `erva-doce`.

### 2026-10-01 · Fundo flutuante do hero (sessão 3)

Folhas de tabaco (usada a versão max 4K):

```
Botanical ingredient sprite sheet: six separate whole cured tobacco leaves, golden-brown to deep amber, naturally wrinkled with visible veins, each one a different shape, size and gentle curl or twist, laid out in a loose 3x2 grid with generous empty space between them, nothing touching or overlapping, every leaf fully in frame with margin around it. Photorealistic studio macro photography, soft warm top-left key light, true-to-life colors, crisp detail, transparent background, no cast shadows on the background, no text, no labels, no props, no hands.
```

Especiarias (usada a versão max 4K; só peças soltas, sem raminhos — os do sprite antigo pareciam "mudas de árvore"):

```
Botanical ingredient sprite sheet: eight separate single natural ingredients in a loose 4x2 grid with generous empty space between each, nothing touching or overlapping, each fully in frame with margin: a single fresh eucalyptus leaf, a second single eucalyptus leaf slightly curled, a single fresh mint leaf, a second smaller mint leaf, one whole dried clove, one cinnamon stick, one star anise pod, one whole nutmeg. Single leaves only, no stems with several leaves, no sprigs, no branches. Photorealistic studio macro photography, soft warm top-left key light, true-to-life colors, crisp detail, transparent background, no cast shadows on the background, no text, no labels, no props, no hands.
```

Recorte: `python scripts/recortar-sprites.py <folha.png> x <nomes…> [--max=360] [--halo]` (componentes conectados do
alfa; `--halo` deixa só o núcleo opaco, refaz 1 px de borda e recolore a borda com a cor da peça).

## Próximas gerações (aguardando fotos reais da fábrica)

- A abertura da latinha nos destaques agora é feita com as duas fotos (lata e tampa) e não precisa mais de vídeo nem de frame-sequence (sessão 3).
