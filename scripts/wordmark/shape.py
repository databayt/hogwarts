"""Shape one Arabic word with a font's GSUB positional forms and emit
per-contour SVG paths, already flipped into SVG's Y-down space.

  python3 shape.py <font.woff2> "<word>" [feature,feature]
"""
import re, sys, json
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import DecomposingRecordingPen

FONT, WORD = sys.argv[1], sys.argv[2]
FEATURES = set(sys.argv[3].split(",")) if len(sys.argv) > 3 else set()

f = TTFont(FONT)
cmap, gs, hmtx = f.getBestCmap(), f.getGlyphSet(), f["hmtx"]

DUAL = set("بتثجحخسشصضطظعغفقكلمنهي")
RIGHT = set("اأإآدذرزوؤة")


def jclass(ch):
    return "D" if ch in DUAL else "R" if ch in RIGHT else "U"


chars = list(WORD)
forms = []
for i, ch in enumerate(chars):
    prev_fwd = i > 0 and jclass(chars[i - 1]) == "D"
    next_back = i + 1 < len(chars) and jclass(chars[i + 1]) in ("D", "R")
    c = jclass(ch)
    if c == "U":
        forms.append("isol")
    elif c == "R":
        forms.append("fina" if prev_fwd else "isol")
    elif prev_fwd and next_back:
        forms.append("medi")
    elif prev_fwd:
        forms.append("fina")
    elif next_back:
        forms.append("init")
    else:
        forms.append("isol")


def single_subs(tag):
    gsub, out, idxs = f["GSUB"].table, {}, []
    for fr in gsub.FeatureList.FeatureRecord:
        if fr.FeatureTag == tag:
            idxs += list(fr.Feature.LookupListIndex)
    for li in idxs:
        lk = gsub.LookupList.Lookup[li]
        if lk.LookupType != 1:
            continue
        for st in lk.SubTable:
            out.update(getattr(st, "mapping", {}) or {})
    return out


SUBS = {t: single_subs(t) for t in {"init", "medi", "fina"} | FEATURES}

glyphs = []
for ch, form in zip(chars, forms):
    g = cmap[ord(ch)]
    g = SUBS.get(form, {}).get(g, g)          # positional form
    for fe in sorted(FEATURES):               # then opt-in features (ss01 ...)
        g = SUBS.get(fe, {}).get(g, g)
    glyphs.append((ch, form, g))


def contours(gname):
    """[(pathstring, (x0,y0,x1,y1))] in SVG space (Y down), baseline at 0."""
    pen = DecomposingRecordingPen(gs)
    gs[gname].draw(pen)
    out, cur, pts = [], [], []

    def flush():
        if cur:
            xs = [p[0] for p in pts]
            ys = [p[1] for p in pts]
            out.append(("".join(cur), (min(xs), min(ys), max(xs), max(ys))))

    def n(v):
        return f"{v:.1f}".rstrip("0").rstrip(".")

    def pt(p):
        pts.append((p[0], -p[1]))
        return f"{n(p[0])} {n(-p[1])}"

    for op, args in pen.value:
        if op == "moveTo":
            flush()
            cur, pts = [], []
            cur.append("M" + pt(args[0]))
        elif op == "lineTo":
            cur.append("L" + pt(args[0]))
        elif op == "curveTo":
            cur.append("C" + " ".join(pt(a) for a in args))
        elif op == "qCurveTo":
            cur.append("Q" + " ".join(pt(a) for a in args if a))
        elif op == "closePath":
            cur.append("Z")
    flush()
    return out


total = sum(hmtx[g][0] for _, _, g in glyphs)
x, out = total, []
for ch, form, g in glyphs:
    adv = hmtx[g][0]
    x -= adv
    cs = contours(g)
    out.append({
        "char": ch, "form": form, "glyph": g, "adv": adv, "x": x,
        "contours": [{"d": d, "bbox": [round(v, 1) for v in b]} for d, b in cs],
    })


def union_outline(glyph_records):
    """One merged outline for the whole word.

    Drawing each glyph's own contour leaves a vertical seam wherever two
    letters butt together on the connector — three of them in بالقلم — because
    each closed contour draws its own edge at the join. The reference has no
    seams: its outline is the united silhouette. skia-pathops does the boolean
    union; the counters survive it, they are separate contours with the
    opposite winding.
    """
    import pathops
    from fontTools.svgLib.path import parse_path

    def inside(a, b):
        return (b[0] <= a[0] and b[1] <= a[1] and a[2] <= b[2] and a[3] <= b[3]
                and (a[2] - a[0]) * (a[3] - a[1]) < (b[2] - b[0]) * (b[3] - b[1]))

    # Counters (the ق loop, the م bowl) are kept OUT of the union and appended
    # as their own subpaths. Unioning them makes skia rewind the hole into the
    # outer contour through a keyhole, which strokes as a visible hairline
    # slit across the letter.
    holes = []
    builder = pathops.OpBuilder(fix_winding=True, keep_starting_points=False)
    for rec in glyph_records:
        boxes = [c["bbox"] for c in rec["contours"]]
        for i, c in enumerate(rec["contours"]):
            if any(j != i and inside(boxes[i], boxes[j]) for j in range(len(boxes))):
                holes.append((c["d"], rec["x"]))
                continue
            piece = pathops.Path()
            parse_path(c["d"], piece.getPen())
            builder.add(piece.transform(1, 0, 0, 1, rec["x"], 0),
                        pathops.PathOp.UNION)
    acc = builder.resolve()

    class _SVG:
        def __init__(self): self.d = []
        def _n(self, v): return f"{v:.1f}".rstrip("0").rstrip(".")
        def moveTo(self, p): self.d.append(f"M{self._n(p[0])} {self._n(p[1])}")
        def lineTo(self, p): self.d.append(f"L{self._n(p[0])} {self._n(p[1])}")
        def curveTo(self, *pts):
            self.d.append("C" + " ".join(f"{self._n(a)} {self._n(b)}" for a, b in pts))
        def qCurveTo(self, *pts):
            self.d.append("Q" + " ".join(f"{self._n(a)} {self._n(b)}" for a, b in pts if a is not None))
        def closePath(self): self.d.append("Z")
        def endPath(self): pass

    pen = _SVG()
    acc.draw(pen)
    out = "".join(pen.d)
    for d_, dx in holes:
        shifted = re.sub(r"(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)",
                         lambda m: f"{float(m.group(1)) + dx:g} {m.group(2)}", d_)
        out += shifted
    return out


print(json.dumps({"word": WORD, "upem": f["head"].unitsPerEm, "advance": total,
                  "glyphs": out, "outline": union_outline(out)},
                 ensure_ascii=False))
