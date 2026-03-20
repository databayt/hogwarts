## Analytics — School-wide analytics dashboard with charts and KPIs

### Overview

Client-side analytics dashboard displaying school performance metrics across enrollment, attendance, academics, and finance. Uses Recharts for interactive visualizations including area charts, bar charts, pie charts, radar charts, and scatter plots. Currently renders with mock/static data -- awaiting backend query integration.

### Capabilities by Role

- **ADMIN**: Full dashboard view with all KPI cards and charts
- **TEACHER**: Likely academic and attendance sections (TBD)
- **ACCOUNTANT**: Likely financial metrics section (TBD)

### Routes

| Route                                                  | Page | Status                      |
| ------------------------------------------------------ | ---- | --------------------------- |
| No dedicated `/analytics` route under school-dashboard | --   | Component exists, route TBD |

Note: Analytics widgets may be embedded in other dashboards (attendance/analytics, exams/result/analytics, timetable/analytics) rather than a standalone page.

### File Structure

```
src/components/school-dashboard/analytics/
└── dashboard.tsx  # Client component with Recharts visualizations (mock data)
```

### Status

**Completion:** 30% | **Blockers:** Backend queries not wired; data is static/mock

### Integration Points

- Attendance analytics: `src/app/[lang]/s/[subdomain]/(school-dashboard)/attendance/analytics/`
- Exam analytics: `src/app/[lang]/s/[subdomain]/(school-dashboard)/exams/result/analytics/`
- Timetable analytics: `src/app/[lang]/s/[subdomain]/(school-dashboard)/timetable/analytics/`
