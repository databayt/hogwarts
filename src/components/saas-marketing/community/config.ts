// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Default per-resource result cap used by `queries.ts` list helpers.
 * Phase 1's `RESOURCE_TYPES` registry was removed when the [type] drill-down
 * routes were dropped — the per-subject detail page renders all resources
 * inline via the school-dashboard `CatalogContentSections`.
 */
export const DEFAULT_RESOURCE_LIMIT = 24
