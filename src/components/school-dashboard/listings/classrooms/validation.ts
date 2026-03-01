// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const classroomBaseSchema = z.object({
  roomName: z.string().min(1, "Room name is required"),
  typeId: z.string().min(1, "Room type is required"),
  capacity: z.number().int().min(1, "Capacity must be at least 1"),
  gradeId: z.string().optional(),
})

export const classroomCreateSchema = classroomBaseSchema

export const classroomUpdateSchema = classroomBaseSchema.partial().extend({
  id: z.string().min(1, "Required"),
})

export const getClassroomsSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(200).default(20),
  name: z.string().optional().default(""),
  typeId: z.string().optional().default(""),
  building: z.string().optional().default(""),
})
