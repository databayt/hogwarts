// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * src/lib/client-enums.ts mirrors Prisma enums for client components, so
 * they read the values without bundling Prisma's browser runtime. A drifted
 * copy would hand the server a value it rejects — pin every one.
 */
import * as Prisma from "@prisma/client"
import { describe, expect, it } from "vitest"

import * as ClientEnums from "@/lib/client-enums"

describe("client enum mirror", () => {
  for (const [name, mirror] of Object.entries(ClientEnums)) {
    it(`${name} matches the generated Prisma enum`, () => {
      expect(mirror).toEqual((Prisma as Record<string, unknown>)[name])
    })
  }
})
