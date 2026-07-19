# Dashboard — Production Readiness Tracker

**Status:** :yellow_circle: IN PROGRESS
**Completion:** 85%
**Last Updated:** 2026-03-19

---

## MVP Checklist

- [x] Role-based views (7 roles: admin, principal, teacher, student, parent, accountant, staff)
- [x] Quick stats cards with real data
- [x] Pending tasks widget
- [x] Recent activity feed
- [x] Real data queries for Teacher dashboard
- [x] Real data queries for Student dashboard
- [x] Real data queries for Parent dashboard
- [ ] Principal dashboard real data — **claim corrected 2026-07-19: budget (`allocated=2500000` hardcoded), parent-satisfaction scores, board meetings, disciplinary `incidentRate`, and staff-evaluation due dates are fabricated constants** (`dashboard/actions.ts:1444-1611`); only the base counts are real
- [x] Financial tracking server actions (fee collection, expenses, budget)
- [x] Emergency alert system with severity levels
- [x] Loading states with skeleton loaders
- [x] Error boundaries with fallback UI
- [x] Compliance tracking system
- [x] Notification service with persistence
- [x] getDashboardSummary action for admin metrics
- [ ] Accountant dashboard real data integration
- [ ] Staff dashboard real data integration
- [ ] Real-time updates (WebSocket/SSE)

## Known Issues

### P0 -- Critical

- None

### P1 -- High

- Accountant and Staff dashboards need full real data integration — **2026-07-19: accountant is ~75% real but weekly-collections / monthly-revenue charts + financial calendar are static (`accountant.tsx:154-283`); staff is ~10% real — `getStaffDashboardData` is self-labeled MOCK (`actions.ts:5332`)**. Also: accountant/principal/staff/admin destructure `dictionary` but never use it — all card titles hardcoded English (principal's `school.principalDashboard` namespace already exists, pure wiring bug; accountant/staff need new namespaces)
- No data caching strategy -- all data fetched on every page load

### P2 -- Medium

- Charts use some hardcoded sample data in bar-graph component
- No data export from dashboard views
- Period switcher does not persist selection across navigations
- Mobile layout needs optimization for chart components

## Enhancements (Post-MVP)

- [ ] Real-time updates via WebSocket or SSE
- [ ] Customizable widget layout (drag-and-drop)
- [ ] Charts with Recharts integration for all roles
- [ ] Quick actions with actual navigation
- [ ] Push notifications for critical alerts
- [ ] Dashboard data export (PDF/CSV)
- [ ] Comparison views (period-over-period)
- [ ] Custom date range filtering

---

**Last Review:** 2026-03-19
