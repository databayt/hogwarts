# Dashboard Cards Lab

This is a comprehensive showcase of all 32 dashboard card components available in the atomic design system.

## Location

- **Route**: `/[lang]/s/[subdomain]/lab`
- **Component**: `src/components/platform/lab/dashboard-cards-showcase.tsx`

## Card Categories

### Enhanced Cards (5 cards)

Original cards with size, loading, and onClick features:

- `StatCard` - Display metrics with icons and trends
- `ProgressCard` - Show completion percentages
- `ListCard` - Display lists of items
- `MultiStatCard` - Multiple stats in one card
- `ChartCard` - Simple chart visualizations

### New Variants (7 cards)

Specialized card types:

- `HeroStatCard` - Large hero-style stat display
- `ActionCard` - Call-to-action card with button
- `ComparisonCard` - Compare multiple metrics
- `MediaCard` - Card with media/image content
- `CollapsibleCard` - Expandable/collapsible content
- `EmptyStateCard` - Empty state with illustration
- `SkeletonCard` - Loading skeleton states

### Modern 2025 Patterns (12 cards)

Interactive and engaging designs:

- `FlipCard` - 3D flip animation (front/back)
- `MetricCard` - Metric with sparkline chart
- `NotificationCard` - Alert/notification display
- `TimelineCard` - Timeline entry with icon
- `ProfileCard` - User profile with avatar
- `GoalCard` - Goal tracking with progress
- `WeatherCard` - Weather/status information
- `CalendarCard` - Calendar event preview
- `QuickActionCard` - Grid of quick actions
- `SocialCard` - Social engagement metrics
- `GlanceCard` - Minimal quick-glance info
- `IconStatCard` - Icon-focused stat card

### shadcn Dashboard Patterns (8 cards)

Advanced dashboard patterns:

- `RecentSalesCard` - Recent transactions list
- `ActivityFeedCard` - Activity timeline feed
- `TeamMembersCard` - Team member avatars
- `TopPerformersCard` - Leaderboard display
- `TaskListCard` - Task checklist with progress
- `DataTableCard` - Mini data table view
- `StackedStatCard` - Stacked statistics
- `BannerCard` - Prominent announcement banner

## Layout Components

The showcase also demonstrates the layout components:

- `DashboardShell` - Main dashboard wrapper
- `DashboardSection` - Section with title/description
- `DashboardGrid` - Responsive grid layout

## Features Demonstrated

1. **Responsive Layouts** - All cards adapt to different screen sizes
2. **Interactive States** - Hover effects, click handlers
3. **Loading States** - Skeleton loaders for each card type
4. **Variants** - Different color schemes (primary, success, warning, danger)
5. **Sizes** - Multiple size options (sm, md, lg, xl)
6. **Icons** - Lucide React icons integration
7. **Trends** - Trend indicators with up/down arrows
8. **Real Data Simulation** - Realistic sample data for each card

## Usage Example

```tsx
import { StatCard } from "@/components/atom/lab"

;<StatCard
  value="2,543"
  label="Total Students"
  icon={<Users className="size-4" />}
  trend={{ value: 12.5, direction: "up" }}
  variant="primary"
/>
```

## Next Steps

Use this lab page as a reference when building your own dashboards. Copy the card implementations and customize the data, icons, and styling to match your needs.

All cards follow semantic token theming for consistent appearance across light/dark modes and support Arabic RTL layout.
