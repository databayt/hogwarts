// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
"use client"

import { useContext } from "react"

import {
  isNameDisplay,
  NAME_DISPLAY_DEFAULT,
  type NameDisplay,
} from "@/lib/name-utils"

import { SchoolContext } from "./school-context"

/**
 * The school's name display (first + second or first + last) for client
 * components. Outside a SchoolProvider it falls back to the default instead
 * of throwing, so shared components stay usable anywhere.
 */
export function useNameDisplay(): NameDisplay {
  const value = useContext(SchoolContext)?.school?.nameDisplay
  return isNameDisplay(value) ? value : NAME_DISPLAY_DEFAULT
}
