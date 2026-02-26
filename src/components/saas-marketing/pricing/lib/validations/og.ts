// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import * as z from "zod"

export const ogImageSchema = z.object({
  heading: z.string(),
  type: z.string(),
  mode: z.enum(["light", "dark"]).default("dark"),
})
