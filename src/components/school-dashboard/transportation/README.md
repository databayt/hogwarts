## Transportation — Fleet, Routes, Drivers, Trips, Boarding

### Overview

The Transportation block provides school bus and route management:

- **Fleet** — Vehicles (buses, vans, cars, minibuses) with capacity, registration/insurance/inspection tracking
- **Drivers** — License records, contractor flag, optional bridges to staff member and user account
- **Routes** — Named routes with origin → destination, departure/return times, ordered stops with drag-drop reorder, optional default vehicle and driver, optional monthly fee, optional geofence link
- **Assignments** — Student → Route → Stop with effective-from/to dates and direction (PICKUP/DROPOFF/ROUND_TRIP)
- **Trips** — Daily run instances scheduled per route+date+direction. `start` auto-populates a boarding row per active assignment (PENDING → BOARDED/ALIGHTED/MISSED). Trip events (start/finish/cancel) fire guardian notifications.
- **Reports** — Trip stats (last 30 days), route utilization, driver hours, fee preview

### Capabilities by Role

- **Admin / Developer**: Full management of vehicles, drivers, routes, stops, settings; schedule and cancel trips; view fees
- **Staff**: Manage assignments, schedule trips, record boardings; read-only on fleet/routes/drivers
- **Teacher**: Read class assignments; record boardings (when supervising a trip)
- **Accountant**: View fees only
- **Student**: View own assignment
- **Guardian**: View own children's assignments + trip notifications

### Routes

| Route                                  | Page                                                | Allowed roles                    |
| -------------------------------------- | --------------------------------------------------- | -------------------------------- |
| `/{lang}/transportation`               | Overview (counts + recent + expiring docs)          | DEVELOPER, ADMIN, STAFF          |
| `/{lang}/transportation/vehicles`      | Fleet list + create/edit dialog                     | DEVELOPER, ADMIN, STAFF          |
| `/{lang}/transportation/vehicles/[id]` | Vehicle detail                                      | DEVELOPER, ADMIN, STAFF          |
| `/{lang}/transportation/routes`        | Routes list + create dialog                         | DEVELOPER, ADMIN, STAFF          |
| `/{lang}/transportation/routes/[id]`   | Route detail with drag-drop stop editor             | DEVELOPER, ADMIN, STAFF          |
| `/{lang}/transportation/drivers`       | Drivers list + create/edit dialog                   | DEVELOPER, ADMIN, STAFF          |
| `/{lang}/transportation/assignments`   | Assignments table + create dialog                   | DEVELOPER, ADMIN, STAFF          |
| `/{lang}/transportation/trips`         | Trips list + schedule dialog                        | DEVELOPER, ADMIN, STAFF, TEACHER |
| `/{lang}/transportation/trips/[id]`    | Trip detail + start/finish/cancel + boarding roster | DEVELOPER, ADMIN, STAFF, TEACHER |
| `/{lang}/transportation/reports`       | Reports dashboard                                   | DEVELOPER, ADMIN, STAFF          |
| `/{lang}/transportation/settings`      | Settings (placeholder)                              | DEVELOPER, ADMIN                 |

### File Structure

```
src/components/school-dashboard/transportation/
├── CLAUDE.md, README.md
├── content.tsx                           # Overview (server)
├── authorization.ts                      # 13-action × 8-role RBAC matrix
├── validation.ts                         # Zod factories + raw server schemas
├── empty-state.tsx, loading-skeleton.tsx, error-boundary.tsx
├── shared/types.ts                       # Row shapes for tables
├── actions.ts                            # Barrel export
├── actions/
│   ├── helpers.ts                        # requireContext + revalidate path
│   ├── vehicles.ts                       # CRUD
│   ├── drivers.ts                        # CRUD
│   ├── routes.ts                         # CRUD
│   ├── stops.ts                          # add/update/delete + two-phase reorder
│   ├── assignments.ts                    # assign/end/list + per-student lookup
│   ├── trips.ts                          # schedule/start/finish/cancel + boarding upsert
│   ├── geofence.ts                       # recordBoardingFromGeofence (M2-3 bridge)
│   ├── fees.ts                           # previewTransportFees (read-only)
│   ├── reports.ts                        # utilization / hours / trip stats
│   ├── notifications.ts                  # Internal trip-event guardian notify
│   └── overview.ts                       # getOverviewStats + expiring docs
├── vehicles/{content,vehicles-client,detail-content}.tsx
├── routes/{content,routes-client,detail-content,stop-editor}.tsx
├── drivers/{content,drivers-client}.tsx
├── assignments/{content,assignments-client}.tsx
├── trips/{content,trips-client,detail-content,trip-boarding-controls}.tsx
├── reports/content.tsx
├── settings/content.tsx
└── __tests__/{authorization,validation,multi-tenant}.test.ts
```

