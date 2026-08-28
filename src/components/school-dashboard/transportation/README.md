## Transportation — Fleet, Routes, Drivers, Trips, Boarding

> **Status:** ✅ Production-ready. **2026-06-18 advanced door-to-door upgrade** layered real intelligence
> on top of the M1/M2 base — see the [Advanced upgrade](#advanced-door-to-door-upgrade-2026-06-18) section.
> Now **12 models** (was 9: +`StudentTransportProfile`, +`TripLocation`, +`RoadHazard`) and **331 unit
> tests green** (`pnpm vitest run src/tests/school-dashboard/transportation`). tsc 0 project-wide.
> **DB deploy-pending** (Neon-branch-first): 3 new tables + Trip columns
> (`optimizedStopOrder`/`polylineEncoded`/`planGeneratedAt`/`planSource`) + Settings columns
> (`enableRouteOptimization`/`approachAlertMeters`) + `AbsenceIntention @@index([schoolId,status,dateFrom])`
>
> - the 2 previously-staged indexes. **New env (optional):** `MAPBOX_SERVER_TOKEN` (traffic-aware optimizer;
>   falls back to public token → Haversine). **New crons:** `build-tomorrow-trips` (`0 20 * * *`),
>   `cleanup-trip-locations` (`0 3 * * *`).
>
> Prior base last audited 2026-06-14 (security/correctness/perf pass). Tests now live under
> `src/tests/school-dashboard/transportation/`; `__tests__/` paths below are historical.

### Advanced door-to-door upgrade (2026-06-18)

Five-phase upgrade turning storage into _planning_:

1. **Geocoded pickup foundation** — `StudentTransportProfile` (canonical pickup/drop point); the reused
   `MapboxLocationPicker` now collects stop **and** student lat/lng; `Route.distanceKm` auto-computed
   (`src/lib/haversine.ts`). Profile editor on the assignment detail page.
2. **Route optimization + bell-time ETA** — `lib/optimize.ts` (Mapbox Optimization → Matrix+2-opt →
   Haversine), `lib/eta.ts` (bell-time backward calc), `lib/plan.ts` (per-trip frozen plan). "Optimize"
   button on routes, plan + ETAs + "Regenerate" on trip detail, settings toggle.
3. **Absence-aware dynamic re-routing** — `lib/absence.ts`, guardian "skip pickup" (`/me`) + admin
   approvals (trips), nightly `build-tomorrow-trips` cron (drops absentees/empty stops, re-optimizes).
4. **Real-time live tracking** — `TripLocation`, `/api/transportation/location` ingest (+ `/latest`
   polling), `driver-tracker.tsx` (GPS streamer), `trip-live-map.tsx` (react-leaflet), guardian live map,
   "bus approaching" alerts; socket events via the `/api/emit` bridge (polling fallback when socket is down).
5. **Notifications + traffic + hazards** — guardian alerts now go **in-app + WhatsApp**; `driving-traffic`
   profile gives traffic-aware ETAs free; `RoadHazard` admin pins (settings) + Haversine-tier avoidance +
   `route_changed` alerts. (Weather deferred — needs `OPENWEATHER_API_KEY`.)

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
> `bus` icon and titles in the `platform.sidebar` dictionary (en + ar; P2-10 landed). (The older
> `school-dashboard/config.ts` is dead/legacy and not rendered.) The `PERMISSION_MATRIX` has **no dead
> entries** — the unused `read_class`/`export` permissions were removed (P2-5/P2-6).

### Routes

Page-level role gates live in each `page.tsx` (`ALLOWED_ROLES` → redirect to `/dashboard` if denied).
Server actions independently enforce the RBAC matrix via `requireContext()`.

| Route                                        | Page                                                | Allowed roles                                 |
| -------------------------------------------- | --------------------------------------------------- | --------------------------------------------- |
| `/{lang}/transportation`                     | Landing page (hero + live counts + role-aware CTAs) | Any signed-in role (STUDENT/GUARDIAN → `/me`) |
| `/{lang}/transportation/dashboard`           | Overview (counts + recent + expiring docs)          | DEVELOPER, ADMIN, STAFF                       |
| `/{lang}/transportation/vehicles`            | Fleet list + create/edit dialog                     | DEVELOPER, ADMIN, STAFF                       |
| `/{lang}/transportation/vehicles/[id]`       | Vehicle detail                                      | DEVELOPER, ADMIN, STAFF                       |
| `/{lang}/transportation/routes`              | Routes list + create dialog                         | DEVELOPER, ADMIN, STAFF                       |
| `/{lang}/transportation/routes/[id]`         | Route detail with drag-drop stop editor             | DEVELOPER, ADMIN, STAFF                       |
| `/{lang}/transportation/drivers`             | Drivers list + create/edit dialog                   | DEVELOPER, ADMIN, STAFF                       |
| `/{lang}/transportation/assignments`         | Assignments table + create dialog                   | DEVELOPER, ADMIN, STAFF                       |
| `/{lang}/transportation/trips`               | Trips list + schedule dialog                        | DEVELOPER, ADMIN, STAFF, TEACHER              |
| `/{lang}/transportation/trips/[id]`          | Trip detail + start/finish/cancel + boarding roster | DEVELOPER, ADMIN, STAFF, TEACHER              |
| `/{lang}/transportation/reports`             | Reports dashboard                                   | DEVELOPER, ADMIN, STAFF                       |
| `/{lang}/transportation/settings`            | Settings (writable)                                 | DEVELOPER, ADMIN                              |
| `/{lang}/transportation/me`                  | Student/guardian "my transportation" view           | STUDENT, GUARDIAN (+DEV/ADMIN)                |
| `/{lang}/transportation/fees`                | Fee preview                                         | ACCOUNTANT (+DEV/ADMIN)                       |
| `POST /api/transportation/geofence-boarding` | Service-account boarding webhook                    | Bearer token (`SchoolApiToken`)               |

> All five entities have `[id]` detail pages with row drill-in — `drivers/[id]` and `assignments/[id]`
> landed alongside vehicles/routes/trips (P2-9).

> **2026-08-16 — landing/app split.** `/transportation` is now a landing page (lumos parity); the
> fleet overview it used to hold moved to `/transportation/dashboard`. Every ops surface sits inside
> the `(app)` route group, whose layout renders `nav.tsx` — one heading + tab strip, tabs filtered by
> role so a tab is never shown to someone the page would bounce. Route groups are omitted from URLs
> and from `revalidatePath` targets, so `transportationRevalidatePath()` was unaffected. `/me` stays
> outside the group (end-user surface, no ops chrome), exactly as lumos keeps `/courses` out of its own.

### File Structure

```
src/components/school-dashboard/transportation/
├── CLAUDE.md, README.md, ISSUE.md
├── content.tsx                           # Overview (server) — rendered at /dashboard
├── nav.tsx                               # Section heading + role-filtered tab strip ((app) layout)
├── landing/                              # /transportation landing page (server sections)
│   ├── content.tsx                       # composition + role → href resolution
│   ├── art.ts                            # the bus line drawing (shared with school-marketing)
│   ├── types.ts
│   └── {hero,stats,features,capabilities,audience,how-it-works,cta}-section.tsx
├── authorization.ts                      # 13-action × 8-role RBAC matrix (+ convenience helpers)
├── validation.ts                         # Raw Zod server schemas + Settings schema (validation is server-only)
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
└── __tests__/                           # 14 files, 300 tests
    ├── authorization, validation, multi-tenant, geofence-webhook   # original suites
    ├── crud-mutations, stops, trips-state-machine                  # mutating CRUD + reorder + state machine
    ├── settings, me, notifications, api-tokens                     # settings / portal / notify / token actions
    └── geofence-action, geofence-webhook-route, overview-reports   # wrapper / HTTP handler / reports

src/app/[lang]/s/[subdomain]/(school-dashboard)/transportation/
├── page.tsx, loading.tsx, error.tsx     # landing (single root error.tsx covers all nested segments)
├── me/{page,loading}.tsx                # outside (app): end-user surface, no ops chrome
└── (app)/                               # route group — adds the tab strip, adds no URL segment
    ├── layout.tsx                       # renders <TransportationSectionNav/>
    ├── dashboard/{page,loading}.tsx     # the former /transportation overview
    ├── vehicles/{page,loading}.tsx + [id]/{page,loading}.tsx
    ├── routes/{page,loading}.tsx + [id]/{page,loading}.tsx
    ├── drivers/{page,loading}.tsx + [id]/{page,loading}.tsx
    ├── assignments/{page,loading}.tsx + [id]/{page,loading}.tsx
    ├── trips/{page,loading}.tsx + [id]/{page,loading}.tsx
    ├── reports/{page,loading}.tsx
    ├── settings/{page,loading}.tsx
    └── fees/{page,loading}.tsx

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
  webhook. The route form has a geofence picker (`listAvailableGeofences`), so `geofenceId` is
  settable from the admin UI as well as the seed/SQL/webhook flow (P2-2 landed).
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

Tests live at `src/tests/school-dashboard/transportation/` — run `pnpm vitest run src/tests/school-dashboard/transportation`. **313/313 green across 15 files** (verified 2026-06-14; +2 vs 2026-05-29: `stops` deleteStop boarding-history guard, `geofence-webhook-route` 429 rate-limit case):

- `authorization.test.ts` (31) — full (role × action) RBAC matrix
- `validation.test.ts` (56) — every raw Zod schema (entity + update + trip + settings), valid/invalid parses
- `multi-tenant.test.ts` (16) — `schoolId` scoping on list/count actions, permission rejections, DEVELOPER-without-school denial
- `crud-mutations.test.ts` (44) — create/update/delete/restore for vehicles/drivers/routes/assignments + ownership guards + uniqueness + overlap
- `stops.test.ts` (18) — add/update/delete + the two-phase `reorderStops` ordering invariant
- `trips-state-machine.test.ts` (30) — schedule/start/finish/cancel/recordBoarding/restore state guards + auto-populated boardings + notification dispatch
- `settings.test.ts` (12) — defaults-when-no-row, upsert, Decimal→Number coercion
- `me.test.ts` (15) — STUDENT/GUARDIAN/DEVELOPER/ADMIN branches + fall-through gate
- `notifications.test.ts` (20) — en/ar rendering, `{route}`/`{reason}` interpolation, per-event opt-out, dedup, best-effort no-throw
- `api-tokens.test.ts` (15) — mint (plaintext-once, hash-only persist), list (no hash exposed), revoke (ownership-scoped, idempotent)
- `geofence-action.test.ts` (5) — public wrapper permission gate + schoolId/recordedBy injection
- `geofence-webhook-route.test.ts` (11) — HTTP handler 401/403/400/200-ack/500 matrix + **schoolId-from-token-never-body** invariant
- `geofence-webhook.test.ts` (12) — token generate/verify + the internal boarding bridge
- `overview-reports.test.ts` (15) — expiring-doc window, recent assignments, driver-hour aggregation, trip-stat math

> Coverage spans RBAC, validation, multi-tenant scoping, the full mutating surface, the trip state
> machine, the two-phase stop reorder, settings, `/me`, notification fan-out, API tokens, and the
> geofence webhook handler. The two named hard invariants (reorder ordering, token-not-body schoolId)
> are explicitly proven. See ISSUE.md for the (closed) coverage history.

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

| Milestone / surface                                      | Status                                                       |
| -------------------------------------------------------- | ------------------------------------------------------------ |
| M1 MVP (5 entities)                                      | ✅ shipped + in prod                                         |
| M2-1 Trips + boarding + state machine                    | ✅ shipped                                                   |
| M2-2 Drag-drop stops                                     | ✅ shipped                                                   |
| M2-3 Geofence link (schema + webhook + UI picker)        | ✅ shipped (P2-2 picker landed)                              |
| M2-4 Fee preview + CSV export                            | ✅ shipped (CSV landed — P2-5)                               |
| M2-5 Parent notifications (i18n + opt-outs + route name) | ✅ shipped (P3-2 templating)                                 |
| M2-6 Reports                                             | ✅ shipped                                                   |
| Production migration (all 9 tables)                      | ✅ applied                                                   |
| Writable settings + API-token admin UI                   | ✅ shipped (P3-5)                                            |
| STUDENT/GUARDIAN `/me` + ACCOUNTANT `/fees`              | ✅ shipped                                                   |
| Geofence webhook + API tokens                            | ✅ shipped (mint/revoke from settings)                       |
| `drivers/[id]` + `assignments/[id]` detail               | ✅ shipped (P2-9)                                            |
| Demo seed                                                | ✅ shipped                                                   |
| Per-role sidebar entries + `bus` icon + titles           | ✅ shipped (P2-10 dict titles)                               |
| Error-code → toast mapping (all clients)                 | ✅ shipped (P1-2)                                            |
| AlertDialog confirms                                     | ✅ shipped (P2-3)                                            |
| Form validation                                          | ✅ server-only — dead i18n factories deleted (P2-4 resolved) |
| Business-logic test coverage                             | ✅ comprehensive — 300 tests / 14 files (P3-1 closed)        |
