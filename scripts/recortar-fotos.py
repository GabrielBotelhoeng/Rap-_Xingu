"""
Recorta as fotos padronizadas dos sabores (lata aberta à esquerda + tampa à direita, fundo branco, vistas
de cima) em peças com fundo transparente, no mesmo tamanho e na mesma escala:

  public/img/produtos/<sabor>-lata.webp      lata aberta (pó), 800 px de diâmetro
  public/img/produtos/<sabor>-lata-sm.webp   idem, 400 px (celular e catálogo)
  public/img/produtos/<sabor>-tampa.webp     tampa, na mesma escala da lata (~850 px)
  public/img/produtos/<sabor>-tampa-sm.webp  idem, metade
  public/img/produtos/tampas-leque.webp      as tampas em leque (slide da fábrica no hero)

As duas peças são círculos vistos de cima, então o recorte é geométrico: acha a silhueta (o que não é
branco), ajusta um círculo para cada peça e usa o próprio círculo como máscara, com a borda suavizada.
Um limiar de cor comeria os reflexos quase brancos do aro de metal; o círculo não come.
No ponto em que as duas encostam, a tampa fica por cima (como na foto); o pedaço da lata que ela
esconde é refeito com o lado oposto da lata.

Imprime as medidas (raio da tampa / raio da lata) usadas em src/hero/products.ts.

Uso:  python scripts/recortar-fotos.py [sabor ...]   (sem argumentos: todos, mais o leque)
Requer Python 3 com numpy, opencv-python e Pillow.
"""
from __future__ import annotations

import json
import math
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "assets" / "raw" / "fotos-padronizadas"
OUT = ROOT / "public" / "img" / "produtos"

# sabor -> foto original (a do Puro Tabaco veio com 500 px e foi ampliada no Higgsfield (Bytedance Upscale 4K), ver docs/prompts.md)
FOTOS = {
    "eucaliptus-selva": "eucaliptus-selva.webp",
    "super-mentolado": "super-mentolado.webp",
    "puro-tabaco": "puro-tabaco-4k.webp",
    "puro-vick": "puro-vick.webp",
}
# ordem das tampas no leque, da de trás para a da frente
LEQUE = ["puro-tabaco", "puro-vick", "eucaliptus-selva", "super-mentolado"]

TIN_DIAMETER = 800  # todas as latas saem com este diâmetro; a tampa segue a mesma escala
EDGE_INSET = 1.5  # px (na escala da foto) cortados para dentro da borda: tira o halo branco


def silhouette(rgb: np.ndarray) -> np.ndarray:
    """Máscara do que não é fundo branco, com os buracos (reflexos do aro) preenchidos."""
    dist = 255 - rgb.min(axis=2).astype(np.int16)  # quanto o pixel se afasta do branco
    mask = (dist > 14).astype(np.uint8) * 255
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    # preenche buracos: o que o fundo (a partir das bordas) não alcança é objeto
    h, w = mask.shape
    flood = mask.copy()
    pad = np.zeros((h + 2, w + 2), np.uint8)
    for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        if flood[seed[1], seed[0]] == 0:
            cv2.floodFill(flood, pad, seed, 128)
    return np.where(flood == 128, 0, 255).astype(np.uint8)


def fit_circle(points: np.ndarray) -> tuple[float, float, float]:
    """Círculo por mínimos quadrados (Kasa), refeito só com os pontos perto do primeiro ajuste."""
    pts = points.astype(np.float64)
    for _ in range(3):
        x, y = pts[:, 0], pts[:, 1]
        a = np.column_stack([x, y, np.ones_like(x)])
        b = x * x + y * y
        c, *_ = np.linalg.lstsq(a, b, rcond=None)
        cx, cy = c[0] / 2, c[1] / 2
        r = math.sqrt(c[2] + cx * cx + cy * cy)
        d = np.abs(np.hypot(pts[:, 0] - cx, pts[:, 1] - cy) - r)
        keep = d < max(2.0, np.percentile(d, 90))
        if keep.sum() < 50:
            break
        pts = pts[keep]
    return cx, cy, r


def two_circles(mask: np.ndarray) -> tuple[tuple[float, float, float], tuple[float, float, float]]:
    """Lata (esquerda) e tampa (direita): separa no "pescoço" entre as duas e ajusta um círculo em cada."""
    cols = (mask > 0).sum(axis=0)
    xs = np.nonzero(cols)[0]
    x0, x1 = xs.min(), xs.max()
    lo, hi = int(x0 + (x1 - x0) * 0.3), int(x0 + (x1 - x0) * 0.7)
    neck = lo + int(np.argmin(cols[lo:hi]))
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    pts = max(contours, key=cv2.contourArea)[:, 0, :]
    away = np.abs(pts[:, 0] - neck) > 25  # perto do encontro o contorno não é de nenhum dos dois círculos
    left = pts[(pts[:, 0] < neck) & away]
    right = pts[(pts[:, 0] > neck) & away]
    return fit_circle(left), fit_circle(right)


def disk_alpha(shape: tuple[int, int], cx: float, cy: float, r: float) -> np.ndarray:
    h, w = shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.hypot(xx - cx, yy - cy)
    return np.clip(r - d + 0.5, 0, 1)  # 1 px de transição: borda suave


