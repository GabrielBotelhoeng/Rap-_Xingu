"""
Separa as folhas de sprites geradas no Higgsfield (fundo transparente, peças soltas) em um arquivo por
peça, para o fundo flutuante do hero. Cada peça é um componente conectado do canal alfa (com uma
dilatação leve para não separar pontas finas), recortada justa e reduzida até `--max` px no lado maior.

  python scripts/recortar-sprites.py <folha.png> <prefixo> [nome1 nome2 ...] [--max=440]

Sem nomes, as peças saem como <prefixo>-1.webp, <prefixo>-2.webp… na ordem de leitura (linhas de cima
para baixo, da esquerda para a direita). Com nomes, o n-ésimo nome vai para a n-ésima peça e "-" pula a peça.
Saída: public/img/fundo/. Requer Python 3 com numpy, opencv-python e Pillow.
"""
from __future__ import annotations

import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "img" / "fundo"


def pieces(sheet: Image.Image) -> list[tuple[int, int, int, int]]:
    alpha = np.asarray(sheet.getchannel("A"))
    mask = (alpha > 24).astype(np.uint8)
    mask = cv2.dilate(mask, np.ones((15, 15), np.uint8))
    n, _, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    boxes = []
    for i in range(1, n):
        x, y, w, h, area = stats[i]
        if area < 4000:  # poeira
            continue
        boxes.append((x, y, x + w, y + h))
    # ordem de leitura: agrupa por linha (centro vertical) e ordena por x
    boxes.sort(key=lambda b: (b[1] + b[3]) / 2)
    rows: list[list[tuple[int, int, int, int]]] = []
    for b in boxes:
        cy = (b[1] + b[3]) / 2
        if rows and abs(cy - (rows[-1][0][1] + rows[-1][0][3]) / 2) < sheet.height * 0.18:
            rows[-1].append(b)
        else:
            rows.append([b])
    return [b for row in rows for b in sorted(row, key=lambda b: b[0])]


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    opts = dict(a[2:].split("=", 1) for a in sys.argv[1:] if a.startswith("--"))
    if len(args) < 2:
        raise SystemExit(__doc__)
    sheet = Image.open(args[0]).convert("RGBA")
    prefix, names = args[1], args[2:]
    limit = int(opts.get("max", 440))
    OUT.mkdir(parents=True, exist_ok=True)
    for k, box in enumerate(pieces(sheet)):
        name = names[k] if k < len(names) else f"{prefix}-{k + 1}"
        if name == "-":
            continue
        piece = sheet.crop(box)
        # recorte justo pelo alfa real (a caixa veio da máscara dilatada)
        tight = piece.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
        if tight:
            piece = piece.crop(tight)
        scale = min(1.0, limit / max(piece.size))
        if scale < 1:
            piece = piece.resize((round(piece.width * scale), round(piece.height * scale)), Image.LANCZOS)
        path = OUT / f"{name}.webp"
        piece.save(path, "WEBP", quality=80, method=6, alpha_quality=85)
        print(f"{path.relative_to(ROOT).as_posix()}  {piece.width}x{piece.height}  {path.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
