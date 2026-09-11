# -*- coding: utf-8 -*-
"""Compose the animated wordmark panel from shape.py's word.json.

The word stands as a hairline OUTLINE from the first frame, then fills, holds
and loops — the shape of what font.thmanyah.com does in the same panel, read
off its rendered frames.

Arabic joins into connected groups, and بالقلم is two of them: با, then لقلم.
The ink flows through a group like a pipe — one continuous run, no break
between its letters — and the three dots go on at the end, the way a hand
adds them.

Usage: python3 compose.py [workdir]      (default .wordmark)
"""
import json, math, os, re, sys

WORK = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("WORDMARK_WORK", ".wordmark")
os.makedirs(WORK, exist_ok=True)

d = json.load(open(f"{WORK}/word.json"))

INK = "#000"
CYCLE = 9.64          # 241 frames @ 25fps, as the reference
HAIR = 3.2            # its outline stroke is 3 in a 3840 comp, rescaled
BIG = 9000            # half-plane extent, well past the viewBox
BINS = 160
SCANLINES = 260
SAMPLES = 90
LEAD_IN = 0.05        # a hair of overlap bridges the handoff

# Off the reference's trim-path keyframes: its fill starts at frame 29 and the
# last of it lands by 208. The dots are held to the end.
BODY_SPAN, DOT_SPAN = (29 / 25, 185 / 25), (188 / 25, 208 / 25)

# One accelerate-cruise-decelerate across the whole word, not one per letter —
# per-letter easing reads as stop-start. Blended toward linear because the
# curve at full strength swings 2.3x between fastest and slowest.
EASE_PTS, EASE_MIX = (0.42, 0, 0.58, 1), 0.35

# The flow, in writing order (the source order is already RTL):
#
#   با     the ب bowl flows left along the baseline, then up the alef
#   لقلم   opens at the TOP of the initial ل and flows down into the baseline,
#          then left through the ق, on through the medial ل — whose stem
#          RISES as the front passes, the direction tilted so the baseline
#          leads and the top trails — and into the م loop and its tail
#   ...    then ب's dot, then ق's two
#
# (dx, dy) is the travel direction; the front is the line perpendicular to it.
# A stem's two ends are top and baseline while its neighbours sit on the
# baseline, so its direction follows where the pen ARRIVES.
STROKES = [
    ("ب", (-1.0, 0.20)),
    ("ا", (-0.12, -1.0)),
    ("ل", (-0.35, 1.0)),
    ("ق", (-1.0, 0.12)),
    ("ل", (-1.0, -0.35)),
    ("م", (-0.55, 1.0)),
]
DOT_STROKES = [(-0.70, 1.0), (-1.0, 0.25)]

# --- framing ---------------------------------------------------------------
# Matched to the reference by measurement: in a 1512x805 panel its word spans
# 814.2px = 53.85% of the panel width, centred 5.9px above centre.
#
# Its ثمانية is a tatweel'd lockup (bbox aspect 2.39; the same string in the
# plain font is 1.87), so no other word can match both its width and height —
# matching the width is what makes the letterforms read at the same size. And
# it uses "slice", which scales by WIDTH on any panel wider than its 16:9
# comp, where "meet" on a 16:9 viewBox scales by height and lands ~8% small.
# Hence VB_ASPECT 1.9: width stays the binding dimension across the usual
# desktop range, without cropping the word on tall panels the way slice would.
# WORD_SHARE is 0.5413, not the measured 0.5385, because the bboxes come from
# control points and overestimate the outline by ~0.5%.
WORD_SHARE, VB_ASPECT, RISE = 0.5413, 1.9, 0.0073

