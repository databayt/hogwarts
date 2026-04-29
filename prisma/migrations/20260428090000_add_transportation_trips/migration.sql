-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BoardingStatus" AS ENUM ('PENDING', 'BOARDED', 'ALIGHTED', 'MISSED', 'EXCUSED');

-- CreateTable
CREATE TABLE "transportation_trips" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "driverId" TEXT,
    "direction" "RouteDirection" NOT NULL DEFAULT 'ROUND_TRIP',
    "scheduledDate" DATE NOT NULL,
    "scheduledTime" TEXT NOT NULL,
    "actualStartTime" TIMESTAMP(3),
    "actualEndTime" TIMESTAMP(3),
    "status" "TripStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "lang" TEXT NOT NULL DEFAULT 'ar',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "transportation_trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transportation_trip_boardings" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "stopId" TEXT NOT NULL,
    "boardedAt" TIMESTAMP(3),
    "alightedAt" TIMESTAMP(3),
    "status" "BoardingStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "recordedBy" TEXT,
    "lang" TEXT NOT NULL DEFAULT 'ar',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "transportation_trip_boardings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transportation_trips_schoolId_routeId_scheduledDate_directio_key" ON "transportation_trips"("schoolId", "routeId", "scheduledDate", "direction");
CREATE INDEX "transportation_trips_schoolId_scheduledDate_status_idx" ON "transportation_trips"("schoolId", "scheduledDate", "status");
CREATE INDEX "transportation_trips_schoolId_driverId_scheduledDate_idx" ON "transportation_trips"("schoolId", "driverId", "scheduledDate");
CREATE INDEX "transportation_trips_deletedAt_idx" ON "transportation_trips"("deletedAt");
CREATE UNIQUE INDEX "transportation_trip_boardings_schoolId_tripId_studentId_key" ON "transportation_trip_boardings"("schoolId", "tripId", "studentId");
CREATE INDEX "transportation_trip_boardings_schoolId_studentId_status_idx" ON "transportation_trip_boardings"("schoolId", "studentId", "status");
CREATE INDEX "transportation_trip_boardings_schoolId_tripId_status_idx" ON "transportation_trip_boardings"("schoolId", "tripId", "status");

-- AddForeignKey
ALTER TABLE "transportation_trips" ADD CONSTRAINT "transportation_trips_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transportation_trips" ADD CONSTRAINT "transportation_trips_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "transportation_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transportation_trips" ADD CONSTRAINT "transportation_trips_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "transportation_vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transportation_trips" ADD CONSTRAINT "transportation_trips_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "transportation_drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transportation_trip_boardings" ADD CONSTRAINT "transportation_trip_boardings_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transportation_trip_boardings" ADD CONSTRAINT "transportation_trip_boardings_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "transportation_trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transportation_trip_boardings" ADD CONSTRAINT "transportation_trip_boardings_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transportation_trip_boardings" ADD CONSTRAINT "transportation_trip_boardings_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "transportation_route_stops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
