#!/usr/bin/env python3
# Copyright (c) 2025-present databayt
# Licensed under SSPL-1.0 -- see LICENSE for details
"""Books mirror — cut the acceptance rectangles from the iPhone captures and
from our own renders, side by side, and sample the token colours.

    python3 scripts/books-mirror-crops.py            # Arabic renders
    python3 scripts/books-mirror-crops.py en         # English renders

Reads  public/books-app/IMG_*.png|PNG          (the reference, 1170×2532)
       .claude/screenshots/books-mirror/<lang>/*.png   (ours, same grid)
Writes .claude/screenshots/books-mirror/crops/<name>-{ref,ours}.png

Every rectangle is in 3x pixels on the 390×844 grid and is the one the
blueprint (.claude/plans/books-app-mirror-blueprint.md) names under the
matching section's "Acceptance crop". Read the pairs at the same scale; do not
threshold the reference on its own — the page text behind the glass pollutes
any mask (see the blueprint §17).
"""
import sys
from pathlib import Path

from PIL import Image

LANG = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] in ("ar", "en") else "ar"
ROOT = Path(__file__).resolve().parents[1]
REF = ROOT / "public" / "books-app"
OURS = ROOT / ".claude" / "screenshots" / "books-mirror" / LANG
OUT = ROOT / ".claude" / "screenshots" / "books-mirror" / "crops"
OUT.mkdir(parents=True, exist_ok=True)

# name → (reference capture, our render, box, view scale[, our box when it differs])
PAIRS = {
    "store-header": ("IMG_2572.png", "10-store-top.png", (0, 0, 1170, 330), 0.5),
    "store-title": ("IMG_2572.png", "10-store-top.png", (0, 950, 1170, 1400), 0.5),
    "store-card": ("IMG_2572.png", "10-store-top.png", (60, 1380, 1110, 1820), 0.5),
    "store-tabbar": ("IMG_2572.png", "10-store-top.png", (0, 2250, 1170, 2532), 0.6),
    "store-publisher": ("IMG_2573.png", "11-store-scrolled.png", (0, 250, 1170, 1000), 0.5),
    "store-shelf": ("IMG_2573.png", "11-store-scrolled.png", (0, 1600, 1170, 2532), 0.5),
    "publisher-sheet": ("IMG_2577.png", "12-store-publisher.png", (0, 100, 1170, 1200), 0.5),
    "reader-opener": ("IMG_2578.png", "22-reader-page.png", (0, 150, 1170, 700), 0.5),
    "reader-foot": ("IMG_2578.png", "22-reader-page.png", (0, 2020, 1170, 2532), 0.6),
    "reader-menu": ("IMG_2579.png", "23-reader-menu.png", (280, 1600, 1170, 2320), 0.6),
    "search-sheet": ("IMG_2580.png", "27-reader-search.png", (0, 130, 1170, 700), 0.5),
    # The bar docks over the keyboard on the phone and at the sheet foot on the web.
    "search-bar": ("IMG_2580.png", "27-reader-search.png", (0, 1330, 1170, 1612), 0.6, (0, 2250, 1170, 2532)),
    "settings-band": ("IMG_2596.PNG", "25-reader-settings.png", (0, 1040, 1170, 1560), 0.5),
    "settings-swatches": ("IMG_2596.PNG", "25-reader-settings.png", (40, 1600, 1130, 2532), 0.45),
    "contents-head": ("IMG_2598.PNG", "24-reader-contents-sheet.png", (0, 130, 1170, 480), 0.5),
    "contents-rows": ("IMG_2598.PNG", "24-reader-contents-sheet.png", (0, 470, 1170, 1000), 0.5),
    "line-guide": ("IMG_2610.PNG", "29-reader-line-guide.png", (0, 150, 1170, 1400), 0.45),
    "dimming-menu": ("IMG_2611.PNG", "29-reader-line-guide.png", (40, 1500, 900, 2450), 0.5),
    "bookmark-indicator": ("IMG_2613.PNG", "30-reader-bookmarked.png", (0, 2200, 1170, 2532), 0.5),
    "bookmarks-sheet": ("IMG_2614.PNG", "24-reader-contents-sheet.png", (0, 130, 1170, 700), 0.5),
}

# The token table's sample points (3x pixels) on the reference, averaged 5×5.
SAMPLES = {
    "IMG_2572.png": {
        "store tint top (x20,y150)": (20, 150),
        "store tint bottom (x20,y1850)": (20, 1850),
        "store card fill": (1030, 1450),
        "store sample pill": (300, 1673),
        "tab bar selected cell": (130, 2310),
    },
    "IMG_2579.png": {
        "menu dark pill": (730, 1720),
        "menu light pill": (1090, 1875),
    },
    "IMG_2596.PNG": {
        "settings body": (50, 1710),
        "settings capsule": (300, 1346),
        "settings customize": (120, 2360),
    },
    "IMG_2598.PNG": {
        "contents surface": (550, 460),
        "contents current row": (700, 700),
        "contents backdrop": (550, 30),
    },
    "IMG_2613.PNG": {
        "bookmark disc red": (1000, 2320),
    },
    "IMG_2614.PNG": {
        "bookmarks row capsule": (700, 520),
        "segmented control": (60, 380),
    },
}


def crop(src: Path, box, scale: float) -> Image.Image:
    im = Image.open(src).convert("RGB").crop(box)
    if scale != 1:
        im = im.resize((int(im.width * scale), int(im.height * scale)), Image.LANCZOS)
    return im


def sample(src: Path, x: int, y: int, r: int = 2) -> str:
    im = Image.open(src).convert("RGB")
    px = [im.getpixel((x + dx, y + dy)) for dx in range(-r, r + 1) for dy in range(-r, r + 1)]
    n = len(px)
    return "#%02x%02x%02x" % tuple(sum(p[i] for p in px) // n for i in range(3))


missing = []
for name, spec in PAIRS.items():
    ref, ours, box, scale = spec[:4]
    obox = spec[4] if len(spec) > 4 else box
    crop(REF / ref, box, scale).save(OUT / f"{name}-ref.png")
    src = OURS / ours
    if src.exists():
        crop(src, obox, scale).save(OUT / f"{name}-ours.png")
    else:
        missing.append(ours)
    print(f"{name:20s} {box}")

print()
for image, points in SAMPLES.items():
    for label, (x, y) in points.items():
        print(f"{label:34s} {sample(REF / image, x, y)}")

if missing:
    print("\nno render for:", ", ".join(sorted(set(missing))), "— run books-mirror-capture.mjs first")
