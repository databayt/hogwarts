// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Personal Step Validation

import { z } from "zod"

import type { NameFormat } from "@/lib/name-utils"
import type { ValidationHelper } from "@/components/internationalization/helpers"

import { FORM_LIMITS } from "../config.client"

function getNonNameFields(v: ValidationHelper) {
  return {
    dateOfBirth: z.string().optional().or(z.literal("")),
    gender: z.enum(["MALE", "FEMALE"]).optional(),
    nationality: z.string().optional().or(z.literal("")),
    religion: z.string().optional().or(z.literal("")),
    category: z.string().optional().or(z.literal("")),
    phone: z
      .string()
      .min(
        FORM_LIMITS.PHONE_MIN_LENGTH,
        v.minLength(FORM_LIMITS.PHONE_MIN_LENGTH)
      )
      .max(
        FORM_LIMITS.PHONE_MAX_LENGTH,
        v.maxLength(FORM_LIMITS.PHONE_MAX_LENGTH)
      ),
    whatsapp: z
      .string()
      .max(
        FORM_LIMITS.PHONE_MAX_LENGTH,
        v.maxLength(FORM_LIMITS.PHONE_MAX_LENGTH)
      )
      .optional()
      .or(z.literal("")),
  }
}

export function createPersonalSchema(v: ValidationHelper) {
  return z.object({
    firstName: z
      .string()
      .min(
        FORM_LIMITS.NAME_MIN_LENGTH,
        v.minLength(FORM_LIMITS.NAME_MIN_LENGTH)
      )
      .max(
        FORM_LIMITS.NAME_MAX_LENGTH,
        v.maxLength(FORM_LIMITS.NAME_MAX_LENGTH)
      )
      .trim(),
    middleName: z
      .string()
      .max(
        FORM_LIMITS.NAME_MAX_LENGTH,
        v.maxLength(FORM_LIMITS.NAME_MAX_LENGTH)
      )
      .trim()
      .optional()
      .or(z.literal("")),
    lastName: z
      .string()
      .min(
        FORM_LIMITS.NAME_MIN_LENGTH,
        v.minLength(FORM_LIMITS.NAME_MIN_LENGTH)
      )
      .max(
        FORM_LIMITS.NAME_MAX_LENGTH,
        v.maxLength(FORM_LIMITS.NAME_MAX_LENGTH)
      )
      .trim(),
    ...getNonNameFields(v),
  })
}

export function getPersonalSchema(
  nameFormat: NameFormat = "full",
  v?: ValidationHelper
) {
  // Fallback for cases where ValidationHelper is not available
  const fallbackV = {
    required: () => "Required",
    minLength: (min: number) => `Min ${min} characters`,
    maxLength: (max: number) => `Max ${max} characters`,
  } as ValidationHelper

  const val = v || fallbackV

  if (nameFormat === "full") {
    return z.object({
      _fullName: z
        .string()
        .min(
          FORM_LIMITS.NAME_MIN_LENGTH,
          val.minLength(FORM_LIMITS.NAME_MIN_LENGTH)
        )
        .max(200, val.maxLength(200))
        .trim(),
      firstName: z.string().default("").or(z.literal("")),
      middleName: z.string().optional().or(z.literal("")),
      lastName: z.string().default("").or(z.literal("")),
      ...getNonNameFields(val),
    })
  }
  return createPersonalSchema(val)
}

export type PersonalSchemaType = z.infer<
  ReturnType<typeof createPersonalSchema>
>

/**
 * Completion gate for the Next button — mirrors the REQUIRED constraints of
 * the real schema (name min-length + phone length window) without running
 * Zod, so the gate can never be looser than the form.trigger() call inside
 * saveAndNext(). Optional-field constraints (formats, max lengths) still
 * surface via the form's inline errors when saveAndNext runs.
 */
export function isPersonalStepComplete(
  data: { firstName?: string; lastName?: string; phone?: string } | undefined,
  nameFormat: NameFormat = "full"
): boolean {
  if (!data) return false
  const first = data.firstName ?? ""
  const last = data.lastName ?? ""
  // "full" format validates one combined name input (_fullName, stripped
  // before it reaches step data) — approximate with the combined split parts.
  const nameOk =
    nameFormat === "full"
      ? (first + last).trim().length >= FORM_LIMITS.NAME_MIN_LENGTH
      : first.length >= FORM_LIMITS.NAME_MIN_LENGTH &&
        last.length >= FORM_LIMITS.NAME_MIN_LENGTH
  const phoneLength = (data.phone ?? "").length
  return (
    nameOk &&
    phoneLength >= FORM_LIMITS.PHONE_MIN_LENGTH &&
    phoneLength <= FORM_LIMITS.PHONE_MAX_LENGTH
  )
}
