#!/usr/bin/env python3
"""Reveal the forensic watermark in a leaked capture, and measure the mark.

    reveal.py reveal <capture.png> <out.png>
        Recover the tiled viewer code from ONE frame of a screenshot or a
        recording (extract with: ffmpeg -ss 4 -i leak.mp4 -frames:v 1 f.png).
        High-pass the luminance against a wide blur, then amplify: the scene
        is mostly low-frequency and falls away; the mark's letters stand up.
        Read the 8-character code off the result and look the viewer up with
        `SELECT id, email FROM users WHERE id LIKE '%<code>'`.

    reveal.py stats <clean.png> <marked.png>
        How much the mark changes the picture: per-pixel luminance delta over
        the pixels it touches. Used to tune the opacity in video-watermark.tsx.
"""
import sys

import numpy as np
from PIL import Image, ImageFilter


def luma(path):
    return np.asarray(Image.open(path).convert("L"), dtype=np.float32)


def reveal(src, out, gain=14.0, radius=10):
    img = Image.open(src).convert("L")
    base = np.asarray(img, dtype=np.float32)
    blurred = np.asarray(img.filter(ImageFilter.GaussianBlur(radius)), dtype=np.float32)
    detail = base - blurred
    # Clip bright scene edges so they don't dominate the stretch.
    detail = np.clip(detail, -6, 6)
    Image.fromarray(np.clip(128 + detail * gain, 0, 255).astype(np.uint8)).save(out)


def stats(clean, marked):
    d = np.abs(luma(marked) - luma(clean))
    touched = d[d >= 1]
    print(
        f"pixels touched {touched.size / d.size:.1%}  "
        f"mean Δ {touched.mean() if touched.size else 0:.2f}  "
        f"p95 Δ {np.percentile(touched, 95) if touched.size else 0:.1f}  "
        f"max Δ {d.max():.0f}  (levels of 255)"
    )


if __name__ == "__main__":
    cmd, *args = sys.argv[1:]
    {"reveal": reveal, "stats": stats}[cmd](*args)