def crop_piece(rgb: np.ndarray, alpha: np.ndarray, cx: float, cy: float, r: float, scale: float) -> Image.Image:
    a = (alpha * 255).astype(np.uint8)
    rgba = np.dstack([rgb, a])
    m = 3
    box = (int(math.floor(cx - r - m)), int(math.floor(cy - r - m)), int(math.ceil(cx + r + m)), int(math.ceil(cy + r + m)))
    im = Image.fromarray(rgba, "RGBA")
    # a peça pode encostar na borda da foto: cola num quadro transparente maior antes de cortar
    canvas = Image.new("RGBA", (im.width + 2 * (int(r) + m), im.height + 2 * (int(r) + m)), (0, 0, 0, 0))
    off = int(r) + m
    canvas.paste(im, (off, off))
    piece = canvas.crop((box[0] + off, box[1] + off, box[2] + off, box[3] + off))
    size = max(1, round(piece.width * scale))
    return piece.resize((size, size), Image.LANCZOS)


def save_webp(im: Image.Image, path: Path, quality: int) -> None:
    im.save(path, "WEBP", quality=quality, method=6, alpha_quality=90)
    print(f"  {path.relative_to(ROOT).as_posix()}  {im.width}x{im.height}  {path.stat().st_size // 1024} KB")


def half(im: Image.Image) -> Image.Image:
    return im.resize((max(1, im.width // 2), max(1, im.height // 2)), Image.LANCZOS)


def leque(lids: dict[str, Image.Image]) -> Image.Image:
    """As tampas em leque, sobrepostas, cada uma com a sombra suave sobre a de trás."""
    d = 520  # diâmetro de cada tampa no leque
    step = int(d * 0.7)  # cada tampa mostra 70% dela: o nome do sabor fica à vista
    angles = [-10, -3, 4, 11]
    lifts = [34, 4, 22, 0]  # alturas alternadas: uma onda, não uma fila
    w = d + step * (len(LEQUE) - 1) + 80
    h = d + 80 + max(lifts)
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    for i, name in enumerate(LEQUE):
        lid = lids[name].resize((d, d), Image.LANCZOS).rotate(angles[i], resample=Image.BICUBIC, expand=False)
        x, y = 40 + step * i, 30 + lifts[i]
        shadow = Image.new("RGBA", lid.size, (0, 0, 0, 0))
        shadow.putalpha(lid.getchannel("A").point(lambda v: int(v * 0.42)))
        shadow = shadow.filter(ImageFilter.GaussianBlur(16))
        out.alpha_composite(shadow, (x + 6, y + 18))
        out.alpha_composite(lid, (x, y))
    bbox = out.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    return out.crop(bbox) if bbox else out


def main(only: list[str]) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    medidas: dict[str, dict[str, float]] = {}
    lids_full: dict[str, Image.Image] = {}
    for name, file in FOTOS.items():
        if only and name not in only:
            continue
        src = RAW / file
        rgb = np.asarray(Image.open(src).convert("RGB"))
        mask = silhouette(rgb)
        (tx, ty, tr), (lx, ly, lr) = two_circles(mask)
        # confere o ajuste: a silhueta tem que bater com os dois círculos (IoU)
        fit = (disk_alpha(mask.shape, tx, ty, tr) > 0.5) | (disk_alpha(mask.shape, lx, ly, lr) > 0.5)
        iou = (fit & (mask > 0)).sum() / max(1, (fit | (mask > 0)).sum())
        print(f"{name}: lata r={tr:.1f} ({tx:.0f},{ty:.0f})  tampa r={lr:.1f} ({lx:.0f},{ly:.0f})  IoU={iou:.4f}")
        if iou < 0.97:
            raise SystemExit(f"{name}: o recorte não bate com a silhueta (IoU {iou:.3f}); confira a foto")

        lid_a = disk_alpha(mask.shape, lx, ly, lr - EDGE_INSET)
        tin_a = disk_alpha(mask.shape, tx, ty, tr - EDGE_INSET)
        # onde a tampa cobre a borda da lata, a lata é refeita com o lado oposto dela (giro de 180°):
        # o aro e o pó são parecidos dos dois lados, e assim a lata também fica inteira sozinha
        tin_rgb = rgb.copy()
        bite = (tin_a > 0) & (lid_a > 0)
        ys, xs = np.nonzero(bite)
        oy = np.clip(np.round(2 * ty - ys).astype(int), 0, rgb.shape[0] - 1)
        ox = np.clip(np.round(2 * tx - xs).astype(int), 0, rgb.shape[1] - 1)
        tin_rgb[ys, xs] = rgb[oy, ox]
        scale = TIN_DIAMETER / (2 * tr)
        tin = crop_piece(tin_rgb, tin_a, tx, ty, tr, scale)
        lid = crop_piece(rgb, lid_a, lx, ly, lr, scale)
        lids_full[name] = lid
        save_webp(tin, OUT / f"{name}-lata.webp", 82)
        save_webp(half(tin), OUT / f"{name}-lata-sm.webp", 80)
        save_webp(lid, OUT / f"{name}-tampa.webp", 84)
        save_webp(half(lid), OUT / f"{name}-tampa-sm.webp", 82)
        medidas[name] = {
            "lidRatio": round(lr / tr, 4),
            # posição da tampa na foto, em raios da lata (a partir do centro da lata)
            "lidDx": round((lx - tx) / tr, 4),
            "lidDy": round((ly - ty) / tr, 4),
            "tinPx": tin.width,
            "lidPx": lid.width,
        }
    if all(name in lids_full for name in LEQUE):
        fan = leque(lids_full)
        save_webp(fan, OUT / "tampas-leque.webp", 84)
        save_webp(half(fan), OUT / "tampas-leque-sm.webp", 82)
        medidas["tampas-leque"] = {"w": fan.width, "h": fan.height}
    print(json.dumps(medidas, indent=2))


if __name__ == "__main__":
    import sys

    main(sys.argv[1:])  # sem argumentos: todos os sabores (e o leque)
