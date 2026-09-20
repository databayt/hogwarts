# Catalog art authoring

Tooling that assigns a shared concept and a topic cover to every chapter (and, where a lesson
clearly diverges, to the lesson) in `curriculum/<cur>/g*/<subject>/structure.json`.
First used 2026-09-20 for Sudan grades 1–11: 110 subjects, 620 chapters, 3,274 lessons.

The seed contract is in `prisma/seeds/catalog/sd.ts`: a chapter may carry `concept` (one of
`CONCEPTS` in `src/components/catalog/concepts-data.ts`) and `image` (a full CDN key **with** an
image extension, used verbatim). A lesson inherits its chapter's image unless it carries its own.

## The rule that matters: look at the cover

**A topic name does not tell you what the artwork shows.** Every one of these was found only by
viewing the image:

| Key                                                               | Name suggests | Actually shows                           |
| ----------------------------------------------------------------- | ------------- | ---------------------------------------- |
| `high-literary-contexts`                                          | literature    | a woman in a backless evening dress      |
| `*-financial-literacy` (all three levels)                         | money         | a piggy bank                             |
| `*-historical-inquiry`, `elementary-historical-thinking-concepts` | history       | a European ship with a cross on its sail |
| `high-ethical-debates`                                            | ethics        | a halo and a devil's tail                |
| `*-independence-day`                                              | independence  | the US flag and the Statue of Liberty    |
| `middle-foundational-documents`                                   | constitution  | "We the People"                          |
| `*-hygiene`, `middle-health-conditions`                           | cleanliness   | germs in a blood vessel                  |
| `middle-growth-and-development`                                   | growth        | a fertilisation diagram                  |

It cuts both ways: `ramadan` (a lantern), `islam` (beads, a prayer rug, a closed book) and
`respectful-relationships` (a handshake) were banned by name and turned out to be fine.

So: agents may propose covers from names, but **faith subjects use `faith-palette.txt` only** —
89 covers that were each viewed — and every chosen cover gets a contact-sheet pass (`sheet.py`)
before anything is applied.

## Files

| File                | Purpose                                                                                                                                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BRIEF.md`          | The brief given to authoring agents                                                                                                                                                                            |
| `validate.py`       | Gate: key exists, concept valid, denylist, faith palette, no override equal to its chapter, reuse warning                                                                                                      |
| `faith-palette.txt` | Vetted covers for `islamic`, `islamic-studies`, `quran`, `christian-education`                                                                                                                                 |
| `review.py`         | Aggregate gate over every authored file                                                                                                                                                                        |
| `sheet.py`          | Contact sheet of covers, read from `codebase/public/cdn`                                                                                                                                                       |
| `apply.py`          | Splices the fields into `structure.json` **by position** — 18 of the 110 files are hand-formatted with one-line lesson objects, and a re-dump would reformat them. Verifies by parsing; idempotent; `--backup` |
| `dbsync.py`         | Non-destructive SQL that writes exactly what `sd.ts` would for these fields                                                                                                                                    |

`validate.py`, `review.py` and `dbsync.py` read two derived files from their own directory. They are
not committed; regenerate them:

- `vocab.json` — every `clickview/*-cover*.jpg` key in `codebase/src/registry/cdn-manifest.json`,
  joined to `scripts/us-curriculum/url-mapping.json` through `codebase/src/registry/clickview-map.json`
  for `topic` / `group` / `subject`. Shape: `[{key, level, slug, topic, group, subject}]`.
- `worklist.json` — one entry per chapter of the grades in scope:
  `[{grade, dir, slug, title, titleEn, lessons: [{slug, title, titleEn}]}]`.

Authored maps go in `out/g<grade>/<dir>.json`. The 2026-09-20 maps, the SQL that was run and the
rollback of the previous values are kept beside the curriculum backups (local only, `curriculum/` is
gitignored): `curriculum/sd/_old/2026-09-20-pre-art-authoring/_authoring/`.

## Why `dbsync.py` and not the seed

`pnpm db:seed:single sd` deletes and recreates every SD chapter and lesson, which unlinks live
sessions and question scopes until `sd-content` runs. `dbsync.py` updates the same fields in place.
The structure files stay the source of truth, so the next `sd` run reproduces the result.

## Order

1. Build `vocab.json` and `worklist.json`; give agents `BRIEF.md`, one grade band each, one file per subject.
2. Author the faith subjects by hand from `faith-palette.txt`.
3. `review.py` until 0 failures; `sheet.py` over every chosen cover not yet viewed; fix what the eye finds.
4. `apply.py --root curriculum/sd` (dry run), then `--write --backup …`; re-run must report every file `same`.
5. `dbsync.py prisma/seeds/catalog/sd-subject-dirs.json > update.sql`; save current values; run; re-measure.
