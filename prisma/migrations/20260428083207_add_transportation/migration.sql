
-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'RETIRED');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('BUS', 'VAN', 'CAR', 'MINIBUS');

-- CreateEnum
CREATE TYPE "RouteStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RouteDirection" AS ENUM ('PICKUP', 'DROPOFF', 'ROUND_TRIP');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ENDED');

-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "transportation_vehicles" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "make" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "capacity" INTEGER NOT NULL,
    "vehicleType" "VehicleType" NOT NULL DEFAULT 'BUS',
    "status" "VehicleStatus" NOT NULL DEFAULT 'ACTIVE',
    "registrationExpiry" TIMESTAMP(3),
    "insuranceExpiry" TIMESTAMP(3),
    "lastInspection" TIMESTAMP(3),
    "notes" TEXT,
    "lang" TEXT NOT NULL DEFAULT 'ar',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "transportation_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transportation_drivers" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "licenseNumber" TEXT NOT NULL,
    "licenseClass" TEXT,
    "licenseExpiry" TIMESTAMP(3) NOT NULL,
    "status" "DriverStatus" NOT NULL DEFAULT 'ACTIVE',
    "dateOfBirth" TIMESTAMP(3),
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "notes" TEXT,
    "lang" TEXT NOT NULL DEFAULT 'ar',
    "staffMemberId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "transportation_drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transportation_routes" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "direction" "RouteDirection" NOT NULL DEFAULT 'ROUND_TRIP',
    "status" "RouteStatus" NOT NULL DEFAULT 'ACTIVE',
    "originName" TEXT NOT NULL,
    "destinationName" TEXT NOT NULL,
    "departureTime" TEXT NOT NULL,
    "returnTime" TEXT,
    "distanceKm" DECIMAL(8,2),
    "monthlyFee" DECIMAL(10,2),
    "notes" TEXT,
    "lang" TEXT NOT NULL DEFAULT 'ar',
    "vehicleId" TEXT,
    "driverId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "transportation_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transportation_route_stops" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "stopOrder" INTEGER NOT NULL,
    "pickupTime" TEXT,
    "dropoffTime" TEXT,
    "notes" TEXT,
    "lang" TEXT NOT NULL DEFAULT 'ar',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transportation_route_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transportation_route_assignments" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "stopId" TEXT NOT NULL,
    "direction" "RouteDirection" NOT NULL DEFAULT 'ROUND_TRIP',
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "status" "AssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "lang" TEXT NOT NULL DEFAULT 'ar',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "transportation_route_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transportation_vehicles_schoolId_status_idx" ON "transportation_vehicles"("schoolId", "status");

-- CreateIndex
CREATE INDEX "transportation_vehicles_schoolId_vehicleType_idx" ON "transportation_vehicles"("schoolId", "vehicleType");

-- CreateIndex
CREATE INDEX "transportation_vehicles_deletedAt_idx" ON "transportation_vehicles"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "transportation_vehicles_schoolId_plateNumber_key" ON "transportation_vehicles"("schoolId", "plateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "transportation_drivers_staffMemberId_key" ON "transportation_drivers"("staffMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "transportation_drivers_userId_key" ON "transportation_drivers"("userId");

-- CreateIndex
CREATE INDEX "transportation_drivers_schoolId_status_idx" ON "transportation_drivers"("schoolId", "status");

-- CreateIndex
CREATE INDEX "transportation_drivers_schoolId_licenseExpiry_idx" ON "transportation_drivers"("schoolId", "licenseExpiry");

-- CreateIndex
CREATE INDEX "transportation_drivers_deletedAt_idx" ON "transportation_drivers"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "transportation_drivers_schoolId_licenseNumber_key" ON "transportation_drivers"("schoolId", "licenseNumber");

-- CreateIndex
CREATE INDEX "transportation_routes_schoolId_status_idx" ON "transportation_routes"("schoolId", "status");

-- CreateIndex
CREATE INDEX "transportation_routes_schoolId_direction_idx" ON "transportation_routes"("schoolId", "direction");

-- CreateIndex
CREATE INDEX "transportation_routes_deletedAt_idx" ON "transportation_routes"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "transportation_routes_schoolId_name_key" ON "transportation_routes"("schoolId", "name");

-- CreateIndex
CREATE INDEX "transportation_route_stops_schoolId_routeId_idx" ON "transportation_route_stops"("schoolId", "routeId");

-- CreateIndex
CREATE UNIQUE INDEX "transportation_route_stops_schoolId_routeId_stopOrder_key" ON "transportation_route_stops"("schoolId", "routeId", "stopOrder");

-- CreateIndex
CREATE INDEX "transportation_route_assignments_schoolId_studentId_status_idx" ON "transportation_route_assignments"("schoolId", "studentId", "status");

-- CreateIndex
CREATE INDEX "transportation_route_assignments_schoolId_routeId_status_idx" ON "transportation_route_assignments"("schoolId", "routeId", "status");

-- CreateIndex
CREATE INDEX "transportation_route_assignments_schoolId_status_effectiveF_idx" ON "transportation_route_assignments"("schoolId", "status", "effectiveFrom");

-- CreateIndex
CREATE INDEX "transportation_route_assignments_deletedAt_idx" ON "transportation_route_assignments"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "transportation_route_assignments_schoolId_studentId_routeId_key" ON "transportation_route_assignments"("schoolId", "studentId", "routeId", "effectiveFrom");

-- AddForeignKey
ALTER TABLE "transportation_vehicles" ADD CONSTRAINT "transportation_vehicles_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transportation_drivers" ADD CONSTRAINT "transportation_drivers_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transportation_drivers" ADD CONSTRAINT "transportation_drivers_staffMemberId_fkey" FOREIGN KEY ("staffMemberId") REFERENCES "staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transportation_drivers" ADD CONSTRAINT "transportation_drivers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transportation_routes" ADD CONSTRAINT "transportation_routes_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transportation_routes" ADD CONSTRAINT "transportation_routes_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "transportation_vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transportation_routes" ADD CONSTRAINT "transportation_routes_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "transportation_drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transportation_route_stops" ADD CONSTRAINT "transportation_route_stops_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transportation_route_stops" ADD CONSTRAINT "transportation_route_stops_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "transportation_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transportation_route_assignments" ADD CONSTRAINT "transportation_route_assignments_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transportation_route_assignments" ADD CONSTRAINT "transportation_route_assignments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transportation_route_assignments" ADD CONSTRAINT "transportation_route_assignments_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "transportation_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transportation_route_assignments" ADD CONSTRAINT "transportation_route_assignments_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "transportation_route_stops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

