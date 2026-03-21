"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import {
  translateFields as _translateFields,
  translateText as _translateText,
  translateWithCache as _translateWithCache,
} from "@/components/translation/actions"

export const translateFields = _translateFields
export const translateText = _translateText
export const translateWithCache = _translateWithCache
