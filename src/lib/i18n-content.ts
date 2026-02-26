// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Active utilities
export type { ContentWithLang } from "@/components/translation/types"
export {
  detectLanguage,
  getContentLang,
  getContentPreview,
  getContentText,
  hasContent,
  needsTranslation,
} from "@/components/translation/util"

// Legacy deprecated helpers
export type {
  BilingualFormData,
  BilingualText,
  PartialBilingualText,
} from "@/components/translation/legacy"
export {
  convertToBilingual,
  createBilingualText,
  extractBilingual,
  getBilingualPreview,
  getBilingualStatus,
  getLocalizedFromJSON,
  getLocalizedFromObject,
  getLocalizedText,
  hasBilingualContent,
  isFullyBilingual,
  spreadBilingual,
} from "@/components/translation/legacy"
