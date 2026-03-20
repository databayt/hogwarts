## Dashboard — Role-Based Home Pages

### Overview

The dashboard sub-block provides personalized landing pages for each user role with relevant widgets, quick actions, and key metrics. It renders role-specific views for Admin, Teacher, Student, Parent, Accountant, Staff, and Principal, each pulling real data from the database via server actions.

### Capabilities by Role

- **Admin**: School-wide statistics, enrollment trends, pending tasks, quick actions (create class, add student)
- **Principal**: Complete school overview with financial tracking, emergency alerts, compliance status
- **Teacher**: Today's schedule, assignments needing grading, class performance summary, student attendance
- **Student**: Today's timetable, upcoming assignments, recent grades, announcements
- **Parent**: Children overview, child's grades, attendance summary, school announcements
- **Accountant**: Financial overview, invoice history, revenue charts, payment tracking
- **Staff**: Resource usage, quick-look metrics, upcoming events

### Routes

| Route                                                         | Page                | Status |
| ------------------------------------------------------------- | ------------------- | ------ |
| `/{lang}/s/{subdomain}/(school-dashboard)/dashboard`          | Role-based redirect | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/dashboard/settings` | Dashboard settings  | Ready  |

### File Structure

```
src/components/school-dashboard/dashboard/
+-- content.tsx                  # Server component - role router
+-- actions.ts                   # Server actions for data fetching
+-- weather-actions.ts           # Weather data actions
+-- types.ts                     # TypeScript type definitions
+-- validation.ts                # Zod schemas
+-- config.ts                    # Dashboard configuration
+-- quick-actions-config.ts      # Quick action button config
+-- loading.tsx                  # Skeleton loader
+-- error-boundary.tsx           # Error fallback UI
+-- client.tsx                   # Client-side wrapper
+-- admin-client.tsx             # Admin dashboard client component
+-- admin.tsx                    # Admin dashboard view
+-- principal.tsx                # Principal dashboard view
+-- teacher.tsx                  # Teacher dashboard view
+-- student.tsx                  # Student dashboard view
+-- parent.tsx                   # Parent dashboard view
+-- accountant.tsx               # Accountant dashboard view
+-- staff.tsx                    # Staff dashboard view
+-- header.tsx                   # Dashboard header
+-- welcome-banner.tsx           # Welcome message
+-- notification-service.tsx     # Real-time notifications
+-- empty-state.tsx              # No-data fallback
+-- section-heading.tsx          # Section title component
+-- section-columns.tsx          # Column layout
+-- stat-*.tsx                   # Stat card variants (15+ variants)
+-- card-*.tsx                   # Card components (10+ variants)
+-- chart-*.tsx                  # Chart components (10+ variants)
+-- quick-actions.tsx            # Quick action buttons
+-- quick-action.tsx             # Single quick action
+-- quick-look-section.tsx       # Quick-look metrics
+-- quick-look-section-server.tsx # Server-side quick-look
+-- financial-overview-section.tsx # Finance section
+-- invoice-history-section.tsx  # Invoice list
+-- resource-usage-section.tsx   # Resource tracking
+-- revenue-chart.tsx            # Revenue visualization
+-- comparison-chart.tsx         # Period comparison
+-- attendance-chart.tsx         # Attendance visualization
+-- grade-chart.tsx              # Grade distribution
+-- weekly-chart.tsx             # Weekly trends
+-- weather.tsx                  # Weather widget
+-- upcoming.tsx                 # Upcoming events
+-- top-section.tsx              # Top metrics row
+-- schedule-item.tsx            # Schedule entry
+-- announcement-card.tsx        # Announcement widget
+-- info-card.tsx                # Info display
+-- metric-card.tsx              # Metric display
+-- progress-card.tsx            # Progress indicator
+-- performance-gauge.tsx        # Performance meter
+-- activity-rings.tsx           # Activity visualization
+-- transactions-list.tsx        # Transaction feed
+-- upgrade-card.tsx             # Plan upgrade prompt
+-- dashboard-showcase.tsx       # Feature showcase
+-- chart-showcase.tsx           # Chart gallery
+-- card-showcase.tsx            # Card gallery
```

### Status

**Completion:** 85% | **Blockers:** None

All 7 role-specific views are implemented. Principal, Teacher, Student, and Parent dashboards use real database queries. Admin dashboard has partial real data. Accountant and Staff dashboards are functional with real data integration in progress. The block includes 97 component files covering stat cards, charts, quick actions, and section layouts.

### Integration Points

- [Attendance](../attendance/README.md) -- Attendance charts and stats
- [Exams](../exams/) -- Grade distribution and results
- [Listings](../listings/) -- Student/teacher counts and quick stats
- [Finance](../finance/) -- Revenue charts, invoice history
- [Timetable](../timetable/README.md) -- Today's schedule widget
- [Notifications](../notifications/README.md) -- Alert system integration
