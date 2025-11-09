/**
 * Dashboard Atomic Components
 *
 * A collection of reusable atomic components for building lab UIs.
 * Components follow a five-level hierarchy:
 * 1. Base Atoms - Smallest reusable units (8 components)
 * 2. Composite Atoms - Combine 2-3 base atoms (4 components)
 * 3. Card Templates - Complete card components (32 total)
 * 4. Layout Components - Grid and section wrappers (3 components)
 * 5. shadcn/ui v4 Components - Official showcase components (21 components)
 *
 * All components use 100% semantic tokens for theming.
 *
 * @version 5.0.0 - Flattened structure + shadcn/ui v4 components (68 total)
 */

// ============================================================================
// Types
// ============================================================================
export type {
  BaseVariant,
  ComponentSize,
  CardSize,
  TrendDirection,
  Orientation,
  LayoutVariant,
  ChartType,
  SkeletonLayout,
  TrendData,
  StatData,
  ListItemData,
  ComparisonMetric,
  MediaCardData,
  BaseComponentProps,
  EnhancedCardProps,
  GridBreakpoints,
} from "./types"

// ============================================================================
// Base Atoms
// ============================================================================
export { StatValue } from "./stat-value"
export { StatLabel } from "./stat-label"
export { TrendBadge } from "./trend-badge"
export { IconWrapper } from "./icon-wrapper"
export { ProgressBar } from "./progress-bar"
export { Sparkline } from "./sparkline"
export { MetricChip } from "./metric-chip"
export { Divider } from "./divider"

// ============================================================================
// Composite Atoms
// ============================================================================
export { StatGroup } from "./stat-group"
export { IconStat } from "./icon-stat"
export { ProgressStat } from "./progress-stat"
export { ListItem } from "./list-item"

// ============================================================================
// Card Templates (Enhanced) - 5 original cards with size/loading/onClick
// ============================================================================
export { StatCard } from "./stat-card"
export { ProgressCard } from "./progress-card"
export { ListCard } from "./list-card"
export { MultiStatCard } from "./multi-stat-card"
export { ChartCard } from "./chart-card"

// ============================================================================
// Card Templates (New Variants) - 7 new specialized cards
// ============================================================================
export { HeroStatCard } from "./hero-stat-card"
export { ActionCard } from "./action-card"
export { ComparisonCard } from "./comparison-card"
export { MediaCard } from "./media-card"
export { CollapsibleCard } from "./collapsible-card"
export { EmptyStateCard } from "./empty-state-card"
export { SkeletonCard } from "./skeleton-card"

// ============================================================================
// Card Templates (Phase 2: Modern 2025 Patterns) - 12 interactive cards
// ============================================================================
export { FlipCard } from "./flip-card"
export { MetricCard } from "./metric-card"
export { NotificationCard } from "./notification-card"
export { TimelineCard } from "./timeline-card"
export { ProfileCard } from "./profile-card"
export { GoalCard } from "./goal-card"
export { WeatherCard } from "./weather-card"
export { CalendarCard } from "./calendar-card"
export { QuickActionCard } from "./quick-action-card"
export { SocialCard } from "./social-card"
export { GlanceCard } from "./glance-card"
export { IconStatCard } from "./icon-stat-card"

// ============================================================================
// Card Templates (Phase 3: shadcn Dashboard Patterns) - 8 advanced cards
// ============================================================================
export { RecentSalesCard } from "./recent-sales-card"
export { ActivityFeedCard } from "./activity-feed-card"
export { TeamMembersCard } from "./team-members-card"
export { TopPerformersCard } from "./top-performers-card"
export { TaskListCard } from "./task-list-card"
export { DataTableCard } from "./data-table-card"
export { StackedStatCard } from "./stacked-stat-card"
export { BannerCard } from "./banner-card"

// ============================================================================
// Layout Components - 3 new grid/section wrappers
// ============================================================================
export { DashboardGrid } from "./dashboard-grid"
export { DashboardSection } from "./dashboard-section"
export { DashboardShell } from "./dashboard-shell"

// ============================================================================
// shadcn/ui v4 Showcase Components - 21 components from official repository
// ============================================================================

// Field Components (5)
export { ShadcnFieldDemo } from "./shadcn-field-demo"
export { ShadcnFieldCheckbox } from "./shadcn-field-checkbox"
export { ShadcnFieldChoiceCard } from "./shadcn-field-choice-card"
export { ShadcnFieldSlider } from "./shadcn-field-slider"
export { ShadcnFieldHear } from "./shadcn-field-hear"

// Input Groups (4)
export { ShadcnInputGroupDemo } from "./shadcn-input-group-demo"
export { ShadcnInputGroupButton } from "./shadcn-input-group-button"
export { ShadcnInputGroupTextarea } from "./shadcn-input-group-textarea"
export { ShadcnEmptyInputGroup } from "./shadcn-empty-input-group"

// Button Groups (4)
export { ShadcnButtonGroupDemo } from "./shadcn-button-group-demo"
export { ShadcnButtonGroupInputGroup } from "./shadcn-button-group-input-group"
export { ShadcnButtonGroupNested } from "./shadcn-button-group-nested"
export { ShadcnButtonGroupPopover } from "./shadcn-button-group-popover"

// Display Components (3)
export { ShadcnItemDemo } from "./shadcn-item-demo"
export { ShadcnItemAvatar } from "./shadcn-item-avatar"
export { ShadcnEmptyAvatarGroup } from "./shadcn-empty-avatar-group"

// Feedback Components (2)
export { ShadcnSpinnerBadge } from "./shadcn-spinner-badge"
export { ShadcnSpinnerEmpty } from "./shadcn-spinner-empty"

// Settings Components (1)
export { ShadcnAppearanceSettings } from "./shadcn-appearance-settings"

// Forms (1)
export { ShadcnNotionPromptForm } from "./shadcn-notion-prompt-form"

// shadcn Showcase
export { ShadcnShowcase } from "./shadcn-showcase"
