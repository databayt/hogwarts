// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import { getEventsSchema } from "./validation"

export const eventsSearchParams = z.object({
  page: z.coerce.number().default(1),
  perPage: z.coerce.number().default(20),
  title: z.string().optional(),
  eventType: z.string().optional(),
  status: z.string().optional(),
  eventDate: z.string().optional(),
  location: z.string().optional(),
  sort: z
    .array(z.object({ id: z.string(), desc: z.coerce.boolean() }))
    .optional(),
})

export type EventsSearchParams = z.infer<typeof eventsSearchParams>
