// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const importSchema = z.object({
  dataSource: z
    .enum(["manual", "csv", "existing-system"])
    .describe("Please select a data source"),
  includeStudents: z.boolean(),
  includeTeachers: z.boolean(),
  includeParents: z.boolean(),
  csvFile: z.string().optional(),
})

export type ImportFormData = z.infer<typeof importSchema>
