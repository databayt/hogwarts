// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
] as const

export const EMPLOYMENT_STATUS_OPTIONS = [
  { label: "Active", value: "ACTIVE" },
  { label: "On Leave", value: "ON_LEAVE" },
  { label: "Terminated", value: "TERMINATED" },
  { label: "Retired", value: "RETIRED" },
] as const

export const EMPLOYMENT_TYPE_OPTIONS = [
  { label: "Full-Time", value: "FULL_TIME" },
  { label: "Part-Time", value: "PART_TIME" },
  { label: "Contract", value: "CONTRACT" },
  { label: "Substitute", value: "SUBSTITUTE" },
] as const

export const QUALIFICATION_TYPE_OPTIONS = [
  { label: "Degree", value: "DEGREE" },
  { label: "Certification", value: "CERTIFICATION" },
  { label: "License", value: "LICENSE" },
] as const

export const EXPERTISE_LEVEL_OPTIONS = [
  { label: "Primary (Main Subject)", value: "PRIMARY" },
  { label: "Secondary (Can Teach)", value: "SECONDARY" },
  { label: "Certified", value: "CERTIFIED" },
] as const

export const CLASS_TEACHER_ROLE_OPTIONS = [
  { label: "Primary Teacher", value: "PRIMARY" },
  { label: "Co-Teacher", value: "CO_TEACHER" },
  { label: "Assistant", value: "ASSISTANT" },
] as const
