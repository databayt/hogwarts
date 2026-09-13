// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Shared school-dashboard components
export { ExportButton, type ExportFormat } from "./export-button"
export { ViewToggle, ViewToggleSegmented } from "./view-toggle"
export { GridCard, GridContainer, GridEmptyState } from "./grid-card"
export { PlatformToolbar } from "./platform-toolbar"

// The phone pattern — the vocabulary of /dashboard, /library, /lumos and /live
// on a phone, for sections that follow it. See README "Phone pattern".
export {
  AppTile,
  AppTileGrid,
  DateTile,
  TileFace,
  type AppTileItem,
  type TileArt,
  type TileTint,
} from "./app-tile"
export { SectionHeader } from "./section-header"
export { StatPanel, type StatItem, type StatTone } from "./stat-panel"
export { ListRow, ListRows } from "./list-row"
export { InfoRows, type InfoRow } from "./info-rows"
export { ItemCard, ItemGrid, ItemGridMore } from "./item-card"
export { ListingViews } from "./listing-views"
export { RowActions, TableGrid } from "./table-grid"
export {
  BrandBanner,
  BrandPill,
  BrandProgress,
  brandPillClass,
} from "./brand-banner"
export {
  ProcessingStatusBadge,
  type ProcessingStatus,
  type ProcessingStatusBadgeProps,
} from "./processing-status-badge"
export {
  ConfidenceScoreDisplay,
  type ConfidenceScoreDisplayProps,
  type ConfidenceLevel,
} from "./confidence-score-display"
export {
  ProcessingProgressCard,
  type ProcessingProgressCardProps,
} from "./processing-progress-card"
export {
  AIBudgetIndicator,
  type AIBudgetIndicatorProps,
} from "./ai-budget-indicator"
