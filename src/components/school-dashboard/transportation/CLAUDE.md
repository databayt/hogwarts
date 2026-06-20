# Transportation Block

## Context

School transportation: fleet inventory (vehicles), drivers with licenses, named routes with ordered stops, student-route assignments, daily trip runs with boarding records, settings, fees view, STUDENT/GUARDIAN view, and a service-account geofence-boarding webhook. Multi-tenant; every model is `schoolId`-scoped. **Production-ready** — all 9 transportation tables live in production Postgres (`br-small-tooth-adscsfmb`), 313/313 unit tests green across 15 files (tests live under `src/tests/school-dashboard/transportation/`).

## Before You Start

1. Read `README.md` here for routes, file structure, and integration points
2. Read `ISSUE.md` here for the gap/blocker/improvement tracker — the block is production-ready;
   the 2026-05-22 + 2026-05-29 remediation passes closed the polish/hardening backlog (error-code
   toasts, geofence picker, dead permissions, AlertDialog confirms, full business-logic test
   coverage). Only consciously-deferred items remain (page-gate de-dup P3-3, accepted token
   prefix-scan P3-6)
3. The 9 Prisma models live in `prisma/models/transportation.prisma`:
   - 7 core: Vehicle, Driver, Route, RouteStop, RouteAssignment, Trip, TripBoarding
   - 2 added in production-readiness sweep: TransportationSettings, SchoolApiToken
4. Migration SQL files in `prisma/migrations/`:
   - `20260428083207_add_transportation` — MVP (5 tables)
   - `20260428090000_add_transportation_trips` — Trip + TripBoarding
   - `20260429070000_link_route_to_geofence` — Route.geofenceId FK
   - `20260508000000_add_transportation_settings_and_api_tokens` — Phase 4
5. Plans:
   - Original feature plan: `/Users/abdout/.claude/plans/invoke-feature-workflow-to-toasty-crystal.md`
   - Production-readiness sweep: `/Users/abdout/.claude/plans/read-transportation-feature-to-elegant-walrus.md`

## Key Decisions

- **Driver = own model**, not a `StaffMember` flag. Carries `licenseExpiry`, license class, contractor flag. Bridges to StaffMember via optional `staffMemberId`, and to User via optional `userId` for driver portal access.
- **Route.monthlyFee owns the source of truth.** Finance reads via `previewTransportFees()`. We do NOT auto-create `FeeRecord` rows from this block — that belongs to finance's own provisioning flow.
- **Trip.scheduledTime is denormalized** from `Route.departureTime` at scheduling time so editing the route later doesn't rewrite history.
- **`startTrip` auto-populates TripBoardings** with status=PENDING for every active assignment on the route. Drivers/staff then mark BOARDED/ALIGHTED/MISSED per stop via `recordBoarding`.
- **Stop reorder uses two-phase update** (negative offset → final order) to avoid hitting the `@@unique([schoolId, routeId, stopOrder])` constraint mid-transaction. See `actions/stops.ts:reorderStops`.
- **Trip lifecycle is state-machine guarded**: `startTrip` requires SCHEDULED, `finishTrip` requires IN_PROGRESS, `cancelTrip` requires SCHEDULED|IN_PROGRESS, `recordBoarding` requires IN_PROGRESS. Returns `TRIP_INVALID_STATE` on violation.
- **Geofence integration is opt-in**: `Route.geofenceId` is nullable. When set, `recordBoardingFromGeofence(studentId, geofenceId, eventType)` bridges existing `GeoFence`/`GeoAttendanceEvent` ENTER/EXIT events into TripBoarding rows. The data layer is wired (`routeSchema` accepts `geofenceId`; `create/updateRoute` persist it), the route form has a geofence picker (`listAvailableGeofences` action → `routes-client`), and the `/api/transportation/geofence-boarding` webhook works — so `geofenceId` is settable from the admin UI as well as seed/SQL/webhook (P2-2 landed 2026-05-22).
- **Service-account webhook**: `POST /api/transportation/geofence-boarding` accepts a Bearer token from `school_api_tokens` (bcrypt-hashed; plaintext shape is `<8-char-prefix>.<32-hex-secret>`). Token's `schoolId` IS the tenant — never read from request body. Rate limit: 120/min/IP.
- **Trip-event notifications honor school's preferredLanguage** — guardian notifications render in `en` or `ar` based on `school.preferredLanguage`. Per-event opt-out flags in `TransportationSettings`.
- **Settings model is one-row-per-school** (`@@unique([schoolId])`); `getSettings()` returns defaults if no row exists. `updateSettings()` upserts.

