## Transportation — Fleet, Routes, Drivers, Trips, Boarding

> **Status:** ✅ Functionally production-ready. All 9 tables live in production Postgres
> (`br-small-tooth-adscsfmb`); 67/67 unit tests green. A polish/hardening backlog
> remains — see [`ISSUE.md`](./ISSUE.md). Last audited 2026-05-21.

### Overview

The Transportation block provides school bus and route management:

- **Fleet** — Vehicles (BUS/VAN/CAR/MINIBUS) with capacity, registration/insurance/inspection tracking
- **Drivers** — License records (class + expiry), contractor flag, optional bridges to `StaffMember` and `User`
- **Routes** — Named routes with origin → destination, departure/return times, ordered stops with drag-drop reorder, optional default vehicle and driver, optional monthly fee, optional geofence link
- **Assignments** — Student → Route → Stop with effective-from/to dates and direction (PICKUP/DROPOFF/ROUND_TRIP)
- **Trips** — Daily run instances scheduled per route+date+direction. State-machine guarded (SCHEDULED → IN_PROGRESS → COMPLETED/CANCELLED). `start` auto-populates one PENDING boarding row per active assignment. Trip events (start/finish/cancel) fire guardian notifications.
- **Boarding** — Per-student BOARDED/ALIGHTED/MISSED/EXCUSED tracking; also driven by a geofence webhook
- **Settings** — Writable per-school config: pickup buffer, default monthly fee, per-event guardian-notification opt-outs, late threshold
- **Fee preview** — Read-only monthly transport-fee projection (finance owns actual `FeeRecord` creation)
- **Reports** — Trip stats (last 30 days), route utilization, driver hours
- **Self-service** — `/me` view for STUDENT/GUARDIAN; `/fees` view for ACCOUNTANT
- **Webhook** — `POST /api/transportation/geofence-boarding` for service-account geofence collectors

### Capabilities by Role (from `authorization.ts` `PERMISSION_MATRIX`)

| Role           | Vehicles/Routes/Drivers/Stops/Settings | Assignments | Trips  | Record boarding | Fee preview | Own view |
| -------------- | -------------------------------------- | ----------- | ------ | --------------- | ----------- | -------- |
| **DEVELOPER**  | manage (all schools)                   | manage      | manage | yes             | yes         | n/a      |
| **ADMIN**      | manage                                 | manage      | manage | yes             | yes         | n/a      |
| **STAFF**      | read                                   | manage      | manage | yes             | —           | —        |
| **TEACHER**    | —                                      | —           | read   | yes             | —           | —        |
| **ACCOUNTANT** | —                                      | —           | —      | —               | yes         | —        |
| **STUDENT**    | —                                      | —           | —      | —               | —           | own      |
| **GUARDIAN**   | —                                      | —           | —      | —               | —           | children |

> The live sidebar (`template/platform-sidebar/config.ts`) wires per-role entries — `ADMIN/STAFF/DEVELOPER`
> → overview, `ACCOUNTANT` → `/fees`, `STUDENT/GUARDIAN` → `/me`, `TEACHER` → `/trips` — all with the
> `bus` icon. (The older `school-dashboard/config.ts` is dead/legacy and not rendered.) Its 4 titles are
> **missing from the `platform.sidebar` dictionary**, so they show in English in `/ar` (ISSUE.md P2-10).
> `read_class` and `export` permissions exist in the matrix but have **zero callers** (dead) — ISSUE.md P2-5/P2-6.

### Routes

Page-level role gates live in each `page.tsx` (`ALLOWED_ROLES` → redirect to `/dashboard` if denied).
Server actions independently enforce the RBAC matrix via `requireContext()`.

