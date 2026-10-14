// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Names are split into NAMES, not words. "عبد الله" and "أبو بكر" are one
 * name written with a space; "نور الدين" binds the other way. A bare
 * whitespace split misnames real children on listings, cards and slips.
 */

import { describe, expect, it } from "vitest"

import {
  composeFullName,
  displayName,
  nameInitials,
  parseFullName,
  secondName,
  tokenizeName,
} from "@/lib/name-utils"

describe("tokenizeName", () => {
  it("keeps prefix compounds whole", () => {
    expect(tokenizeName("عبد الرحمن أبو بكر عبد الله حسن")).toEqual([
      "عبد الرحمن",
      "أبو بكر",
      "عبد الله",
      "حسن",
    ])
    expect(tokenizeName("ابو بكر محمد")).toEqual(["ابو بكر", "محمد"])
  })

  it("keeps suffix compounds whole", () => {
    expect(tokenizeName("محمد نور الدين فضل الله")).toEqual([
      "محمد",
      "نور الدين",
      "فضل الله",
    ])
    expect(tokenizeName("أحمد حسب الرسول")).toEqual(["أحمد", "حسب الرسول"])
  })

  it("leaves joined spellings and plain names alone", () => {
    expect(tokenizeName("عبدالله محمد")).toEqual(["عبدالله", "محمد"])
    expect(tokenizeName("Mohamed Ahmed Ali")).toEqual([
      "Mohamed",
      "Ahmed",
      "Ali",
    ])
  })

  it("handles Latin compounds", () => {
    expect(tokenizeName("Abdul Rahman Abu Bakr Nour Eldin")).toEqual([
      "Abdul Rahman",
      "Abu Bakr",
      "Nour Eldin",
    ])
  })

  it("normalises whitespace, tatweel and empty input", () => {
    expect(tokenizeName("  محمــد   أحمد ")).toEqual(["محمد", "أحمد"])
    expect(tokenizeName("")).toEqual([])
    expect(tokenizeName(null)).toEqual([])
  })

  it("a trailing prefix with nothing after it stays a word", () => {
    expect(tokenizeName("محمد عبد")).toEqual(["محمد", "عبد"])
  })
})

describe("parseFullName", () => {
  it("splits 1–5 part names", () => {
    expect(parseFullName("محمد")).toEqual({
      firstName: "محمد",
      middleName: undefined,
      lastName: "",
    })
    expect(parseFullName("محمد حسن")).toEqual({
      firstName: "محمد",
      middleName: undefined,
      lastName: "حسن",
    })
    expect(parseFullName("محمد أحمد علي حسن")).toEqual({
      firstName: "محمد",
      middleName: "أحمد علي",
      lastName: "حسن",
    })
    expect(parseFullName("محمد أحمد علي عمر حسن").middleName).toBe(
      "أحمد علي عمر"
    )
  })

  it("never cuts a compound across fields", () => {
    expect(parseFullName("عبد الرحمن أبو بكر عبد الله")).toEqual({
      firstName: "عبد الرحمن",
      middleName: "أبو بكر",
      lastName: "عبد الله",
    })
  })
})

describe("displayName", () => {
  const p = { firstName: "محمد", middleName: "أحمد علي", lastName: "حسن" }

  it("first-second shows the father's name", () => {
    expect(displayName(p, "first-second")).toBe("محمد أحمد")
  })

  it("first-last shows the family name", () => {
    expect(displayName(p, "first-last")).toBe("محمد حسن")
  })

  it("full shows every part", () => {
    expect(displayName(p, "full")).toBe("محمد أحمد علي حسن")
  })

  it("compound second names stay whole", () => {
    expect(
      displayName(
        {
          firstName: "عبد الرحمن",
          middleName: "أبو بكر عبد الله",
          lastName: "حسن",
        },
        "first-second"
      )
    ).toBe("عبد الرحمن أبو بكر")
  })

  it("falls back to the last name when there is no middle", () => {
    expect(
      displayName({ firstName: "Sara", lastName: "Hassan" }, "first-second")
    ).toBe("Sara Hassan")
  })

  it("reads legacy rows whose lastName holds the whole tail", () => {
    const legacy = { firstName: "محمد", lastName: "أحمد علي حسن" }
    expect(displayName(legacy, "first-second")).toBe("محمد أحمد")
    expect(displayName(legacy, "first-last")).toBe("محمد حسن")
  })
})

describe("secondName / initials / compose", () => {
  it("secondName takes the first middle name", () => {
    expect(secondName({ middleName: "نور الدين علي" })).toBe("نور الدين")
  })

  it("initials come from names, not words", () => {
    expect(
      nameInitials({ firstName: "عبد الله", lastName: "حسن" }, "first-last")
    ).toBe("عح")
    expect(
      nameInitials({ firstName: "sara", lastName: "hassan" }, "first-last")
    ).toBe("SH")
  })

  it("composeFullName drops empties and extra spaces", () => {
    expect(composeFullName(" محمد ", null, "حسن")).toBe("محمد حسن")
  })
})
