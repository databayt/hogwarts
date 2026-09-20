#!/usr/bin/env python3
"""sheet.py <out.png> <label-file>  — contact sheet. label-file lines: key<TAB>label"""
import sys, os
from PIL import Image, ImageDraw
SRC = "/Users/abdout/codebase/public/cdn"
rows = [l.rstrip("\n").split("\t") for l in open(sys.argv[2], encoding="utf-8") if l.strip()]
cols, tw, th, pad = 6, 300, 300, 46
n = len(rows); R = (n + cols - 1) // cols
sheet = Image.new("RGB", (cols * tw, R * (th + pad)), "white"); d = ImageDraw.Draw(sheet)
for i, (key, label) in enumerate(rows):
    x, y = (i % cols) * tw, (i // cols) * (th + pad)
    try:
        im = Image.open(os.path.join(SRC, key)).convert("RGB"); im.thumbnail((tw - 8, th - 8))
        sheet.paste(im, (x + (tw - im.width) // 2, y + (th - im.height) // 2))
    except Exception as e:
        d.text((x + 6, y + 6), f"missing: {e}"[:40], fill="red")
    d.text((x + 6, y + th + 2), key.replace("clickview/", "").replace("-cover.jpg", "")[:46], fill="black")
    d.text((x + 6, y + th + 18), label[:46], fill=(90, 90, 90))
sheet.save(sys.argv[1]); print("wrote", sys.argv[1], sheet.size, n, "tiles")