| Route                                        | Page                                                | Allowed roles                    |
| -------------------------------------------- | --------------------------------------------------- | -------------------------------- |
| `/{lang}/transportation`                     | Overview (counts + recent + expiring docs)          | DEVELOPER, ADMIN, STAFF          |
| `/{lang}/transportation/vehicles`            | Fleet list + create/edit dialog                     | DEVELOPER, ADMIN, STAFF          |
| `/{lang}/transportation/vehicles/[id]`       | Vehicle detail                                      | DEVELOPER, ADMIN, STAFF          |
| `/{lang}/transportation/routes`              | Routes list + create dialog                         | DEVELOPER, ADMIN, STAFF          |
| `/{lang}/transportation/routes/[id]`         | Route detail with drag-drop stop editor             | DEVELOPER, ADMIN, STAFF          |
| `/{lang}/transportation/drivers`             | Drivers list + create/edit dialog                   | DEVELOPER, ADMIN, STAFF          |
| `/{lang}/transportation/assignments`         | Assignments table + create dialog                   | DEVELOPER, ADMIN, STAFF          |
| `/{lang}/transportation/trips`               | Trips list + schedule dialog                        | DEVELOPER, ADMIN, STAFF, TEACHER |
| `/{lang}/transportation/trips/[id]`          | Trip detail + start/finish/cancel + boarding roster | DEVELOPER, ADMIN, STAFF, TEACHER |
| `/{lang}/transportation/reports`             | Reports dashboard                                   | DEVELOPER, ADMIN, STAFF          |
| `/{lang}/transportation/settings`            | Settings (writable)                                 | DEVELOPER, ADMIN                 |
| `/{lang}/transportation/me`                  | Student/guardian "my transportation" view           | STUDENT, GUARDIAN (+DEV/ADMIN)   |
| `/{lang}/transportation/fees`                | Fee preview                                         | ACCOUNTANT (+DEV/ADMIN)          |
| `POST /api/transportation/geofence-boarding` | Service-account boarding webhook                    | Bearer token (`SchoolApiToken`)  |

> No `drivers/[id]` or `assignments/[id]` detail pages exist (only vehicles/routes/trips have
> drill-in). See ISSUE.md P2-9.

### File Structure

```
src/components/school-dashboard/transportation/
├── CLAUDE.md, README.md, ISSUE.md
├── content.tsx                           # Overview (server)
├── authorization.ts                      # 13-action × 8-role RBAC matrix (+ convenience helpers)
├── validation.ts                         # Zod factories (i18n) + raw server schemas + Settings schema
├── empty-state.tsx, loading-skeleton.tsx, error-boundary.tsx
├── shared/types.ts                       # Row shapes for tables
├── actions.ts                            # Barrel export
├── actions/
│   ├── helpers.ts                        # requireContext + revalidate path
│   ├── vehicles.ts                       # CRUD + restore
│   ├── drivers.ts                        # CRUD + restore
│   ├── routes.ts                         # CRUD + restore
│   ├── stops.ts                          # add/update/delete + two-phase reorder
│   ├── assignments.ts                    # assign/end/list + restore + form-picker lookups
│   ├── trips.ts                          # schedule/start/finish/cancel + boarding upsert + restore
│   ├── geofence.ts                       # recordBoardingFromGeofence (permission-gated wrapper)
│   ├── geofence-internal.ts              # pure boarding logic shared by action + webhook
│   ├── fees.ts                           # previewTransportFees (read-only)
│   ├── reports.ts                        # utilization / driver hours / trip stats
│   ├── notifications.ts                  # internal trip-event guardian notify (i18n + opt-outs)
│   ├── settings.ts                       # getSettings / updateSettings (upsert)
│   ├── me.ts                             # getMyTransportationView (STUDENT/GUARDIAN)
│   └── overview.ts                       # getOverviewStats + expiring docs + recent assignments
├── vehicles/{content,vehicles-client,detail-content}.tsx
├── routes/{content,routes-client,detail-content,stop-editor}.tsx
├── drivers/{content,drivers-client}.tsx
├── assignments/{content,assignments-client}.tsx
├── trips/{content,trips-client,detail-content,trip-boarding-controls}.tsx
├── reports/content.tsx
├── settings/{content,form}.tsx
├── me/content.tsx
├── fees/content.tsx
└── __tests__/{authorization,validation,multi-tenant}.test.ts

src/app/[lang]/s/[subdomain]/(school-dashboard)/transportation/
├── page.tsx, loading.tsx, error.tsx     # (single root error.tsx covers all nested segments)
├── vehicles/{page,loading}.tsx + [id]/{page,loading}.tsx
├── routes/{page,loading}.tsx + [id]/{page,loading}.tsx
├── drivers/{page,loading}.tsx
├── assignments/{page,loading}.tsx
├── trips/{page,loading}.tsx + [id]/{page,loading}.tsx
├── reports/{page,loading}.tsx
├── settings/{page,loading}.tsx
├── me/page.tsx                           # ⚠ no loading.tsx (ISSUE.md P2-7)
└── fees/page.tsx                         # ⚠ no loading.tsx (ISSUE.md P2-7)

src/app/api/transportation/geofence-boarding/route.ts   # Bearer-token webhook
src/lib/api-tokens.ts                                    # verifyApiToken (bcrypt, prefix lookup)
```

