// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import {
  linkable,
  MarkdownLite,
  parseBlocks,
} from "@/components/chatbot/markdown-lite"

const html = (text: string) =>
  renderToStaticMarkup(<MarkdownLite text={text} />)

describe("parseBlocks", () => {
  it("groups numbered steps, bullets and paragraphs", () => {
    expect(
      parseBlocks("Do this:\n1. Open\n2. Save\n\n- a\n- b\n## Note\nlast")
    ).toEqual([
      { kind: "p", lines: ["Do this:"] },
      { kind: "ol", start: 1, items: ["Open", "Save"] },
      { kind: "ul", items: ["a", "b"] },
      { kind: "p", lines: ["Note", "last"] },
    ])
  })

  it("keeps a list's own first number", () => {
    expect(parseBlocks("3. Third")).toEqual([
      { kind: "ol", start: 3, items: ["Third"] },
    ])
  })
})

describe("MarkdownLite", () => {
  it("bolds the guide's button names", () => {
    expect(html("Press **Save**")).toContain("<strong")
    expect(html("Press **Save**")).toContain(">Save</strong>")
  })

  it("hides a bold marker that isn't closed yet", () => {
    expect(html("Press **Sa")).not.toContain("**")
  })

  it("never renders HTML from an answer", () => {
    const out = html("<script>alert(1)</script> <b>x</b>")
    expect(out).not.toContain("<script>")
    expect(out).toContain("&lt;script&gt;")
  })

  it("links only our own hosts", () => {
    expect(html("See https://balqalam.com/en/docs/support")).toContain("<a ")
    expect(html("See https://evil.example/login")).not.toContain("<a ")
  })
})

describe("linkable", () => {
  it.each([
    ["https://balqalam.com/x", true],
    ["https://kingfahd.balqalam.com/x", true],
    ["https://cdn.databayt.org/a.png", true],
    ["https://school.example/x", false],
    ["javascript:alert(1)", false],
    ["https://balqalam.com.evil.example/", false],
  ])("%s → %s", (url, ok) => {
    expect(linkable(url, "localhost")).toBe(ok)
  })

  it("links the current host", () => {
    expect(linkable("https://demo.localhost:3000/x", "demo.localhost")).toBe(
      true
    )
  })
})
