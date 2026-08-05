// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Per-feature showcase decks (zenda Services–style sticky cards with real
// product screenshots), keyed by feature id and merged per group. A feature
// without an entry simply renders no showcase section.

import type { ShowcaseData } from "../../types"
import { academicsShowcase } from "./academics"
import { communicationShowcase } from "./communication"
import { financeShowcase } from "./finance"
import { insightsShowcase } from "./insights"
import { learningShowcase } from "./learning"
import { operationsShowcase } from "./operations"

export const FEATURE_SHOWCASE: Record<string, ShowcaseData> = {
  ...academicsShowcase,
  ...learningShowcase,
  ...financeShowcase,
  ...communicationShowcase,
  ...operationsShowcase,
  ...insightsShowcase,
}
