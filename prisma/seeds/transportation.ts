// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Phase 17: Transportation
 *
 * Seeds the demo school with realistic transportation data:
 *   - 5 vehicles (mixed types, mixed statuses including one MAINTENANCE)
 *   - 5 drivers (4 ACTIVE + 1 ON_LEAVE; one with license expiring within 30 days)
 *   - 5 routes with linked vehicle + driver
 *   - 4 RouteStops per route (20 total)
 *   - ~150 active RouteAssignments (~15% of seeded students)
 *   - ~50 Trips across 10 working days × 5 routes
 *       60% SCHEDULED (future)
 *       30% COMPLETED (past, with actualStartTime/actualEndTime)
 *       10% CANCELLED (past)
 *   - TripBoardings for COMPLETED trips (90% BOARDED+ALIGHTED, 10% MISSED)
 *   - 1 TransportationSettings row (defaults)
 *   - 1 SchoolApiToken for demo geofence webhook integration (plaintext logged ONCE)
 *
 * Constraints:
 *   - All rows scoped by schoolId, lang="ar"
 *   - Route names unique per school: @@unique([schoolId, name])
 *   - Stops unique per (schoolId, routeId, stopOrder)
 *   - Active assignment unique per (schoolId, studentId, routeId, effectiveFrom)
 *   - Trip unique per (schoolId, routeId, scheduledDate, direction)
 *   - Boarding unique per (schoolId, tripId, studentId)
 *   - License expiry is REQUIRED (not nullable)
 *
 * Idempotent: deletes existing transportation rows for the school before inserting.
 */

