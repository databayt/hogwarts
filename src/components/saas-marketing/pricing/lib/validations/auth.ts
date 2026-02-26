// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import * as z from "zod"

export const userAuthSchema = z.object({
  email: z.string().email(),
})
