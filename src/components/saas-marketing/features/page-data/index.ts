// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { FeaturePageData } from "../types"
import { advancePageData } from "./advance"
import { aiPageData } from "./ai"
import { communicationPageData } from "./communication"
import { corePageData } from "./core"
import { erpPageData } from "./erp"
import { essentialPageData } from "./essential"
import { integrationPageData } from "./integration"
import { lmsPageData } from "./lms"
import { managementPageData } from "./management"
import { technicalPageData } from "./technical"

export const FEATURE_PAGE_DATA: Record<string, FeaturePageData> = {
  ...corePageData,
  ...essentialPageData,
  ...advancePageData,
  ...erpPageData,
  ...managementPageData,
  ...communicationPageData,
  ...lmsPageData,
  ...technicalPageData,
  ...integrationPageData,
  ...aiPageData,
}