### Database Models

`prisma/models/transportation.prisma`:

- `Vehicle` (fleet inventory) — `transportation_vehicles`
- `Driver` (license + bridges) — `transportation_drivers`
- `Route` — `transportation_routes` (M2-3: `geofenceId` FK)
- `RouteStop` — `transportation_route_stops`
- `RouteAssignment` (Student ↔ Route ↔ Stop) — `transportation_route_assignments`
- `Trip` (M2) — `transportation_trips`
- `TripBoarding` (M2) — `transportation_trip_boardings`

8 enums: `VehicleStatus`, `VehicleType`, `RouteStatus`, `RouteDirection`, `AssignmentStatus`, `DriverStatus`, `TripStatus`, `BoardingStatus`.

### Migrations

Located in `prisma/migrations/`:

1. `20260428083207_add_transportation/migration.sql` — 5 MVP tables
2. `20260428090000_add_transportation_trips/migration.sql` — Trip + TripBoarding
3. `20260429070000_link_route_to_geofence/migration.sql` — Route.geofenceId FK

All three validated on the `transportation-feature` Neon branch (`br-frosty-wildflower-ad5m6xk4`).

### Integration Points

- **GeoFence** — `Route.geofenceId` links to existing `GeoFence` (where `type=BUS_ROUTE`). When set, geofence ENTER/EXIT events can drive `TripBoarding` writes via `recordBoardingFromGeofence`.
- **Notification** — Trip events (start/finish/cancel) create `Notification` rows for guardians using `type=system_alert` + `metadata.kind=trip_*`. No NotificationType enum migration required.
- **Finance** — `previewTransportFees()` returns per-student monthly totals as canonical input. Finance owns the actual `FeeRecord` creation.
- **Sidebar** — Entry in `src/components/school-dashboard/config.ts`. Icon is a `package` placeholder until `/icon-add bus` registers a real bus icon.

### Tests

`__tests__/`:

- `authorization.test.ts` — 31 tests covering all (role × action) cells in the RBAC matrix
- `validation.test.ts` — 20 tests for vehicle/driver/route/stop/assignment Zod schemas
- `multi-tenant.test.ts` — 5 tests verifying schoolId scoping in `listVehicles` (NOT_AUTHENTICATED, MISSING_SCHOOL, UNAUTHORIZED, DEVELOPER bypass behavior)

Run: `pnpm vitest run src/components/school-dashboard/transportation`. Currently 56/56 green.

### Status

| Phase                     | Status                                                    |
| ------------------------- | --------------------------------------------------------- |
| M1 MVP (5 entities)       | ✅ shipped                                                |
| M2-1 Trips + boarding     | ✅ shipped                                                |
| M2-2 Drag-drop stops      | ✅ shipped                                                |
| M2-3 Geofence link        | ✅ shipped                                                |
| M2-4 Fee preview          | ✅ shipped (read-only)                                    |
| M2-5 Parent notifications | ✅ shipped                                                |
| M2-6 Reports              | ✅ shipped                                                |
| Production migration      | ⏳ pending — apply via Neon promote or replay 3 SQL files |
| `bus` icon                | ⏳ pending `/icon-add bus`                                |
