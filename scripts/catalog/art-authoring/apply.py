#!/usr/bin/env python3
"""apply.py --root <curriculum/sd> [--write] [--backup <dir>] <out-file.json> [...]

Insert authored `concept` + `image` (chapters) and `image` (lesson overrides) into
<root>/g<grade>/<dir>/structure.json.

The edit is POSITIONAL: fields are spliced into the existing text after the
`titleEn` member (or `title`, or `slug`), so hand-formatted files keep their
formatting byte for byte outside the inserted members. Every file is then parsed
and compared against the expected data; any mismatch aborts that file.
Idempotent: an existing member has its value replaced in place.
"""
import copy
import json
import os
import shutil
import sys

WS = " \t\r\n"


def scan(raw):
    """Minimal JSON scanner that records member offsets. Returns the root node.

    obj node: {"t": "o", "s": start, "e": end_exclusive, "m": [(key, key_start, val_start, val_end, child)]}
    arr node: {"t": "a", "s": start, "e": end_exclusive, "i": [child, ...]}
    scalars: None
    """
    n = len(raw)

    def skip(i):
        while i < n and raw[i] in WS:
            i += 1
        return i

    def string_end(i):  # raw[i] == '"' -> index after the closing quote
        i += 1
        while raw[i] != '"':
            i += 2 if raw[i] == "\\" else 1
        return i + 1

    def value(i):
        i = skip(i)
        c = raw[i]
        if c == "{":
            node = {"t": "o", "s": i, "m": []}
            i = skip(i + 1)
            if raw[i] == "}":
                node["e"] = i + 1
                return i + 1, node
            while True:
                i = skip(i)
                ks = i
                ke = string_end(i)
                key = json.loads(raw[ks:ke])
                i = skip(ke)
                assert raw[i] == ":", f"expected ':' at {i}"
                vs = skip(i + 1)
                ve, child = value(vs)
                node["m"].append((key, ks, vs, ve, child))
                i = skip(ve)
                if raw[i] == ",":
                    i += 1
                    continue
                assert raw[i] == "}", f"expected '}}' at {i}"
                node["e"] = i + 1
                return i + 1, node
        if c == "[":
            node = {"t": "a", "s": i, "i": []}
            i = skip(i + 1)
            if raw[i] == "]":
                node["e"] = i + 1
                return i + 1, node
            while True:
                ve, child = value(i)
                node["i"].append(child)
                i = skip(ve)
                if raw[i] == ",":
                    i += 1
                    continue
                assert raw[i] == "]", f"expected ']' at {i}"
                node["e"] = i + 1
                return i + 1, node
        if c == '"':
            return string_end(i), None
        j = i
        while j < n and raw[j] not in ",]}" + WS:
            j += 1
        return j, None

    _, root = value(0)
    return root


def member(node, key):
    for m in node["m"]:
        if m[0] == key:
            return m
    return None


def plan_fields(raw, node, fields):
    """Edits [(start, end, text)] that set `fields` (ordered dict) on object `node`."""
    edits = []
    missing = []
    for k, v in fields.items():
        m = member(node, k)
        if m:
            edits.append((m[2], m[3], json.dumps(v, ensure_ascii=False)))
        else:
            missing.append((k, v))
    if missing:
        anchor = member(node, "titleEn") or member(node, "title") or member(node, "slug") or node["m"][-1]
        single_line = "\n" not in raw[node["s"]:node["e"]]
        if single_line:
            text = "".join(f', {json.dumps(k)}: {json.dumps(v, ensure_ascii=False)}' for k, v in missing)
        else:
            line_start = raw.rfind("\n", 0, anchor[1]) + 1
            indent = raw[line_start:anchor[1]]
            if indent.strip():  # anchor shares its line with something else
                indent = " " * (len(indent) - len(indent.lstrip())) or "  "
            text = "".join(f',\n{indent}{json.dumps(k)}: {json.dumps(v, ensure_ascii=False)}' for k, v in missing)
        edits.append((anchor[3], anchor[3], text))
    return edits


def apply_one(root, out_path, write, backup):
    spec = json.load(open(out_path, encoding="utf-8"))
    path = os.path.join(root, f"g{spec['grade']}", spec["dir"], "structure.json")
    raw = open(path, encoding="utf-8").read()
    data = json.loads(raw)
    expected = copy.deepcopy(data)
    tree = scan(raw)
    ch_member = member(tree, "chapters")
    assert ch_member and ch_member[4]["t"] == "a", "no chapters array"
    ch_nodes = ch_member[4]["i"]
    assert len(ch_nodes) == len(data["chapters"]), "scanner/parser chapter count mismatch"

    edits = []
    n_ch = n_les = 0
    by_slug = {c.get("slug"): i for i, c in enumerate(data["chapters"])}
    for slug, a in spec["chapters"].items():
        i = by_slug[slug]
        fields = {"concept": a["concept"], "image": a["image"]}
        edits += plan_fields(raw, ch_nodes[i], fields)
        expected["chapters"][i].update(fields)
        n_ch += 1
        overrides = a.get("lessons") or {}
        if overrides:
            les_member = member(ch_nodes[i], "lessons")
            les_nodes = les_member[4]["i"]
            les_by_slug = {l.get("slug"): j for j, l in enumerate(data["chapters"][i].get("lessons") or [])}
            for ls, lv in overrides.items():
                j = les_by_slug[ls]
                edits += plan_fields(raw, les_nodes[j], {"image": lv["image"]})
                expected["chapters"][i]["lessons"][j]["image"] = lv["image"]
                n_les += 1

    new = raw
    for s, e, text in sorted(edits, key=lambda x: (x[0], x[1]), reverse=True):
        new = new[:s] + text + new[e:]

    got = json.loads(new)
    assert got == expected, "parsed result differs from the expected data"
    for i, c in enumerate(got["chapters"]):
        if c.get("slug") in spec["chapters"]:
            keys = list(c.keys())
            assert "concept" in keys and "image" in keys
    changed = new != raw
    if write and changed:
        if backup:
            b = os.path.join(backup, f"g{spec['grade']}", spec["dir"], "structure.json")
            if not os.path.exists(b):
                os.makedirs(os.path.dirname(b), exist_ok=True)
                shutil.copy2(path, b)
        with open(path, "w", encoding="utf-8") as f:
            f.write(new)
    added = new.count("\n") - raw.count("\n")
    return path, n_ch, n_les, changed, added, len(new) - len(raw)


def main(argv):
    root = None
    backup = None
    write = False
    files = []
    i = 0
    while i < len(argv):
        a = argv[i]
        if a == "--root":
            root = argv[i + 1]; i += 2
        elif a == "--backup":
            backup = argv[i + 1]; i += 2
        elif a == "--write":
            write = True; i += 1
        else:
            files.append(a); i += 1
    assert root, "--root is required"
    tot_ch = tot_les = fails = 0
    for f in files:
        try:
            path, n_ch, n_les, changed, lines, size = apply_one(root, f, write, backup)
            tot_ch += n_ch; tot_les += n_les
            print(f"{'WROTE' if write and changed else 'same ' if not changed else 'ok   '} {os.path.relpath(path, root):38} chapters {n_ch:3}  lesson overrides {n_les:3}  +{lines} lines +{size} B")
        except Exception as e:  # noqa: BLE001 - report and continue with the next file
            fails += 1
            print(f"FAIL  {f}: {type(e).__name__}: {e}")
    print(f"\n{'applied' if write else 'dry run'}: files {len(files) - fails}/{len(files)} | chapters {tot_ch} | lesson overrides {tot_les} | failures {fails}")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
