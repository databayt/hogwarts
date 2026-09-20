#!/usr/bin/env python3
"""review.py — aggregate gate over every authored file in out/."""
import json, glob, os, collections, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
vocab = {v["key"]: v for v in json.load(open(f"{HERE}/vocab.json"))}
work = json.load(open(f"{HERE}/worklist.json"))
want = collections.Counter((w["grade"], w["dir"]) for w in work)
lessons_total = {(w["grade"], w["dir"], w["slug"]): len(w["lessons"]) for w in work}
files = sorted(glob.glob(f"{HERE}/out/g*/*.json"))
r = subprocess.run([sys.executable, f"{HERE}/validate.py", *files], capture_output=True, text=True)
fails = [l for l in r.stdout.splitlines() if l.startswith("FAIL") or "ERROR" in l]
warns = [l for l in r.stdout.splitlines() if "warn " in l]
got = {}
for f in files:
    d = json.load(open(f)); got[(d["grade"], d["dir"])] = d
missing = [k for k in want if k not in got]
print(f"subjects authored {len(got)}/{len(want)} | validator failures {len([l for l in fails if l.startswith('FAIL')])} | reuse warnings {len(warns)}")
for k in missing: print("   MISSING subject", k)
for l in fails[:30]: print("  ", l)
ch = ov = les = 0; covers = collections.Counter(); lvl = collections.defaultdict(collections.Counter); concepts = collections.Counter()
for (g, d), spec in got.items():
    for slug, a in spec["chapters"].items():
        ch += 1; covers[a["image"]] += 1; concepts[a["concept"]] += 1
        if a["image"] in vocab: lvl[g][vocab[a["image"]]["level"]] += 1
        les += lessons_total.get((g, d, slug), 0)
        for ls, lv in (a.get("lessons") or {}).items(): ov += 1; covers[lv["image"]] += 1
print(f"chapters {ch}/620 | lessons under them {les} | lesson overrides {ov} ({100*ov/max(les,1):.1f}%) | distinct covers {len(covers)} of {len(vocab)}")
print("level mix by grade (elementary/middle/high):")
for g in sorted(lvl): print(f"   g{g:<2} {lvl[g]['elementary']:3} / {lvl[g]['middle']:3} / {lvl[g]['high']:3}")
print("concepts:", dict(concepts.most_common()))
print("most reused covers:", [(k.replace('clickview/',''), n) for k, n in covers.most_common(12)])
json.dump(sorted(covers), open(f"{HERE}/chosen-keys.json", "w"))
