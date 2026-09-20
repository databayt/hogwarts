#!/usr/bin/env python3
"""validate.py <out-file.json> [...]  — gate for authored concept/image maps."""
import json, sys, os, collections
HERE = os.path.dirname(os.path.abspath(__file__))
CONCEPTS = {"art","life","career","celebration","chemistry","civic","computer","earth","economy","english","geography","health","history","language","skills","math","nature","sport","physics","mind","faith","science","society","teaching"}
VOCAB = {v["key"]: v for v in json.load(open(f"{HERE}/vocab.json"))}
WORK = collections.defaultdict(dict)
for w in json.load(open(f"{HERE}/worklist.json")):
    WORK[(w["grade"], w["dir"])][w["slug"]] = [l["slug"] for l in w["lessons"]]
FAITH_PALETTE = {l.split(" | ")[0] for l in open(f"{HERE}/faith-palette.txt") if l.startswith("clickview/")}
import re as _re
RELIGIOUS_RE = _re.compile(r"(?<![A-Za-z])(quran|qur'an|surah|surat|hadith|prophet|islam|islamic|muslim|muslims|sunnah|tajweed)(?![A-Za-z])|(?<![\u0600-\u06FF])(القرآن|سورة|الحديث النبوي|النبوي|النبوية|الإسلام|الإسلامي|الإسلامية|المسلمين|المسلمون|التجويد)(?![\u0600-\u06FF])", _re.I)
TITLES = {}
for _w in json.load(open(f"{HERE}/worklist.json")):
    TITLES[(_w["grade"], _w["dir"], _w["slug"])] = f"{_w.get('titleEn') or ''} {_w.get('title') or ''}"
    for _l in _w["lessons"]: TITLES[(_w["grade"], _w["dir"], _w["slug"], _l["slug"])] = f"{_l.get('titleEn') or ''} {_l.get('title') or ''}"
BAD_NEAR_FAITH = {"historical-inquiry", "historical-thinking-concepts", "financial-literacy", "ethical-debates", "mindfulness", "growth-mindset", "rules-rights-and-responsibilities", "human-rights", "human-rights-day", "hygiene", "health-conditions", "sound-elementary-placeholder", "study-music", "self-management", "world-mental-health-day", "the-history-of-activism", "the-civil-rights-movement", "ancient-egypt", "ancient-greece", "ancient-mesopotamia", "mayan-civilization", "ancient-china"}
FAITH_DIRS = {"islamic", "islamic-studies", "quran", "christian-education", "islamic-studies-optional"}
# Topic slugs that must never be used, at any level, in any subject.
DENY = {
    # depict a specific faith (grade 12 stayed neutral even for religious content)
    "buddhism", "christianity", "hinduism", "judaism", "sikhism", "comparative-religion",
    "christmas", "diwali", "easter", "hanukkah", "lent",  # ramadan + islam VIEWED 2026-09-20: lantern / beads+rug+book, respectful - allowed
    # festivals and commemorations foreign to Sudanese schools
    "halloween", "valentines-day", "valentine-s-day", "saint-patricks-day", "saint-patrick-s-day", "thanksgiving",
    "lunar-new-year", "moon-festival", "cinco-de-mayo", "asian-pacific-american-heritage-month",
    "national-hispanic-heritage-month", "native-american-heritage-month", "black-history-month",
    "presidents-day", "memorial-day", "veterans-day", "martin-luther-king-jr-day", "independence-day",
    "constitution-day", "flag-day", "labor-day", "indigenous-peoples-day", "holocaust-memorial-day",
    "international-women-s-day", "international-womens-day", "iditarod-trail-sled-dog-race",
    "international-day-of-yoga", "world-meditation-day",
    # sensitive health and relationship topics
    "literary-contexts",  # VIEWED 2026-09-20: woman in a backless evening dress - unsuitable in any subject
    "puberty", "drug-awareness",  # respectful-relationships viewed 2026-09-20: handshake + heart in hand, neutral - allowed
}
def check(path):
    errs, warns = [], []
    try: d = json.load(open(path))
    except Exception as e: return [f"unreadable JSON: {e}"], []
    key = (d.get("grade"), d.get("dir"))
    if key not in WORK: return [f"unknown subject {key}"], []
    want = WORK[key]; got = d.get("chapters") or {}
    for s in want:
        if s not in got: errs.append(f"missing chapter {s}")
    for s, c in got.items():
        if s not in want: errs.append(f"unknown chapter slug {s}"); continue
        if c.get("concept") not in CONCEPTS: errs.append(f"{s}: bad concept {c.get('concept')!r}")
        img = c.get("image")
        if img not in VOCAB: errs.append(f"{s}: image not in vocab: {img!r}")
        elif key[1] not in FAITH_DIRS and RELIGIOUS_RE.search(TITLES.get((key[0], key[1], s), "")) and VOCAB[img]["slug"] in BAD_NEAR_FAITH: errs.append(f"{s}: Islamic-themed title - cover '{VOCAB[img]['slug']}' was viewed and is unsuitable here; pick another")
        elif key[1] in FAITH_DIRS and img not in FAITH_PALETTE: errs.append(f"{s}: faith subject - image must come from faith-palette.txt (covers were viewed; topic names mislead). Got {img}")
        elif VOCAB[img]["slug"] in DENY: errs.append(f"{s}: cover '{VOCAB[img]['slug']}' is on the denylist (faith-specific, foreign festival or sensitive) - pick a neutral thematic cover")
        for ls, lv in (c.get("lessons") or {}).items():
            if ls not in want[s]: errs.append(f"{s}: unknown lesson slug {ls}"); continue
            li = (lv or {}).get("image")
            if li not in VOCAB: errs.append(f"{s}/{ls}: lesson image not in vocab: {li!r}")
            elif li == img: errs.append(f"{s}/{ls}: override equals the chapter image")
            elif key[1] not in FAITH_DIRS and RELIGIOUS_RE.search(TITLES.get((key[0], key[1], s, ls), "")) and VOCAB[li]["slug"] in BAD_NEAR_FAITH: errs.append(f"{s}/{ls}: Islamic-themed title - cover '{VOCAB[li]['slug']}' was viewed and is unsuitable here; pick another")
            elif key[1] in FAITH_DIRS and li not in FAITH_PALETTE: errs.append(f"{s}/{ls}: faith subject - lesson image must come from faith-palette.txt. Got {li}")
            elif VOCAB[li]["slug"] in DENY: errs.append(f"{s}/{ls}: cover '{VOCAB[li]['slug']}' is on the denylist (faith-specific, foreign festival or sensitive) - pick a neutral thematic cover")
    imgs = collections.Counter(c.get("image") for c in got.values())
    n = len(got)
    for k, v in imgs.items():
        if n >= 4 and v > max(2, n // 3): warns.append(f"cover reused {v}x of {n} chapters: {k}")
    return errs, warns
bad = 0
for p in sys.argv[1:]:
    e, w = check(p)
    print(("OK  " if not e else "FAIL"), p, f"({len(w)} warnings)" if w else "")
    for x in e: print("   ERROR", x)
    for x in w: print("   warn ", x)
    bad += bool(e)
sys.exit(1 if bad else 0)