xs0 = min(g["x"] + c["bbox"][0] for g in d["glyphs"] for c in g["contours"])
xs1 = max(g["x"] + c["bbox"][2] for g in d["glyphs"] for c in g["contours"])
ys0 = min(c["bbox"][1] for g in d["glyphs"] for c in g["contours"])
ys1 = max(c["bbox"][3] for g in d["glyphs"] for c in g["contours"])
_w = (xs1 - xs0) / WORD_SHARE
_h = _w / VB_ASPECT
VB = [round(xs0 - (_w - (xs1 - xs0)) / 2),
      round((ys0 + ys1) / 2 - _h / 2 + _h * RISE), round(_w), round(_h)]


def pct(t):
    return round(t / CYCLE * 100, 3)


def bow(plo, phi):
    """Nib curvature — the front bows so its middle leads and its two sides
    trail, which is how a nib lays ink; flat is still a scan, only a shorter
    one. Capped, because the amplitude is also DEAD TRAVEL: the front must
    clear its own bow before touching ink, and 16% of a tall letter's
    cross-extent was ~130 units of the letter sitting still."""
    return min(((phi + 30) - (plo - 30)) * 0.10, 70)


# --- geometry --------------------------------------------------------------
def flatten(contours, dx):
    """Contours as polygons in absolute coordinates, cubics sampled."""
    polys = []
    for c in contours:
        pts, cur = [], None
        for cmd, arg in re.findall(r"([MLCQZ])([^MLCQZ]*)", c["d"]):
            n = [float(v) for v in re.findall(r"-?\d+(?:\.\d+)?", arg)]
            ps = list(zip(n[0::2], n[1::2]))
            if cmd == "M":
                cur = ps[0]
                pts.append(cur)
            elif cmd == "L":
                for q in ps:
                    pts.append(q)
                    cur = q
            elif cmd == "C":
                for k in range(0, len(ps), 3):
                    a, b, e = ps[k], ps[k + 1], ps[k + 2]
                    for j in range(1, 9):
                        u, m = j / 8, 1 - j / 8
                        pts.append((
                            m ** 3 * cur[0] + 3 * m * m * u * a[0]
                            + 3 * m * u * u * b[0] + u ** 3 * e[0],
                            m ** 3 * cur[1] + 3 * m * m * u * a[1]
                            + 3 * m * u * u * b[1] + u ** 3 * e[1]))
                    cur = e
        if len(pts) > 2:
            polys.append([(x + dx, y) for x, y in pts])
    return polys


def area_profile(polys, ux, uy, x0, travel):
    """How much INK sits at each step along the travel direction.

    A front at constant SPEED reveals area in proportion to how wide the
    letter is where it happens to be — crossing the ق bowl it dumped four
    times the mean rate in a burst. Pacing on this keeps the amount of new
    ink per frame constant, which is what reads as smooth.

    It has to be real coverage, not the outline's perpendicular spread: the
    spread counts the gap between the ق's body and its dots as solid ink and
    made a squat bowl look several times larger than a tall stem. Even-odd
    scanline, so counters are excluded too. Binned over the TRAVEL range —
    not the glyph's own projection range, which is a different interval and
    would misplace every keyframe.
    """
    ys = [y for p in polys for _, y in p]
    y0, y1 = min(ys), max(ys)
    span = travel or 1.0
    bins = [0.0] * BINS
    for i in range(SCANLINES):
        y = y0 + (y1 - y0) * (i + 0.5) / SCANLINES
        hits = []
        for poly in polys:
            for (ax, ay), (bx, by) in zip(poly, poly[1:] + poly[:1]):
                if (ay <= y < by) or (by <= y < ay):
                    hits.append(ax + (y - ay) * (bx - ax) / (by - ay))
        hits.sort()
        for a, b in zip(hits[0::2], hits[1::2]):
            n = max(2, min(SAMPLES, int((b - a) / 6) + 2))
            for k in range(n):
                x = a + (b - a) * (k + 0.5) / n
                idx = int(((x * ux + y * uy) - x0) / span * BINS)
                bins[min(BINS - 1, max(0, idx))] += (b - a) / n
    return bins


