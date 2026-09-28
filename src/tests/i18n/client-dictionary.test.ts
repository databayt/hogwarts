// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The static client dictionaries (client/ar.ts, client/en.ts) must be the
 * server's `getDictionary` exactly. LocaleDictionaryProvider serves them to
 * every dashboard client component in place of the serialized prop, so a
 * namespace missing from the generated files is a silent `undefined` in the
 * UI — and a stale copy renders an old string. Regenerate the two files from
 * namespaces.ts when this fails.
 */
import { describe, expect, it } from "vitest"

import { dictionary as clientAr } from "@/components/internationalization/client/ar"
import { dictionary as clientEn } from "@/components/internationalization/client/en"
import { getDictionary } from "@/components/internationalization/dictionaries"

describe("static client dictionaries", () => {
  it("Arabic equals the server merge", async () => {
    expect(clientAr).toEqual(await getDictionary("ar"))
  })

  it("English equals the server merge", async () => {
    expect(clientEn).toEqual(await getDictionary("en"))
  })
})
