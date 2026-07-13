# Carousels — العرض المتحرك

Bilingual social-carousel decks for the hogwarts brand. Each `<slug>.json` is
one deck (3–10 slides, every text field `{ar, en}`), validated by the kun
engine's contract (`kun/src/components/root/carousel/schema.ts`).

The engine renders them:

```bash
# in ~/kun (dev server on :3000)
pnpm carousel:render hogwarts/<slug>     # → ~/Downloads/carousels/hogwarts/<slug>/
```

Review in the browser at `localhost:3000/ar/carousel/hogwarts/<slug>` (all
slides) · `?slide=N` (exact frame) · `?view=board` (the 16-frame Figma layout).

Per-block decks (from `.claude/blocks.json`) land here too as
`block-<name>.json`. Copy, art, and pipeline rules:
`kun/.claude/skills/carousel/SKILL.md`. PNG/PDF renders are the source of
truth; the Figma file holds a flat snapshot on its carousels page.
