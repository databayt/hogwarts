// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import { renderTemplate } from "../render-template"

describe("renderTemplate", () => {
  it("substitutes {{var}} placeholders from metadata", () => {
    expect(
      renderTemplate("{{studentName}} received {{grade}} in {{subject}}", {
        studentName: "Ali",
        grade: "A",
        subject: "Math",
      })
    ).toBe("Ali received A in Math")
  })

  it("tolerates whitespace inside braces", () => {
    expect(renderTemplate("Hello {{ name }}!", { name: "Sara" })).toBe(
      "Hello Sara!"
    )
  })

  it("leaves unknown placeholders untouched so QA notices the gap", () => {
    // Silent ""-substitution would produce "{studentName} received  ."
    // which is impossible to spot during a translation review. We keep the
    // braces so the missing key surfaces in the rendered output.
    expect(
      renderTemplate("{{studentName}} got {{grade}}", { studentName: "Sara" })
    ).toBe("Sara got {{grade}}")
  })

  it("treats null/undefined metadata values the same as missing", () => {
    expect(renderTemplate("{{a}} + {{b}}", { a: null, b: undefined })).toBe(
      "{{a}} + {{b}}"
    )
  })

  it("returns the template unchanged when metadata is omitted", () => {
    expect(renderTemplate("static text")).toBe("static text")
    expect(renderTemplate("with {{var}}")).toBe("with {{var}}")
  })

  it("coerces numeric and boolean values to strings", () => {
    expect(
      renderTemplate("{{count}} items, in stock: {{inStock}}", {
        count: 7,
        inStock: true,
      })
    ).toBe("7 items, in stock: true")
  })

  it("preserves text that looks like braces but isn't a placeholder", () => {
    expect(renderTemplate("price = {amount}")).toBe("price = {amount}")
    expect(renderTemplate("CSS: {{ 1 + 1 }}")).toBe("CSS: {{ 1 + 1 }}")
  })

  it("does not recursively resolve metadata values that contain placeholders", () => {
    // If a template variable itself contains "{{x}}", we don't re-render it.
    // Keeps the renderer predictable and safe from accidental infinite loops.
    expect(renderTemplate("Body: {{content}}", { content: "{{title}}" })).toBe(
      "Body: {{title}}"
    )
  })
})