def split_glyph(g):
    """(body contours incl. counters, dot contours).

    The body is the largest contour; anything inside it is a counter and
    rides with it; anything else detached is a dot, held for the final phase.
    """
    def area(b):
        return (b[2] - b[0]) * (b[3] - b[1])

    def inside(a, b):
        return b[0] <= a[0] and b[1] <= a[1] and a[2] <= b[2] and a[3] <= b[3]

    cs = g["contours"]
    main = max(range(len(cs)), key=lambda i: area(cs[i]["bbox"]))
    body, dots = [], []
    for i, c in enumerate(cs):
        (body if i == main or inside(c["bbox"], cs[main]["bbox"]) else dots).append(c)
    return body, dots


chunks = []
for g, (nm, dirn) in zip(d["glyphs"], STROKES):
    body, dots = split_glyph(g)
    chunks.append((nm, g["x"], body, dirn))
N_BODY = len(chunks)
_dots = [(g, split_glyph(g)[1]) for g in d["glyphs"] if split_glyph(g)[1]]
assert len(_dots) == len(DOT_STROKES), "dot count changed — check DOT_STROKES"
for i, (g, dots) in enumerate(_dots):
    chunks.append((f"·{i}", g["x"], dots, DOT_STROKES[i]))

geom = []
for nm, gx, cs, (dx, dy) in chunks:
    n = math.hypot(dx, dy)
    ux, uy = dx / n, dy / n
    polys = flatten(cs, gx)
    pts = [p for poly in polys for p in poly]
    proj = [x * ux + y * uy for x, y in pts]
    perp = [-x * uy + y * ux for x, y in pts]
    lo, hi = min(proj), max(proj)
    plo, phi = min(perp), max(perp)
    # The start clears the BOW as well as the glyph, and the extents come from
    # the INK — projecting a rotated bbox makes the front cross empty corner
    # space first, which is the letter sitting still then bursting.
    x0 = lo - bow(plo, phi) - 4
    travel = round(hi - x0 + 4, 1)
    geom.append((math.degrees(math.atan2(uy, ux)), lo, hi, plo, phi, x0, travel,
                 area_profile(polys, ux, uy, x0, travel)))


# --- timing ----------------------------------------------------------------
def _bez(t, a, b):
    return 3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * b + t ** 3


def ease_inv(y):
    x1, y1, x2, y2 = EASE_PTS
    lo, hi = 0.0, 1.0
    for _ in range(60):
        mid = (lo + hi) / 2
        if _bez(mid, y1, y2) < y:
            lo = mid
        else:
            hi = mid
    return EASE_MIX * _bez((lo + hi) / 2, x1, x2) + (1 - EASE_MIX) * y


def schedule(areas, span):
    """Windows at a constant ink rate: duration proportional to AREA, placed
    along the global curve, each running linearly."""
    t0, t1 = span
    total, out, run = sum(areas) or 1.0, [], 0.0
    for a in areas:
        s = t0 + (t1 - t0) * ease_inv(run / total)
        run += a
        e = t0 + (t1 - t0) * ease_inv(run / total)
        s = max(t0, s - LEAD_IN)
        out.append((round(s, 3), round(e - s, 3)))
    return out


def area_keyframes(prof, travel, steps=40):
    """Front positions at equal-area intervals.

    The step count matters: CSS interpolates LINEARLY between keyframes, and
    area-versus-position is at its most nonlinear right where a letter starts.
    At 14 steps that first interval dumped its ink at the end of itself, a
    burst about a tenth of a second into every letter.
    """
    total = sum(prof) or 1.0
    run, k, out = 0.0, 0, [(0.0, 0.0)]
    for j in range(1, steps):
        want = total * j / steps
        while k < len(prof) - 1 and run + prof[k] < want:
            run += prof[k]
            k += 1
        frac = (k + ((want - run) / prof[k] if prof[k] else 0)) / len(prof)
        out.append((j / steps, min(1.0, frac) * travel))
    out.append((1.0, travel))
    return out


