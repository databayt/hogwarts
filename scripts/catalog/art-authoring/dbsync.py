#!/usr/bin/env python3
"""dbsync.py <sd-subject-dirs.json> > update.sql

Emit a reversible, non-destructive SQL script that writes to the LOCAL catalog exactly what
`prisma/seeds/catalog/sd.ts` would write for the authored fields:

  chapter.concept      = authored concept
  chapter.thumbnailKey = authored image
  lesson.thumbnailKey  = the lesson's own image, else its chapter's image
  lesson.concept       = chapter concept, unless the lesson slug type is one the seed maps itself

No row is deleted or recreated, so question scopes, live-session links and progress rows survive.
Rows are matched by subject slug + chapter slug (+ lesson slug).
"""
import glob
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
# lesson slug types the seed resolves through LESSON_TYPE_CONCEPT — leave their concept alone
SEED_OWNED_TYPES = {"reading", "literature", "dictation", "expression", "grammar", "spelling", "writing",
                    "decouverte", "ecouter-et-comprendre", "ecrire", "lire", "ouverture", "parler", "bilan"}


def q(s):
    return "'" + s.replace("'", "''") + "'"


def main():
    dirs = json.load(open(sys.argv[1], encoding="utf-8"))
    # manifest shape: list of {grade, dir, dbSlug} or dict keyed "g5/math"
    slug_of = {}
    if isinstance(dirs, dict):
        for k, v in dirs.items():
            slug_of[k] = v if isinstance(v, str) else (v.get("dbSlug") or v.get("slug"))
    else:
        for e in dirs:
            slug_of[f"{e.get('grade')}/{e.get('dir') or e.get('subjectDir')}"] = e.get("dbSlug") or e.get("slug")

    work = {(w["grade"], w["dir"], w["slug"]): [l["slug"] for l in w["lessons"]]
            for w in json.load(open(f"{HERE}/worklist.json", encoding="utf-8"))}
    out = ["BEGIN;"]
    unmapped = []
    n_ch = n_les = 0
    for f in sorted(glob.glob(f"{HERE}/out/g*/*.json")):
        spec = json.load(open(f, encoding="utf-8"))
        g, d = spec["grade"], spec["dir"]
        db_slug = slug_of.get(f"g{g}/{d}")
        if not db_slug:
            unmapped.append(f"g{g}/{d}")
            continue
        for ch_slug, a in spec["chapters"].items():
            n_ch += 1
            out.append(
                f"UPDATE catalog_chapters c SET concept={q(a['concept'])}, \"thumbnailKey\"={q(a['image'])} "
                f"FROM catalog_subjects s WHERE c.\"subjectId\"=s.id AND s.slug={q(db_slug)} AND c.slug={q(ch_slug)};")
            overrides = {k: v["image"] for k, v in (a.get("lessons") or {}).items()}
            for ls in work.get((g, d, ch_slug), []):
                n_les += 1
                img = overrides.get(ls, a["image"])
                lesson_type = re.sub(r"^\d+-", "", ls)
                set_concept = "" if lesson_type in SEED_OWNED_TYPES else f"concept={q(a['concept'])}, "
                out.append(
                    f"UPDATE catalog_lessons l SET {set_concept}\"thumbnailKey\"={q(img)} "
                    f"FROM catalog_chapters c, catalog_subjects s WHERE l.\"chapterId\"=c.id AND c.\"subjectId\"=s.id "
                    f"AND s.slug={q(db_slug)} AND c.slug={q(ch_slug)} AND l.slug={q(ls)};")
    out.append("COMMIT;")
    print("\n".join(out))
    print(f"-- chapters {n_ch} | lessons {n_les} | unmapped subjects {len(unmapped)}: {unmapped}", file=sys.stderr)


if __name__ == "__main__":
    main()
