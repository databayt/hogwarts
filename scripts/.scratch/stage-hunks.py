#!/usr/bin/env python3
"""Stage only the hunks of a file whose body matches (or does not match) a regex.

usage: stage-hunks.py <path> --keep <regex>   # stage hunks containing regex
       stage-hunks.py <path> --drop <regex>   # stage hunks NOT containing regex
Prints which hunks were staged/skipped. Never touches the working tree.
"""
import re, subprocess, sys

path = sys.argv[1]
mode = sys.argv[2]
rx = re.compile(sys.argv[3], re.S)
diff = subprocess.run(["git", "diff", "--", path], capture_output=True, text=True, check=True).stdout
if not diff.strip():
    print("no diff"); sys.exit(0)
head_end = diff.index("\n@@")
header = diff[: head_end + 1]
body = diff[head_end + 1 :]
parts = re.split(r"(?m)^(?=@@ )", body)
hunks = [p for p in parts if p.startswith("@@")]
kept, skipped = [], []
for h in hunks:
    m = rx.search(h)
    keep = bool(m) if mode == "--keep" else not m
    (kept if keep else skipped).append(h)
for h in skipped:
    print("SKIP", h.splitlines()[0][:80])
for h in kept:
    print("KEEP", h.splitlines()[0][:80])
if not kept:
    print("nothing to stage"); sys.exit(0)
patch = header + "".join(kept)
r = subprocess.run(["git", "apply", "--cached", "--recount", "-"], input=patch, text=True, capture_output=True)
if r.returncode != 0:
    print("APPLY FAILED:", r.stderr); sys.exit(1)
print(f"staged {len(kept)} hunk(s), skipped {len(skipped)}")