import { randomBytes } from "crypto"
import type { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

import { NEIGHBORHOODS } from "./constants"
import {
  getWorkingDays,
  logPhase,
  logSuccess,
  randomElement,
  randomNumber,
} from "./utils"

interface StudentRef {
  id: string
}

interface StaffMemberRef {
  id: string
  userId: string | null
  firstName: string
  lastName: string
  position: string | null
}

const VEHICLE_FIXTURES = [
  {
    plateNumber: "BUS-001",
    make: "Toyota",
    model: "Coaster",
    year: 2022,
    capacity: 30,
    vehicleType: "BUS" as const,
    status: "ACTIVE" as const,
    daysToRegistrationExpiry: 365,
    daysToInsuranceExpiry: 200,
  },
  {
    plateNumber: "VAN-002",
    make: "Hyundai",
    model: "H1",
    year: 2021,
    capacity: 12,
    vehicleType: "VAN" as const,
    status: "ACTIVE" as const,
    daysToRegistrationExpiry: 280,
    daysToInsuranceExpiry: 280,
  },
  {
    plateNumber: "MIN-003",
    make: "Mitsubishi",
    model: "Rosa",
    year: 2020,
    capacity: 26,
    vehicleType: "MINIBUS" as const,
    status: "ACTIVE" as const,
    daysToRegistrationExpiry: 90,
    daysToInsuranceExpiry: 120,
  },
  {
    plateNumber: "BUS-004",
    make: "Nissan",
    model: "Civilian",
    year: 2019,
    capacity: 30,
    vehicleType: "BUS" as const,
    status: "MAINTENANCE" as const,
    daysToRegistrationExpiry: 25, // expiring soon — overview widget
    daysToInsuranceExpiry: 60,
  },
  {
    plateNumber: "BUS-005",
    make: "Toyota",
    model: "Hiace",
    year: 2023,
    capacity: 16,
    vehicleType: "MINIBUS" as const,
    status: "ACTIVE" as const,
    daysToRegistrationExpiry: 600,
    daysToInsuranceExpiry: 600,
  },
]

const DRIVER_FIXTURES = [
  {
    firstName: "ياسر",
    lastName: "عمر",
    licenseNumber: "DL-100001",
    licenseClass: "C",
    phone: "+249912345001",
    status: "ACTIVE" as const,
    daysToLicenseExpiry: 720,
  },
  {
    firstName: "محمد",
    lastName: "إبراهيم",
    licenseNumber: "DL-100002",
    licenseClass: "C",
    phone: "+249912345002",
    status: "ACTIVE" as const,
    daysToLicenseExpiry: 540,
  },
  {
    firstName: "أحمد",
    lastName: "حسن",
    licenseNumber: "DL-100003",
    licenseClass: "B",
    phone: "+249912345003",
    status: "ACTIVE" as const,
    daysToLicenseExpiry: 30, // expiring — overview widget
  },
  {
    firstName: "علي",
    lastName: "عثمان",
    licenseNumber: "DL-100004",
    licenseClass: "C",
    phone: "+249912345004",
    status: "ON_LEAVE" as const,
    daysToLicenseExpiry: 365,
  },
  {
    firstName: "حمزة",
    lastName: "محمود",
    licenseNumber: "DL-100005",
    licenseClass: "C",
    phone: "+249912345005",
    status: "ACTIVE" as const,
    daysToLicenseExpiry: 365,
  },
]

const ROUTE_FIXTURES = [
  {
    name: "خط الخرطوم شرق",
    code: "RT-EAST",
    departureTime: "07:00",
    returnTime: "14:00",
    monthlyFee: 2500,
  },
  {
    name: "خط أم درمان",
    code: "RT-OMD",
    departureTime: "06:45",
    returnTime: "14:00",
    monthlyFee: 3000,
  },
  {
    name: "خط بحري شمال",
    code: "RT-NORTH",
    departureTime: "07:15",
    returnTime: "14:00",
    monthlyFee: 2800,
  },
  {
    name: "خط الرياض",
    code: "RT-RIY",
    departureTime: "07:00",
    returnTime: "14:00",
    monthlyFee: 3500,
  },
  {
    name: "خط جبرة",
    code: "RT-JAB",
    departureTime: "07:10",
    returnTime: "14:00",
    monthlyFee: 2000,
  },
]

function daysFromNow(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(":").map(Number)
  const total = h * 60 + m + minutes
  const newH = Math.floor(total / 60) % 24
  const newM = total % 60
  return `${pad2(newH)}:${pad2(newM)}`
}

export async function seedTransportation(
  prisma: PrismaClient,
  schoolId: string,
  students: StudentRef[],
  staffMembers: StaffMemberRef[]
): Promise<void> {
  logPhase(17, "Transportation", "Fleet, drivers, routes, assignments, trips")

  // 1. Clean up existing rows in dependency order
  await prisma.tripBoarding.deleteMany({ where: { schoolId } })
  await prisma.trip.deleteMany({ where: { schoolId } })
  await prisma.routeAssignment.deleteMany({ where: { schoolId } })
  await prisma.routeStop.deleteMany({ where: { schoolId } })
  await prisma.route.deleteMany({ where: { schoolId } })
  await prisma.driver.deleteMany({ where: { schoolId } })
  await prisma.vehicle.deleteMany({ where: { schoolId } })
  await prisma.transportationSettings.deleteMany({ where: { schoolId } })
  await prisma.schoolApiToken.deleteMany({ where: { schoolId } })

  // 2. Vehicles
  const vehicles = []
  for (const f of VEHICLE_FIXTURES) {
    const v = await prisma.vehicle.create({
      data: {
        schoolId,
        plateNumber: f.plateNumber,
        make: f.make,
        model: f.model,
        year: f.year,
        capacity: f.capacity,
        vehicleType: f.vehicleType,
        status: f.status,
        registrationExpiry: daysFromNow(f.daysToRegistrationExpiry),
        insuranceExpiry: daysFromNow(f.daysToInsuranceExpiry),
        lastInspection: daysFromNow(-30),
        lang: "ar",
      },
    })
    vehicles.push(v)
  }
  logSuccess("Created", vehicles.length, "vehicles")

  // 3. Drivers — bridge to staff members where possible
  const drivers = []
  const driverStaff = staffMembers.filter(
    (s) => s.position && /سائق|driver/i.test(s.position)
  )
  for (let i = 0; i < DRIVER_FIXTURES.length; i++) {
    const f = DRIVER_FIXTURES[i]
    const linkedStaff = driverStaff[i] // optional bridge
    const d = await prisma.driver.create({
      data: {
        schoolId,
        firstName: linkedStaff?.firstName ?? f.firstName,
        lastName: linkedStaff?.lastName ?? f.lastName,
        phone: f.phone,
        licenseNumber: f.licenseNumber,
        licenseClass: f.licenseClass,
        licenseExpiry: daysFromNow(f.daysToLicenseExpiry),
        status: f.status,
        staffMemberId: linkedStaff?.id ?? null,
        userId: linkedStaff?.userId ?? null,
        lang: "ar",
      },
    })
    drivers.push(d)
  }
  logSuccess("Created", drivers.length, "drivers")

  // 4. Routes (linked to vehicle + driver)
  const routes = []
  for (let i = 0; i < ROUTE_FIXTURES.length; i++) {
    const f = ROUTE_FIXTURES[i]
    const vehicle = vehicles[i % vehicles.length]
    const driver = drivers[i % drivers.length]
    const origin = NEIGHBORHOODS[i % NEIGHBORHOODS.length].name
    const destination = "المدرسة"
    const r = await prisma.route.create({
      data: {
        schoolId,
        name: f.name,
        code: f.code,
        direction: "ROUND_TRIP",
        status: "ACTIVE",
        originName: origin,
        destinationName: destination,
        departureTime: f.departureTime,
        returnTime: f.returnTime,
        monthlyFee: f.monthlyFee,
        distanceKm: randomNumber(8, 25),
        vehicleId: vehicle.id,
        driverId: driver.id,
        lang: "ar",
      },
    })
    routes.push(r)
  }
  logSuccess("Created", routes.length, "routes")

  // 5. Route stops (4 per route)
  const stopsByRouteId = new Map<string, { id: string; stopOrder: number }[]>()
  for (const route of routes) {
    const stops = []
    for (let order = 1; order <= 4; order++) {
      const neighborhood = NEIGHBORHOODS[(order - 1) % NEIGHBORHOODS.length]
      const pickupTime = addMinutes(route.departureTime, (order - 1) * 5)
      const dropoffTime = route.returnTime
        ? addMinutes(route.returnTime, (4 - order) * 5)
        : null
      const stop = await prisma.routeStop.create({
        data: {
          schoolId,
          routeId: route.id,
          name: `${neighborhood.name} - محطة ${order}`,
          stopOrder: order,
          pickupTime,
          dropoffTime,
          lang: "ar",
        },
      })
      stops.push({ id: stop.id, stopOrder: stop.stopOrder })
    }
    stopsByRouteId.set(route.id, stops)
  }
  const totalStops = Array.from(stopsByRouteId.values()).reduce(
    (n, s) => n + s.length,
    0
  )
  logSuccess("Created", totalStops, "route stops")

  // 6. Route assignments (~15% of students, randomly distributed across routes)
  const assignmentTarget = Math.floor(students.length * 0.15)
  const shuffled = [...students].sort(() => Math.random() - 0.5)
  const assignmentStudents = shuffled.slice(0, assignmentTarget)
  const effectiveFrom = new Date()
  effectiveFrom.setMonth(effectiveFrom.getMonth() - 2) // 2 months ago
  effectiveFrom.setHours(0, 0, 0, 0)

  let assignmentsCreated = 0
  for (const student of assignmentStudents) {
    const route = randomElement(routes)
    const stops = stopsByRouteId.get(route.id) ?? []
    if (stops.length === 0) continue
    const stop = randomElement(stops)
    try {
      await prisma.routeAssignment.create({
        data: {
          schoolId,
          studentId: student.id,
          routeId: route.id,
          stopId: stop.id,
          direction: "ROUND_TRIP",
          effectiveFrom,
          status: "ACTIVE",
          lang: "ar",
        },
      })
      assignmentsCreated += 1
    } catch {
      // Unique-constraint conflict — skip
    }
  }
  logSuccess("Created", assignmentsCreated, "route assignments")

  // 7. Trips — 10 working days × 5 routes
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const past5Start = new Date(today)
  past5Start.setDate(past5Start.getDate() - 14)
  const future5End = new Date(today)
  future5End.setDate(future5End.getDate() + 14)
  const allWorkingDays = getWorkingDays(past5Start, future5End)

  const trips = []
  for (const route of routes) {
    for (const date of allWorkingDays) {
      const dayDelta = Math.floor(
        (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )

      let status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
      let actualStartTime: Date | null = null
      let actualEndTime: Date | null = null

      if (dayDelta < 0) {
        // Past — 75% completed, 10% cancelled, 15% skip-creation
        const r = Math.random()
        if (r < 0.75) {
          status = "COMPLETED"
          actualStartTime = new Date(date)
          actualStartTime.setHours(7, 5, 0, 0)
          actualEndTime = new Date(date)
          actualEndTime.setHours(14, 10, 0, 0)
        } else if (r < 0.85) {
          status = "CANCELLED"
        } else {
          continue
        }
      } else if (dayDelta === 0) {
        // Today — pick first route IN_PROGRESS for demo
        status = route === routes[0] ? "IN_PROGRESS" : "SCHEDULED"
        if (status === "IN_PROGRESS") {
          actualStartTime = new Date(date)
          actualStartTime.setHours(7, 0, 0, 0)
        }
      } else {
        // Future
        status = "SCHEDULED"
      }

      try {
        const trip = await prisma.trip.create({
          data: {
            schoolId,
            routeId: route.id,
            vehicleId: route.vehicleId,
            driverId: route.driverId,
            direction: "ROUND_TRIP",
            scheduledDate: date,
            scheduledTime: route.departureTime,
            actualStartTime,
            actualEndTime,
            status,
            lang: "ar",
          },
        })
        trips.push({ trip, status })
      } catch {
        // Unique-constraint conflict — skip
      }
    }
  }
  logSuccess("Created", trips.length, "trips")

  // 8. Trip boardings for COMPLETED trips
  let boardingsCreated = 0
  for (const { trip, status } of trips) {
    if (status !== "COMPLETED") continue
    const assignmentsForRoute = await prisma.routeAssignment.findMany({
      where: { schoolId, routeId: trip.routeId, status: "ACTIVE" },
      select: { studentId: true, stopId: true },
    })
    for (const a of assignmentsForRoute) {
      const r = Math.random()
      const boardingStatus =
        r < 0.85 ? "ALIGHTED" : r < 0.95 ? "BOARDED" : "MISSED"
      try {
        await prisma.tripBoarding.create({
          data: {
            schoolId,
            tripId: trip.id,
            studentId: a.studentId,
            stopId: a.stopId,
            status: boardingStatus,
            boardedAt:
              boardingStatus !== "MISSED" ? trip.actualStartTime : null,
            alightedAt:
              boardingStatus === "ALIGHTED" ? trip.actualEndTime : null,
            lang: "ar",
          },
        })
        boardingsCreated += 1
      } catch {
        // skip
      }
    }
  }
  logSuccess("Created", boardingsCreated, "trip boardings")

  // 9. Settings row (defaults)
  await prisma.transportationSettings.create({
    data: {
      schoolId,
      defaultPickupBufferMinutes: 10,
      defaultMonthlyFee: 2500,
      notifyGuardiansOnTripStart: true,
      notifyGuardiansOnTripFinish: true,
      notifyGuardiansOnTripCancel: true,
      lateThresholdMinutes: 15,
      lang: "ar",
    },
  })
  logSuccess("Created", 1, "transportation settings row")

  // 10. Demo API token for geofence webhook integration
  // Plaintext: "demo-tx.<32-hex>"
  const secret = randomBytes(16).toString("hex") // 32 chars
  const plaintext = `demo-tx.${secret}`
  const tokenHash = await bcrypt.hash(plaintext, 10)
  const tokenPrefix = plaintext.slice(0, 8)
  await prisma.schoolApiToken.create({
    data: {
      schoolId,
      name: "demo-geofence",
      tokenHash,
      tokenPrefix,
      scopes: ["transportation.geofence_boarding"],
    },
  })
  console.log(
    `🔑 Demo transportation API token (use as Bearer): ${plaintext}\n` +
      `   (Plaintext is ephemeral — not stored anywhere else. Re-seed to regenerate.)`
  )
  logSuccess("Created", 1, "demo API token")
}