### Database Models

`prisma/models/transportation.prisma` — **9 models, 8 enums**. Every model is `schoolId`-scoped
with `@@index([schoolId, ...])` and soft-delete (`deletedAt`) where applicable.

| Model                    | Table                              | Notes                                                        |
| ------------------------ | ---------------------------------- | ------------------------------------------------------------ |
| `Vehicle`                | `transportation_vehicles`          | `@@unique([schoolId, plateNumber])`                          |
| `Driver`                 | `transportation_drivers`           | optional `staffMemberId` / `userId` bridges                  |
| `Route`                  | `transportation_routes`            | `geofenceId` FK → `GeoFence` (SetNull); `monthlyFee`         |
| `RouteStop`              | `transportation_route_stops`       | `@@unique([schoolId, routeId, stopOrder])`                   |
| `RouteAssignment`        | `transportation_route_assignments` | `@@unique([schoolId, studentId, routeId, effectiveFrom])`    |
| `Trip`                   | `transportation_trips`             | `@@unique([schoolId, routeId, scheduledDate, direction])`    |
| `TripBoarding`           | `transportation_trip_boardings`    | `@@unique([schoolId, tripId, studentId])`                    |
| `TransportationSettings` | `transportation_settings`          | one row per school (`@@unique([schoolId])`)                  |
| `SchoolApiToken`         | `school_api_tokens`                | bcrypt `tokenHash` + 8-char `tokenPrefix`; generic, reusable |

Enums: `VehicleStatus`, `VehicleType`, `RouteStatus`, `RouteDirection`, `AssignmentStatus`, `DriverStatus`, `TripStatus`, `BoardingStatus`.

### Migrations

Located in `prisma/migrations/` — **all applied to production**:

1. `20260428083207_add_transportation` — 5 MVP tables + 6 enums
2. `20260428090000_add_transportation_trips` — Trip + TripBoarding + 2 enums
3. `20260429070000_link_route_to_geofence` — `Route.geofenceId` FK
4. `20260508000000_add_transportation_settings_and_api_tokens` — `TransportationSettings` + `SchoolApiToken`

> **DB safety:** before any further schema change, create a Neon branch first (CLAUDE.md protocol).

### Integration Points

- **GeoFence** — `Route.geofenceId` links to a `GeoFence` (intended `type=BUS_ROUTE`). When set,
  ENTER/EXIT events drive `TripBoarding` writes via `recordBoardingFromGeofence` (UI action) or the
  webhook. ⚠ The route **form has no geofence picker yet** — `geofenceId` is only settable via
  seed/SQL/webhook flow (ISSUE.md P2-2).
- **Notification** — Trip events create `Notification` rows for guardians (`type=system_alert`,
  `metadata.kind=trip_*`), rendered in the school's `preferredLanguage`, gated by per-event opt-out
  flags in `TransportationSettings`. No `NotificationType` enum migration required.
- **Finance** — `previewTransportFees()` is the canonical read-only input for fee provisioning.
  No direct `FeeRecord` writes from this block.
