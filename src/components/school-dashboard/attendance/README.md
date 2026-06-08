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

All 23 subroutes are **wired and page-level auth-gated**. Client-facing paths
use `/{lang}/attendance/...` (the `/s/{subdomain}/` segment is internal — the
middleware maps it). Each has its own `error.tsx` + `loading.tsx`.

| Route (clean path)                                      | Page                     | In primary nav?   |
| ------------------------------------------------------- | ------------------------ | ----------------- |
| `/{lang}/attendance`                                    | Overview / Mark          | Yes (Overview)    |
| `/{lang}/attendance/manual`                             | Manual marking           | Yes (staff)       |
| `/{lang}/attendance/records`                            | Records (own/child)      | Yes (non-staff)   |
| `/{lang}/attendance/reports`                            | Reports & export         | Yes (staff)       |
| `/{lang}/attendance/analytics`                          | Analytics dashboard      | Yes (staff)       |
| `/{lang}/attendance/qr-code`                            | QR code attendance       | Yes (staff)       |
| `/{lang}/attendance/geo`                                | Geofence attendance      | Deep-link         |
| `/{lang}/attendance/barcode`                            | Barcode/RFID scanner     | Deep-link         |
| `/{lang}/attendance/excuses`                            | Excuse management        | Yes               |
| `/{lang}/attendance/intentions`                         | Absence intentions       | Deep-link         |
| `/{lang}/attendance/interventions` (+`/tiers`)          | Interventions / MTSS     | Yes (staff)       |
| `/{lang}/attendance/early-warning`                      | Early-warning system     | Yes (staff)       |
| `/{lang}/attendance/kiosk`                              | Kiosk check-in           | Deep-link (admin) |
| `/{lang}/attendance/letters`                            | Attendance letters       | Deep-link (admin) |
| `/{lang}/attendance/gamification`                       | Gamification             | Deep-link         |
| `/{lang}/attendance/ai`                                 | AI risk insights         | Deep-link         |
| `/{lang}/attendance/{bulk,bulk-upload,analysis,recent}` | Bulk / analysis / recent | Deep-link         |
| `/{lang}/attendance/settings`                           | Settings (mockup)        | Yes (admin)       |

"Deep-link" = functional + auth-gated but not yet surfaced in `getTabsForRole`
(see ISSUE.md P2 — a product decision on which to promote to tabs).

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

**Completion:** ~92% | **Deploy blockers:** Vercel Pro (sub-daily compliance crons), Neon DB push, env vars — see [ISSUE.md](./ISSUE.md).

Components, ~140 server actions, validation schemas, 23 wired auth-gated routes
(each with `error.tsx` + `loading.tsx`), and a comprehensive Vitest suite
(575/575 green across 45 files in the attendance + compliance + cron + webhook
scope) are in place. The ADEK/eSIS compliance + live-classes bundle has been
re-landed on `fix/attendance-production-ready`. Remaining work is the i18n
long-tail (server-action error codes, Zod messages, settings mockup) and the
deploy-time gates — all tracked in [ISSUE.md](./ISSUE.md).

### Integration Points

- **Timetable**: Period-by-period tracking uses timetable data for current period detection
- **Students**: Attendance records link to student profiles via `studentId`
- **Classes**: Class roster loaded for attendance marking via `classId`
- **Notifications**: `triggerAbsenceNotification` (actions/core.ts) fires on
  ABSENT marks. For schools with compliance enabled it now dispatches on
  `in_app + email + whatsapp` channels so the existing crons drain them; for
  all other schools the legacy in_app + SMS path is unchanged.
- **Compliance (ADEK eSIS)**: ADEK-regulated schools (UAE) can opt in to a
  regulator-submission connector that uploads daily CSV to eSIS and contacts
  guardians within 2h of an unreported absence. See
  [`compliance/`](../compliance/README.md) and Epic 01 plan at
  `~/.claude/plans/read-attendance-block-and-distributed-wozniak.md`.

### Compliance Sub-System (new)

The attendance block emits two compliance touchpoints:

1. **Daily submission cron** (`/api/cron/esis-submit`, 10:00 UTC = 14:00 GST)
   reads today's attendance, builds a CSV via the generic
   `src/lib/compliance/providers/adek/mapper.ts`, and dispatches to the
   configured connector (DRY_RUN / PIGGYBACK / OFFICIAL_API / RPA).
2. **2-hour parent-contact SLA cron** (`/api/cron/absence-followup`, every
   30 min) finds ABSENT rows that are still unreported past
   `SchoolComplianceConfig.parentContactSlaMinutes`, dispatches guardian
   notifications on multi-channel, and writes an `AttendanceIntervention`
   row of type `PARENT_EMAIL` as ADEK audit evidence.

Schema is generic — `ComplianceProvider` enum lets a future regulator
(SEC KSA, MoE Qatar) be added without touching attendance code.

### Multi-Channel Absence Channels (compliance-only)

When a school has `SchoolComplianceConfig.enabled = true`,
`triggerAbsenceNotification` writes the notification with `channels =
["in_app", "email", "whatsapp"]` instead of `["in_app"]`. This lets the
existing email + WhatsApp crons drain the row, producing multi-channel
delivery evidence the ADEK 2h SLA report needs. Schools without compliance
keep the lighter in_app + SMS path to avoid notification spam.
