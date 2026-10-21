// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The answer's first line names its guide — `[[guide:attendance]]` — or,
 * when the question could mean two or three, `[[choose:fees,finance]]`. The
 * model decides answer-first which guide it is using, the cards render the
 * moment that line arrives, and the visitor never sees the tag. Read off
 * the stream as it comes: a tag split across pieces is still one tag, an
 * unknown slug is dropped, and an answer without a tag is just text.
 */
export type TagEvent =
  | { kind: "guide"; slug: string }
  | { kind: "choose"; slugs: string[] }
  | { kind: "text"; text: string }

/** Longer than this without closing, the "tag" is text that began with "[[". */
const MAX_TAG = 160

export function guideTagParser(valid: ReadonlySet<string>) {
  let head = ""
  let decided = false

  const close = (tag: string, rest: string): TagEvent[] => {
    decided = true
    head = ""
    const out: TagEvent[] = []
    const m = tag.match(/^\s*(guide|choose)\s*:\s*([^\]]*)$/)
    if (m) {
      const slugs = m[2]!
        .split(",")
        .map((s) => s.trim())
        .filter((s) => valid.has(s))
      if (m[1] === "guide" && slugs[0]) out.push({ kind: "guide", slug: slugs[0] })
      if (m[1] === "choose" && slugs.length >= 2)
        out.push({ kind: "choose", slugs: slugs.slice(0, 3) })
    }
    const text = rest.replace(/^[ \t]*\r?\n/, "")
    if (text) out.push({ kind: "text", text })
    return out
  }

  return {
    feed(chunk: string): TagEvent[] {
      if (decided) return chunk ? [{ kind: "text", text: chunk }] : []
      head += chunk
      const start = head.trimStart()
      if (!start) return []
      if (!start.startsWith("[[")) {
        // "[" alone might still become "[[" with the next piece.
        if (start === "[") return []
        decided = true
        const text = head
        head = ""
        return [{ kind: "text", text: text.trimStart() }]
      }
      const end = start.indexOf("]]")
      if (end === -1) {
        if (start.length <= MAX_TAG) return []
        decided = true
        const text = head
        head = ""
        return [{ kind: "text", text: text.trimStart() }]
      }
      return close(start.slice(2, end), start.slice(end + 2))
    },
    /** The stream ended while a tag was still open: whatever it was, show it. */
    flush(): TagEvent[] {
      if (decided || !head.trim()) return []
      decided = true
      const text = head.trimStart()
      head = ""
      return /^\[\[(guide|choose)\s*:/.test(text) ? [] : [{ kind: "text", text }]
    },
  }
}