areas = [sum(p) or 1.0 for *_, p in geom]
TIMING = (schedule(areas[:N_BODY], BODY_SPAN) + schedule(areas[N_BODY:], DOT_SPAN))

# --- markup ----------------------------------------------------------------
css, fill_svg = [], []
for i, ((nm, gx, cs, _), (ang, lo, hi, plo, phi, x0, travel, prof), (t, dur)) in \
        enumerate(zip(chunks, geom, TIMING)):
    amp = bow(plo, phi)
    p0, p1 = plo - 30, phi + 30
    edge = (f"M{x0:.0f} {p0:.0f}"
            f"C{x0 + amp * .9:.0f} {p0 + (p1 - p0) * .22:.0f} "
            f"{x0 + amp:.0f} {p0 + (p1 - p0) * .35:.0f} "
            f"{x0 + amp:.0f} {(p0 + p1) / 2:.0f}"
            f"C{x0 + amp:.0f} {p1 - (p1 - p0) * .35:.0f} "
            f"{x0 + amp * .9:.0f} {p1 - (p1 - p0) * .22:.0f} "
            f"{x0:.0f} {p1:.0f}")
    keys = "".join(f"{pct(t + dur * u)}%{{transform:translateX({x:.1f}px)}}"
                   for u, x in area_keyframes(prof, travel))
    css.append(f"@keyframes bq-f{i}{{0%,{pct(t)}%{{transform:translateX(0)}}"
               f"{keys}{pct(t + dur)}%,100%{{transform:translateX({travel}px)}}}}")
    css.append(f".bq-f{i}{{animation-name:bq-f{i};animation-timing-function:linear}}")
    fill_svg.append(
        f'<mask id="bq-mk{i}" maskUnits="userSpaceOnUse" x="{VB[0]}" y="{VB[1]}" '
        f'width="{VB[2]}" height="{VB[3]}">'
        f'<g transform="rotate({ang:.2f})">'
        f'<path className="bq-r bq-f{i}" fill="#fff" d="{edge}'
        f'L{x0 - BIG:.0f} {p1:.0f}L{x0 - BIG:.0f} {p0:.0f}Z" /></g></mask>'
        # every contour of a chunk rides in ONE path, or its counters (the ق
        # loop, the م bowl) fill solid instead of punching through
        f'<g mask="url(#bq-mk{i})"><path transform="translate({gx} 0)" '
        f'd="{" ".join(c["d"] for c in cs)}" fill="{INK}" /></g>')

css.append("@keyframes bq-cycle{0%,95.5%{opacity:1}100%{opacity:0}}")
css.append(".bq-cycle{animation-name:bq-cycle}")
# Reduced motion: no writing, the finished word held. Each front is parked at
# ITS OWN end — with the animation dropped they would otherwise sit at their
# 0% position and the word would render as outline only.
css.append("@media(prefers-reduced-motion:reduce){.bq-r{animation:none!important}"
           + "".join(f".bq-f{i}{{transform:translateX({g[6]}px)}}"
                     for i, g in enumerate(geom)) + "}")

# One united silhouette. Drawing each glyph's own contour leaves a vertical
# seam wherever two letters butt together on the connector; the reference has
# none. shape.py does the boolean union, keeping counters out of it.
outline_svg = (f'<path d="{d["outline"]}" fill="none" stroke="{INK}" '
               f'strokeWidth="{HAIR}" strokeLinejoin="round" />')

open(f"{WORK}/out.css", "w").write("\n".join(css) + "\n")
open(f"{WORK}/out.jsx", "w").write(f"{outline_svg}\n\n{''.join(fill_svg)}")
open(f"{WORK}/vb.txt", "w").write(" ".join(str(v) for v in VB))
print("flow:", " ".join(c[0] for c in chunks))
for (nm, *_), (t, dur), g in zip(chunks, TIMING, geom):
    print(f"  {nm:<4} {t:5.2f} -> {t + dur:5.2f}   travel {g[6]:6.0f}u")
