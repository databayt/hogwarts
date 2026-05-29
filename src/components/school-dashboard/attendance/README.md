## Attendance -- Daily Attendance Tracking

### Overview

The Attendance block provides a comprehensive student attendance management system with daily/period-by-period tracking, QR code and geofence-based marking, excuse and intervention workflows, and analytics.

**Section-based roster:** Attendance is taken by section (Grade 1-A, Grade 7-B). The student roster comes from `Student.sectionId` — all students enrolled in a section appear in the attendance list. This replaces the previous class-based approach that used the `StudentClass` join table.

### Capabilities by Role

- **Admin**: Mark attendance for any section, review excuses, manage interventions, view analytics, configure geofence zones, export reports
- **Teacher**: Mark attendance for homeroom section or assigned sections (via timetable), use QR code/barcode scanning, view section stats, submit intervention requests
- **Guardian**: View child's attendance, submit excuses with documentation
- **Student**: View own attendance history

### Routes

| Route                                                               | Page                | Status    |
| ------------------------------------------------------------------- | ------------------- | --------- |
| `/{lang}/s/{subdomain}/(school-dashboard)/attendance`               | Mark Attendance     | Not wired |
| `/{lang}/s/{subdomain}/(school-dashboard)/attendance/history`       | Attendance History  | Not wired |
| `/{lang}/s/{subdomain}/(school-dashboard)/attendance/reports`       | Reports and Export  | Not wired |
| `/{lang}/s/{subdomain}/(school-dashboard)/attendance/analytics`     | Analytics Dashboard | Not wired |
| `/{lang}/s/{subdomain}/(school-dashboard)/attendance/qr-code`       | QR Code Attendance  | Not wired |
| `/{lang}/s/{subdomain}/(school-dashboard)/attendance/geofence`      | Geofence Attendance | Not wired |
| `/{lang}/s/{subdomain}/(school-dashboard)/attendance/barcode`       | Barcode Scanner     | Not wired |
| `/{lang}/s/{subdomain}/(school-dashboard)/attendance/interventions` | Intervention Mgmt   | Not wired |
| `/{lang}/s/{subdomain}/(school-dashboard)/attendance/excuses`       | Excuse Management   | Not wired |

### File Structure

```
src/components/school-dashboard/attendance/
├── content.tsx                  # Server component (main UI)
├── actions.ts                   # Core server actions
├── actions/                     # Modular server actions
│   ├── core.ts                  #   Basic CRUD
│   ├── analytics.ts             #   Stats and trends
│   ├── interventions.ts         #   Intervention CRUD
│   ├── excuses.ts               #   Excuse workflow
│   ├── qr.ts                    #   QR session management
│   ├── identifiers.ts           #   Barcode/RFID
│   ├── dashboard.ts             #   Dashboard data
│   ├── policy.ts                #   Policy enforcement
│   ├── master.ts                #   Master actions
│   └── helpers.ts               #   Shared utilities
├── validation.ts                # Zod schemas
├── authorization.ts             # Permission checks
├── security.ts                  # Security utilities
├── columns.tsx                  # Table column definitions
├── tracking.tsx                 # Real-time tracking display
├── error-boundary.tsx           # Graceful error handling
├── loading-skeleton.tsx         # Loading states
├── empty-state.tsx              # Empty state UI
├── attendance-stats.ts          # Stats calculation
├── core/                        # Core attendance UI
│   ├── attendance-hub.tsx
│   ├── attendance-stats.tsx
│   ├── attendance-export.tsx
│   └── attendance-context.tsx
├── shared/                      # Shared utilities
│   ├── types.ts
│   ├── validation.ts
│   ├── utils.ts
│   └── hooks.ts
├── atom/                        # Reusable atoms
│   ├── stat-card.tsx
│   ├── action-card.tsx
│   └── recent-table.tsx
├── qr-code/                     # QR attendance
│   ├── content.tsx
│   ├── qr-generator.tsx
│   ├── qr-scanner.tsx
│   └── actions.ts
├── geofencee/                   # Geofence attendance
│   ├── content.tsx
│   ├── geofence-form.tsx
│   ├── geofence-list.tsx
│   ├── geo-tracker.tsx
│   ├── geo-live-map.tsx
│   ├── geo-service.ts
│   ├── validation.ts
│   └── actions.ts
├── barcode/                     # Barcode/RFID
│   ├── content.tsx
│   ├── barcode-scanner.tsx
│   └── student-cards.tsx
├── excuses/                     # Excuse management
│   ├── content.tsx
│   └── excuse-review.tsx
├── intentions/                  # Intention/absence declaration
│   ├── content.tsx
│   ├── submit-form.tsx
│   ├── validation.ts
│   └── actions.ts
├── letters/                     # Attendance letters
│   ├── content.tsx
│   ├── validation.ts
│   └── actions.ts
├── gamification/                # Attendance gamification
│   ├── content.tsx
│   ├── validation.ts
│   └── actions.ts
├── ai/                          # AI-powered insights
│   ├── content.tsx
│   ├── validation.ts
│   └── actions.ts
├── analytics/                   # Analytics dashboard
│   └── content.tsx
├── reports/                     # Reports and export
│   ├── content.tsx
│   └── export-button.tsx
├── overview/                    # Overview dashboard
│   └── content.tsx
├── records/                     # Attendance records
│   └── content.tsx
├── bulk-upload/                 # CSV import
│   └── content.tsx
├── realtime/                    # Real-time updates
│   └── live-attendance.tsx
└── __tests__/                   # Test files
    ├── actions.test.ts
    ├── validation.test.ts
    ├── interventions.test.ts
    └── multi-tenant.test.ts
```

### Status

**Completion:** 70% | **Blockers:** Route pages not created in app directory

Components, server actions (48+), validation schemas, and tests are implemented. The main gap is that no `page.tsx` files exist under `src/app/[lang]/s/[subdomain]/(school-dashboard)/attendance/` to wire the components to routes.

### Integration Points

- **Timetable**: Period-by-period tracking uses timetable data for current period detection
- **Students**: Attendance records link to student profiles via `studentId`
- **Classes**: Class roster loaded for attendance marking via `classId`
- **Notifications**: Planned integration for absence alerts to parents (not yet implemented)