- **Sidebar** — `src/components/template/platform-sidebar/config.ts` (`platformNav`): 4 per-role entries
  (overview, `/fees`, `/me`, `/trips`) with the `bus` icon from `platform-sidebar/icons.tsx`. Titles are
  not yet in the `platform.sidebar` dictionary (ISSUE.md P2-10). Dashboard tiles in
  `school-dashboard/dashboard/config.ts` (`getQuickActionsByRole`) cover all 6 roles.

### Tests

`__tests__/` — run `pnpm vitest run src/components/school-dashboard/transportation`. **67/67 green** (verified 2026-05-21):

- `authorization.test.ts` — 31 tests, full (role × action) RBAC matrix
- `validation.test.ts` — 20 tests for the i18n Zod factory schemas
- `multi-tenant.test.ts` — 16 tests: `schoolId` scoping on list/count actions, permission rejections, trip state-machine, DEVELOPER-without-school denial

> Coverage is concentrated in RBAC/validation/list-scoping. Stateful business logic (full trip
> lifecycle, boarding upsert, geofence bridging, token verification, settings, `/me` resolution,
> notification fan-out) has little-to-no direct coverage, and there are no mutation-isolation tests.
> See ISSUE.md P3-1.

### Demo Seed

`pnpm db:seed:single transportation` (idempotent — clears the school's transportation rows first):

- 5 vehicles (BUS/VAN/MINIBUS, one MAINTENANCE, one registration expiring in ~25 days)
- 5 drivers (4 ACTIVE + 1 ON_LEAVE; one license expiring in 30 days; bridged to `position`-matched staff where present)
- 5 routes × 4 stops = 20 stops (Khartoum-area Arabic names, fees 2000–3500)
- ~15% of seeded students assigned (ROUND_TRIP, ACTIVE, effective 2 months ago)
- Trips across ±14 working days (past COMPLETED/CANCELLED, today's first route IN_PROGRESS, future SCHEDULED)
- `TripBoarding` rows for COMPLETED trips (~85% ALIGHTED, ~10% BOARDED, ~5% MISSED)
- 1 `TransportationSettings` row (defaults, `defaultMonthlyFee: 2500`)
- 1 `SchoolApiToken` `demo-geofence` — **plaintext printed once to console** (`demo-tx.<hex>`), use as `Authorization: Bearer`

### Status

| Milestone / surface                                      | Status                                    |
| -------------------------------------------------------- | ----------------------------------------- |
| M1 MVP (5 entities)                                      | ✅ shipped + in prod                      |
| M2-1 Trips + boarding + state machine                    | ✅ shipped                                |
| M2-2 Drag-drop stops                                     | ✅ shipped                                |
| M2-3 Geofence link (schema + webhook + UI picker)        | ✅ shipped (P2-2 picker landed)           |
| M2-4 Fee preview + CSV export                            | ✅ shipped (CSV landed — P2-5)            |
| M2-5 Parent notifications (i18n + opt-outs + route name) | ✅ shipped (P3-2 templating)              |
| M2-6 Reports                                             | ✅ shipped                                |
| Production migration (all 9 tables)                      | ✅ applied                                |
| Writable settings + API-token admin UI                   | ✅ shipped (P3-5)                         |
| STUDENT/GUARDIAN `/me` + ACCOUNTANT `/fees`              | ✅ shipped                                |
| Geofence webhook + API tokens                            | ✅ shipped (mint/revoke from settings)    |
| `drivers/[id]` + `assignments/[id]` detail               | ✅ shipped (P2-9)                         |
| Demo seed                                                | ✅ shipped                                |
| Per-role sidebar entries + `bus` icon + titles           | ✅ shipped (P2-10 dict titles)            |
| Error-code → toast mapping (all clients)                 | ✅ shipped (P1-2)                         |
| AlertDialog confirms                                     | ✅ shipped (P2-3)                         |
| react-hook-form forms                                    | ⏳ deferred — see ISSUE.md P2-4           |
| Business-logic test coverage                             | 🟡 partial — webhook/token covered (P3-1) |
