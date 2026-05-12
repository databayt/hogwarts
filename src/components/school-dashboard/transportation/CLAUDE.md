# Transportation Block

## Context

School transportation: fleet inventory (vehicles), drivers with licenses, named routes with ordered stops, student-route assignments, daily trip runs with boarding records, settings, fees view, STUDENT/GUARDIAN view, and a service-account geofence-boarding webhook. Multi-tenant; every model is `schoolId`-scoped. **Production-ready** — all 9 transportation tables live in production Postgres (`br-small-tooth-adscsfmb`), 67/67 tests green.

## Before You Start

1. Read `README.md` here for routes, file structure, and integration points
2. The 9 Prisma models live in `prisma/models/transportation.prisma`:
   - 7 core: Vehicle, Driver, Route, RouteStop, RouteAssignment, Trip, TripBoarding
   - 2 added in production-readiness sweep: TransportationSettings, SchoolApiToken
3. Migration SQL files in `prisma/migrations/`:
   - `20260428083207_add_transportation` — MVP (5 tables)
   - `20260428090000_add_transportation_trips` — Trip + TripBoarding
   - `20260429070000_link_route_to_geofence` — Route.geofenceId FK
   - `20260508000000_add_transportation_settings_and_api_tokens` — Phase 4
4. Plans:
   - Original feature plan: `/Users/abdout/.claude/plans/invoke-feature-workflow-to-toasty-crystal.md`
   - Production-readiness sweep: `/Users/abdout/.claude/plans/read-transportation-feature-to-elegant-walrus.md`

## Key Decisions

- **Driver = own model**, not a `StaffMember` flag. Carries `licenseExpiry`, license class, contractor flag. Bridges to StaffMember via optional `staffMemberId`, and to User via optional `userId` for driver portal access.
- **Route.monthlyFee owns the source of truth.** Finance reads via `previewTransportFees()`. We do NOT auto-create `FeeRecord` rows from this block — that belongs to finance's own provisioning flow.
- **Trip.scheduledTime is denormalized** from `Route.departureTime` at scheduling time so editing the route later doesn't rewrite history.
- **`startTrip` auto-populates TripBoardings** with status=PENDING for every active assignment on the route. Drivers/staff then mark BOARDED/ALIGHTED/MISSED per stop via `recordBoarding`.
- **Stop reorder uses two-phase update** (negative offset → final order) to avoid hitting the `@@unique([schoolId, routeId, stopOrder])` constraint mid-transaction. See `actions/stops.ts:reorderStops`.
- **Trip lifecycle is state-machine guarded**: `startTrip` requires SCHEDULED, `finishTrip` requires IN_PROGRESS, `cancelTrip` requires SCHEDULED|IN_PROGRESS, `recordBoarding` requires IN_PROGRESS. Returns `TRIP_INVALID_STATE` on violation.
- **Geofence integration is opt-in**: `Route.geofenceId` is nullable. When set, `recordBoardingFromGeofence(studentId, geofenceId, eventType)` bridges existing `GeoFence`/`GeoAttendanceEvent` ENTER/EXIT events into TripBoarding rows. Available via UI form (route schema includes `geofenceId`) and via `/api/transportation/geofence-boarding` webhook for service accounts.
- **Service-account webhook**: `POST /api/transportation/geofence-boarding` accepts a Bearer token from `school_api_tokens` (bcrypt-hashed; plaintext shape is `<8-char-prefix>.<32-hex-secret>`). Token's `schoolId` IS the tenant — never read from request body. Rate limit: 120/min/IP.
- **Trip-event notifications honor school's preferredLanguage** — guardian notifications render in `en` or `ar` based on `school.preferredLanguage`. Per-event opt-out flags in `TransportationSettings`.
- **Settings model is one-row-per-school** (`@@unique([schoolId])`); `getSettings()` returns defaults if no row exists. `updateSettings()` upserts.

## Danger Zones

- **`Route.geofenceId` cross-block reference** — schema changes to `geo_fences` need a check here. Currently `onDelete: SetNull`.
- **`reorderStops` transaction** — if interrupted mid-transaction, stops can be left with negative `stopOrder` values. Re-running fixes it; the unique constraint stays consistent because the SQL still respects schoolId+routeId scoping.
- **Trip uniqueness:** `@@unique([schoolId, routeId, scheduledDate, direction])` — same route can't be scheduled twice on the same day in the same direction. Server returns `TRIP_DUPLICATE`.
- **Active assignment uniqueness:** `@@unique([schoolId, studentId, routeId, effectiveFrom])` — allows historical re-assignments on the same route, but `assignStudentToRoute` adds an extra check that rejects new active assignments while one already exists.
- **API token plaintext is ephemeral** — only returned ONCE at issuance (seed prints it to console). Lost token = revoke + re-mint. Never log the full plaintext, only `tokenPrefix` for forensics.
- **Geofence webhook schoolId injection** — the API route MUST take schoolId from the resolved token, NOT from the request body. The current code does this correctly; preserve in any refactor.

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
3. `pnpm vitest run src/components/school-dashboard/transportation` — keeps 67/67 green
4. Test: `admin@databayt.org` (pw: 1234) on `demo.localhost:3000` → `/en/transportation`
5. **Before applying any DB changes:** create a Neon branch via `mcp__Neon__create_branch`, test on the branch first, then promote
