# Transportation Block

## Context

School transportation: fleet inventory (vehicles), drivers with licenses, named routes with ordered stops, student-route assignments, daily trip runs with boarding records, and reports. Multi-tenant; every model is `schoolId`-scoped. New block — committed on `feat/transportation`, validated on Neon branch `transportation-feature`, production DB not yet migrated.

## Before You Start

1. Read `README.md` here for routes, file structure, and integration points
2. The 7 Prisma models live in `prisma/models/transportation.prisma`
3. 3 migration SQL files in `prisma/migrations/`:
   - `20260428083207_add_transportation` — MVP (5 tables)
   - `20260428090000_add_transportation_trips` — Trip + TripBoarding
   - `20260429070000_link_route_to_geofence` — Route.geofenceId FK
4. Plan + design rationale: `/Users/abdout/.claude/plans/invoke-feature-workflow-to-toasty-crystal.md`

## Key Decisions

- **Driver = own model**, not a `StaffMember` flag. Carries `licenseExpiry`, license class, contractor flag. Bridges to StaffMember via optional `staffMemberId`, and to User via optional `userId` for driver portal access.
- **Route.monthlyFee owns the source of truth.** Finance reads via `previewTransportFees()`. We do NOT auto-create `FeeRecord` rows from this block — that belongs to finance's own provisioning flow.
- **Trip.scheduledTime is denormalized** from `Route.departureTime` at scheduling time so editing the route later doesn't rewrite history.
- **`startTrip` auto-populates TripBoardings** with status=PENDING for every active assignment on the route. Drivers/staff then mark BOARDED/ALIGHTED/MISSED per stop via `recordBoarding`.
- **Stop reorder uses two-phase update** (negative offset → final order) to avoid hitting the `@@unique([schoolId, routeId, stopOrder])` constraint mid-transaction. See `actions/stops.ts:reorderStops`.
- **Geofence integration is opt-in**: `Route.geofenceId` is nullable. When set, `recordBoardingFromGeofence(studentId, geofenceId, eventType)` bridges existing `GeoFence`/`GeoAttendanceEvent` ENTER/EXIT events into TripBoarding rows.
- **Trip-event notifications are best-effort.** `notifyGuardiansOfTripEvent` is fire-and-forget (`void`) — failure never blocks trip lifecycle. Uses existing `Notification` model with `type=system_alert` + `metadata.kind` (no NotificationType enum migration).

## Danger Zones

- **`Route.geofenceId` cross-block reference** — schema changes to `geo_fences` need a check here. Currently `onDelete: SetNull`.
- **`reorderStops` transaction** — if interrupted mid-transaction, stops can be left with negative `stopOrder` values. Re-running fixes it; the unique constraint stays consistent because the SQL still respects schoolId+routeId scoping.
- **Trip uniqueness:** `@@unique([schoolId, routeId, scheduledDate, direction])` — same route can't be scheduled twice on the same day in the same direction. Server returns `TRIP_DUPLICATE`.
- **Active assignment uniqueness:** `@@unique([schoolId, studentId, routeId, effectiveFrom])` — allows historical re-assignments on the same route, but `assignStudentToRoute` adds an extra check that rejects new active assignments while one already exists.
- **Notification helper has cross-tenant guardian lookups** — careful: `db.studentGuardian` query must include `schoolId` in `where` (it does).
- **Sidebar icon is a placeholder.** `config.ts` uses `icon: "package"`. Switch to `icon: "bus"` after `/icon-add bus` registers a proper icon.

## Related Blocks

- [Geo-Attendance](../../../prisma/models/geo-attendance.prisma) — `Route.geofenceId` references `GeoFence` (M2-3)
- [Notifications](../notifications/CLAUDE.md) — trip events fire `system_alert` notifications with `metadata.kind = trip_*`
- [Finance Fees](../finance/) — `previewTransportFees()` is the canonical input for fee provisioning. No direct `FeeRecord` writes from here.
- [Students](../listings/students/) — `Student.routeAssignments` and `Student.tripBoardings` back-relations
- [Staff Members](../listings/staff/) — `StaffMember.driverProfile` optional bridge for in-house drivers

## After You Finish

1. Update `README.md` — if routes or file structure changed
2. Run `pnpm tsc --noEmit` to verify no regressions
3. `pnpm vitest run src/components/school-dashboard/transportation` — keeps 56/56 green
4. Test: `admin@databayt.org` (pw: 1234) on `demo.localhost:3000` → `/en/transportation`
5. **Before applying any DB changes:** create a Neon branch via `mcp__Neon__create_branch`, test on the branch first, then promote