### 2026-06-14 optimization pass (security / correctness / perf) — invariants to preserve

- **Tenant-scoped writes use `updateMany` with `schoolId` IN the predicate**, not `findFirst`-then-`update({where:{id}})`. `revokeApiToken` was an IDOR (scoped read, unscoped write) — keep `schoolId` in every mutating WHERE.
- **`getAssignmentForStudent` was DELETED** — it was a dead IDOR (gated only on `read_own`, accepted an arbitrary `studentId` with no `StudentGuardian` ownership check). Student/guardian access goes through `getMyTransportationView` only. Don't reintroduce a per-student read without an ownership check.
- **`deleteStop` blocks on historical `TripBoarding` too**, not just active assignments — `RouteStop`→`TripBoarding` is `onDelete: Cascade`, so a hard delete would wipe trip history. Returns `HAS_DEPENDENCIES`.
- **Trip end/cancel resolve stranded PENDING boardings**: `finishTrip` → `MISSED` (student never boarded), `cancelTrip` → `EXCUSED` (trip didn't run, not the student's fault). These `updateMany`s are silent (no notification).
- **`updateAssignment` re-activation runs the single-active guard** (same as create/restore) when `data.status === "ACTIVE"` → `ROUTE_ASSIGNMENT_OVERLAP`.
- **Webhook rate limit is `checkRateLimitAsync` (Redis-authoritative)**, not the sync in-memory `rateLimit()` (which resets per serverless instance). Keep it async; it also blunts the P3-6 bcrypt prefix-scan DoS.
- **`getTripStats` uses `db.trip.groupBy`** (not row-fetch + JS tally). `notifyGuardiansOfTripEvent` reads settings up front and short-circuits the opt-out BEFORE the guardian fan-out.
- **`StopEditor` is keyed on the stop-id set** in `routes/detail-content.tsx` — required because the editor seeds local optimistic `stops` state once and `router.refresh()` doesn't remount client components (add/delete would otherwise not show). Reorder keeps the same set → optimistic order survives.
- **Deploy-pending indexes** staged in `transportation.prisma` (NOT pushed): `Trip @@index([schoolId, status, actualEndTime])`, `Route @@index([schoolId, geofenceId])`. Apply via the Neon protocol at deploy.

### 2026-06-18 Advanced door-to-door upgrade — invariants to preserve

