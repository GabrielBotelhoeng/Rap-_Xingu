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

## Prompts

### 2026-10-01 · Folha de 10 ervas (teste)

```
Botanical ingredient sprite sheet: ten separate natural ingredients laid out in a loose 5x2 grid with generous empty space between each one, nothing touching or overlapping: a fresh eucalyptus leaf, a single whole dried clove, a small rosemary sprig, a cinnamon stick, a star anise pod, a whole nutmeg, a curled strip of dried orange peel, a fresh mint leaf, a dried golden-brown tobacco leaf, a small sprig of fennel with seeds. Photorealistic studio macro photography, soft warm top-left key light, true-to-life colors, crisp detail, each object fully in frame, transparent background, no text, no labels, no props, no hands.
```

Recorte: componentes conectados do canal alfa (com dilatação para manter as sementes junto da erva-doce), WebP qualidade 80, no máximo 440 px no lado maior. Arquivos: `eucalipto`, `cravo`, `alecrim`, `canela`, `anis-estrelado`, `noz-moscada`, `casca-de-laranja`, `hortela`, `tabaco`, `erva-doce`.

## Próximas gerações (aguardando fotos reais da fábrica)

- Abertura da latinha dos 3 mais vendidos: image-to-video com a foto fechada como 1º frame e a aberta como último, uma versão 16:9 e uma 9:16. Depende das fotos em `assets/raw/` e da confirmação dos 3 mais vendidos.
- Extração dos frames: ver o comando `ffmpeg` no `PROJETO.md`; saída em `public/frames/<sabor>/{desktop,mobile}/`.
