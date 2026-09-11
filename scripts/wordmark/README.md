# Wordmark writing animation

Generates the animated word in the homepage's "8" panel
(`thmanyah/atom/WordmarkWriting.tsx` + the `.bq-*` rules in
`src/styles/thmanyah-clone.css`).

The reference (font.thmanyah.com) writes ثمانية there with
`public/lottie/lottie-stats-letter.json` — 80 baked outline layers, zero text
layers, chunked by stroke rather than by letter. Nothing in it can be
retargeted to another word, so the word is rebuilt from the font instead.

```bash
pip install fonttools brotli skia-pathops
python3 scripts/wordmark/shape.py \
  public/fonts/thmanyah-serif-display-black.woff2 "بالقلم" ss01 > .wordmark/word.json
python3 scripts/wordmark/compose.py .wordmark   # -> out.jsx + out.css + vb.txt
```

`shape.py` applies the font's own `init`/`medi`/`fina` GSUB lookups (there is
no HarfBuzz here — the joining rules are inline) and emits one SVG path per
contour, already flipped into SVG's Y-down space with the baseline at 0.
`compose.py` splits bodies from diacritic dots, lays out the anatomy marks,
and writes the keyframes. Timing is read off the reference Lottie: a 9.64s
cycle (241 frames @ 25fps), letters entering at frames 29/54/76/97/112/143
and the dots at 171/186.

Both scripts read/write next to `.tmp-glyphs/`; adjust the paths at the top
when regenerating.

## Full regeneration

```bash
mkdir -p .wordmark
python3 scripts/wordmark/shape.py \
  public/fonts/thmanyah-serif-display-black.woff2 "بالقلم" ss01 > .wordmark/word.json
python3 scripts/wordmark/compose.py   .wordmark   # -> out.jsx / out.css / vb.txt
python3 scripts/wordmark/emit-jsx.py             # -> thmanyah/atom/WordmarkWriting.tsx
python3 scripts/wordmark/apply-css.py            # -> the .bq-* block in thmanyah-clone.css
npx prettier --write src/components/saas-marketing/thmanyah/atom/WordmarkWriting.tsx src/styles/thmanyah-clone.css
```

`apply-css.py` rebuilds the stylesheet from `git show HEAD:` rather than
splicing the working copy — splicing duplicated the block once already, and a
stale second copy silently overrode the new keyframes. Commit the CSS before
regenerating, or it will rebuild from the last committed state.
