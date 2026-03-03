// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { CompositionConfig } from "./types"

/** Default composition — backwards compatible with the original Classic template */
export const DEFAULT_COMPOSITION: CompositionConfig = {
  slots: {
    header: "standard",
    footer: "standard",
    studentInfo: "standard",
    instructions: "standard",
    answerSheet: "standard",
    cover: "standard",
  },
  decorations: {
    accentBar: { enabled: false },
    watermark: { enabled: false },
    frame: { enabled: false },
  },
  slotProps: {},
}
