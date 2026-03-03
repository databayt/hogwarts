// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Import presets to trigger self-registration
import "./mena-private"
import "./sa-national"
import "./sd-national"
import "./us-standard"

export type { CertRegionPreset } from "./types"
export {
  getAllCertPresetIds,
  getCertRegionPreset,
  registerCertPreset,
} from "./types"
