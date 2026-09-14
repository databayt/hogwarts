// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// School-wide attendance settings live on the default AttendancePolicy row.
// Shared by the web action (actions/policy.ts) and the mobile API
// (api/mobile/attendance/methods) so both read and write the same row —
// School.enabledModules is the sidebar's module list and must stay a string[].

import { db } from "@/lib/db"

export const DEFAULT_POLICY_NAME = "Default"

export const PICKABLE_METHODS = [
  "MANUAL",
  "QR_CODE",
  "BARCODE",
  "GEOFENCE",
  "KIOSK",
  "BULK_UPLOAD",
  "RFID",
  "NFC",
  "BLUETOOTH",
  "FINGERPRINT",
  "FACE_RECOGNITION",
] as const

export type PickableMethod = (typeof PICKABLE_METHODS)[number]

export const DEFAULT_METHODS: PickableMethod[] = [
  "MANUAL",
  "QR_CODE",
  "BARCODE",
  "GEOFENCE",
  "KIOSK",
  "BULK_UPLOAD",
]

export function isPickableMethod(m: string): m is PickableMethod {
  return (PICKABLE_METHODS as readonly string[]).includes(m)
}

export async function findDefaultPolicy(schoolId: string) {
  return (
    (await db.attendancePolicy.findFirst({
      where: { schoolId, name: DEFAULT_POLICY_NAME, appliesTo: { has: "ALL" } },
    })) ??
    (await db.attendancePolicy.findFirst({
      where: { schoolId, appliesTo: { has: "ALL" } },
      orderBy: { priority: "desc" },
    }))
  )
}

/** Enabled methods for a school, falling back to the defaults. */
export async function readAttendanceMethods(
  schoolId: string
): Promise<PickableMethod[]> {
  const policy = await findDefaultPolicy(schoolId)
  const methods = policy?.methods.filter(isPickableMethod) ?? []
  return methods.length > 0 ? methods : DEFAULT_METHODS
}

/** Replace only the methods on the default policy, creating it if missing. */
export async function writeAttendanceMethods(
  schoolId: string,
  methods: PickableMethod[]
): Promise<void> {
  const existing = await findDefaultPolicy(schoolId)
  if (existing) {
    await db.attendancePolicy.updateMany({
      where: { id: existing.id, schoolId },
      data: { methods },
    })
    return
  }
  await db.attendancePolicy.create({
    data: defaultPolicyCreateData(schoolId, { methods }),
  })
}

export function defaultPolicyCreateData<T extends object>(
  schoolId: string,
  data: T
) {
  return {
    ...data,
    schoolId,
    name: DEFAULT_POLICY_NAME,
    description: "School-wide attendance settings",
    appliesTo: ["ALL"],
    priority: 0,
    // Required Time column; marking flows don't read it yet — a
    // sensible fixed default until per-policy start times get UI.
    startTime: new Date("1970-01-01T07:30:00.000Z"),
  }
}