- **Per-student door-to-door = each student's pickup point materializes as a `RouteStop`.** `StudentTransportProfile` holds the canonical geocoded pickup/drop point (set at registration, route-independent); assigning to a route materializes/points a `RouteStop`. This keeps the production-ready boarding/trip/geofence machinery (all keyed on `stopId`) intact. Stops now carry lat/lng (collected via the reused `MapboxLocationPicker`), so **`detail-content.tsx` serializes `RouteStop` Decimal lat/lng → plain numbers** before passing to the client `StopEditor` (Prisma `Decimal` can't cross the RSC boundary — `EditorStop` shape).
- **Optimizer is 3-tier, server-only, never throws** (`lib/optimize.ts`): Mapbox Optimization API (≤11 stops, traffic-aware) → Mapbox Matrix + NN/2-opt + Directions polyline (≤24) → Haversine NN/2-opt fallback (any size / no token / API failure). Reads `MAPBOX_SERVER_TOKEN` (NEVER `NEXT_PUBLIC_`), falls back to the public token then Haversine. `driving-traffic` profile everywhere = traffic is free within those calls. **Always `.toNumber()` Prisma Decimal before geo math.** Mapbox waypoint caps (12/25) make the Haversine tier mandatory for big door-to-door routes.
- **ETAs are bell-time anchored** (`lib/eta.ts`): PICKUP arrives by `firstPeriod.startTime − pickupBuffer` (backward); DROPOFF departs at `lastPeriod.endTime + buffer` (forward). `getSchoolBellTimes` reads `@db.Time` periods via UTC getters.
- **Per-trip plan is frozen** on `Trip.optimizedStopOrder`/`polylineEncoded`/`planSource` (`lib/plan.ts` `generateAndStoreTripPlan`, best-effort) so editing the route later never rewrites a run's history. Gated by `TransportationSettings.enableRouteOptimization`.
- **Absence-aware re-routing**: `lib/absence.ts` `getAbsentStudentIdsForDate` = Attendance(ABSENT/EXCUSED/SICK) ∪ APPROVED `AbsenceIntention` covering the date. The nightly `build-tomorrow-trips` cron upserts tomorrow's SCHEDULED trips, pre-sets boardings (EXCUSED for absentees via createMany+`skipDuplicates` AND a PENDING→EXCUSED sweep for re-runs), drops empty stops, and re-optimizes the reduced set. **Guardian "skip pickup" creates a PENDING `AbsenceIntention(reason=TRANSPORTATION)` — only APPROVED skips drop a seat** (admin gate in `trips/trip-skip-approvals.tsx`).
- **Live tracking** (`/api/transportation/location`): token (`SchoolApiToken`, scope `transportation.location`) OR session (trip's driver / `record_boarding`); **schoolId from the token, never the body** (geofence-webhook precedent); rate-limited via `checkRateLimitAsync` (`GEO_LOCATION`). Writes `TripLocation` (pruned by `cleanup-trip-locations` cron), broadcasts `trip:location` via the secret-gated `/api/emit` bridge (`lib/realtime.ts`), and emits `trip:approaching` + guardian alert when within `approachAlertMeters` (the rate limiter doubles as a 5-min dedup gate). Live map (`trip-live-map.tsx`, react-leaflet `CircleMarker`s — no Leaflet icon assets) is **polling-first** (`/latest`), socket-enhanced — works without the (undeployed, #262) socket server.
- **Guardian notifications now reach WhatsApp**: `notifyGuardiansOfTripEvent` sets `channels: [in_app, whatsapp]` so the `process-whatsapp-notifications` cron delivers them; kept `type: system_alert` + `metadata.kind` (NO `NotificationType` enum migration). New kinds: `student_boarded`/`student_alighted` (from `recordBoarding`), `bus_approaching` (from the ingest), `route_changed` (from `createRoadHazard`).
- **Hazards** (`RoadHazard`): admin-pinned; the optimizer's **Haversine tier penalizes legs near active hazards** (ordering only — reported distance/ETA stay real); Mapbox tiers rely on live traffic (point-exclusion unsupported). Creating one alerts guardians of routes with stops in range.
- **Weather is designed-but-deferred** — needs `OPENWEATHER_API_KEY` (user opted into Mapbox-traffic only). No weather code shipped; add behind a `TransportationSettings.enableWeatherAlerts` flag when a key is provisioned.

## Danger Zones

- **`Route.geofenceId` cross-block reference** — schema changes to `geo_fences` need a check here. Currently `onDelete: SetNull`.
- **`reorderStops` transaction** — if interrupted mid-transaction, stops can be left with negative `stopOrder` values. Re-running fixes it; the unique constraint stays consistent because the SQL still respects schoolId+routeId scoping.
- **Trip uniqueness:** `@@unique([schoolId, routeId, scheduledDate, direction])` — same route can't be scheduled twice on the same day in the same direction. Server returns `TRIP_DUPLICATE`.
- **Active assignment uniqueness:** `@@unique([schoolId, studentId, routeId, effectiveFrom])` — allows historical re-assignments on the same route, but `assignStudentToRoute` adds an extra check that rejects new active assignments while one already exists.
- **API token plaintext is ephemeral** — only returned ONCE at issuance (seed prints it to console). Lost token = revoke + re-mint. Never log the full plaintext, only `tokenPrefix` for forensics.
- **Geofence webhook schoolId injection** — the API route MUST take schoolId from the resolved token, NOT from the request body. The current code does this correctly; preserve in any refactor.
- **Two sidebar configs — only one is live.** The rendered sidebar is `template/platform-sidebar/config.ts` (`platformNav`), with correct per-role transportation entries + `bus` icon (`platform-sidebar/icons.tsx`) and titles in the `platform.sidebar` dict (en + ar). `school-dashboard/config.ts` is **dead/legacy** (imported nowhere) — don't edit it expecting nav changes.
- **Error toasts go through `error-map.ts`** — clients call `resolveTransportationError(t, "error" in result ? result.error : undefined)` to turn a server code into a translated message. When you add a new surfaced error code, add a `case` to `resolveTransportationError` (otherwise it falls back to `errors.internalError`).
- **RBAC matrix has no dead entries** — `read_class` and `export` were removed (2026-05-22); every `PERMISSION_MATRIX` action has a caller. Fee CSV export is client-side and gated by the `view_fees` page (no separate permission).
- **Validation is server-only** — the dead i18n `createXSchema` factories were **deleted (2026-05-29, P2-4 resolved)**. `validation.ts` now holds only the raw schemas (`vehicleSchema`, `driverSchema`, …) that server actions parse with; clients submit plain inputs and surface translated messages via `error-map.ts`. There is no inline client-side field validation by design. `TransportationSettingsInput` is derived from the raw `transportationSettingsSchema`.

## Related Blocks

- [Geo-Attendance](../../../prisma/models/geo-attendance.prisma) — `Route.geofenceId` references `GeoFence` (M2-3)
- [Notifications](../notifications/CLAUDE.md) — trip events fire `system_alert` notifications with `metadata.kind = trip_*`
- [Finance Fees](../finance/) — `previewTransportFees()` is the canonical input for fee provisioning. No direct `FeeRecord` writes from here.
- [Students](../listings/students/) — `Student.routeAssignments` and `Student.tripBoardings` back-relations
- [Staff Members](../listings/staff/) — `StaffMember.driverProfile` optional bridge for in-house drivers
- [Auth/Multi-Tenant](../../auth/) — `SchoolApiToken` lives in transportation file but is a generic per-school API token model that other blocks can reuse

## Demo Seed

`pnpm db:seed:single transportation` populates:

- 5 vehicles (BUS/VAN/MINIBUS, mixed status, one MAINTENANCE)
- 5 drivers (4 ACTIVE + 1 ON_LEAVE; one with license expiring in 30 days)
- 5 routes × 4 stops = 20 stops
- ~150 active assignments (15% of seeded students)
- ~50 trips across 14 working days (mix SCHEDULED/COMPLETED/CANCELLED, today's first route IN_PROGRESS)
- TripBoardings for COMPLETED trips
- Settings row + demo `SchoolApiToken` (plaintext printed once on console)

## After You Finish

1. Update `README.md` — if routes or file structure changed
2. Run `pnpm tsc --noEmit` to verify no regressions
3. `pnpm vitest run src/components/school-dashboard/transportation` — keeps 300/300 green
4. Test: `admin@databayt.org` (pw: 1234) on `demo.localhost:3000` → `/en/transportation`
5. **Before applying any DB changes:** create a Neon branch via `mcp__Neon__create_branch`, test on the branch first, then promote
