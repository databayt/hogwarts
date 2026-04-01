// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

/**
 * Visit Scheduling Validation Schemas
 */

type Messages = Record<string, string>

// Step 1: Date Selection
export function createDateStepSchema(m: Messages) {
  return z.object({
    date: z.string().min(1, m.selectDate || "Please select a date"),
  })
}

// Step 2: Time Selection
export function createTimeStepSchema(m: Messages) {
  return z.object({
    startTime: z
      .string()
      .min(1, m.selectTimeSlot || "Please select a time slot"),
    endTime: z.string().optional(),
  })
}

// Step 3: Visitor Information
export function createInfoStepSchema(m: Messages) {
  return z.object({
    visitorName: z
      .string()
      .min(2, m.nameMinLength || "Name must be at least 2 characters")
      .max(100, m.nameMaxLength || "Name must be less than 100 characters"),
    email: z
      .string()
      .email(m.invalidEmail || "Please enter a valid email address"),
    phone: z
      .string()
      .min(10, m.phoneMinLength || "Phone number must be at least 10 digits")
      .optional()
      .or(z.literal("")),
    purpose: z
      .string()
      .min(1, m.selectPurpose || "Please select a visit purpose"),
    visitors: z
      .number()
      .min(1, m.minVisitors || "At least 1 visitor required")
      .max(10, m.maxVisitors || "Maximum 10 visitors per booking"),
    notes: z
      .string()
      .max(500, m.notesMaxLength || "Notes must be less than 500 characters")
      .optional(),
  })
}

// Step 4: Confirmation (no validation, just review)
export const confirmStepSchema = z.object({})

// Combined schema for all steps
export function createVisitFormSchema(m: Messages) {
  return z.object({
    ...createDateStepSchema(m).shape,
    ...createTimeStepSchema(m).shape,
    ...createInfoStepSchema(m).shape,
  })
}

// Static defaults for config and type inference
export const dateStepSchema = createDateStepSchema({})
export const timeStepSchema = createTimeStepSchema({})
export const infoStepSchema = createInfoStepSchema({})
export const visitFormSchema = createVisitFormSchema({})

export type VisitFormData = z.infer<typeof visitFormSchema>
export type DateStepData = z.infer<typeof dateStepSchema>
export type TimeStepData = z.infer<typeof timeStepSchema>
export type InfoStepData = z.infer<typeof infoStepSchema>
