// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Guards the server/client dictionary shape contract.
 *
 * Both loaders derive from the shared registry (namespaces.ts), but this
 * test is the tripwire if anyone reintroduces a separate namespace list:
 * the client merge must expose exactly the keys the server merge does —
 * the `Dictionary` type is inferred from the server, so a missing client
 * namespace is a silent runtime `undefined` (this happened with
 * `compliance` and `liveClasses`).
 */
import { describe, expect, it } from "vitest"

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getDictionaryClient } from "@/components/internationalization/get-dictionary-client"
import { FEATURE_NAMESPACE_KEYS } from "@/components/internationalization/namespaces"

describe("dictionary loader sync (server vs client)", () => {
  for (const locale of ["en", "ar"] as Locale[]) {
    it(`client merge exposes exactly the server keys (${locale})`, async () => {
      const server = await getDictionary(locale)
      const client = await getDictionaryClient(locale)

      const serverKeys = Object.keys(server).sort()
      const clientKeys = Object.keys(client).sort()

      expect(clientKeys).toEqual(serverKeys)
    })

    it(`every registered feature namespace is present and non-empty (${locale})`, async () => {
      const server = await getDictionary(locale)
      const asRecord = server as Record<string, unknown>

      for (const key of FEATURE_NAMESPACE_KEYS) {
        expect(asRecord[key], `namespace "${key}" missing`).toBeDefined()
        expect(
          Object.keys(asRecord[key] as Record<string, unknown>).length,
          `namespace "${key}" is empty`
        ).toBeGreaterThan(0)
      }
    })
  }
})
