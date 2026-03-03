// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Types
export type {
  AnswerSheetVariant,
  CompositionConfig,
  CoverVariant,
  FooterVariant,
  HeaderVariant,
  InstructionsVariant,
  SlotName,
  StudentInfoVariant,
  VariantEntry,
} from "./types"

// Defaults
export { DEFAULT_COMPOSITION } from "./defaults"

// Registry
export { VARIANT_REGISTRY } from "./registry"

// Region mapping
export { regionPresetToComposition } from "./region-mapping"

// Resolver
export { resolveComposition } from "./resolve"
