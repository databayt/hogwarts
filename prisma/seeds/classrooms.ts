/**
 * Classrooms Seed
 * Creates classrooms and classroom types
 *
 * Phase 2: Academic Structure - Classrooms
 */

import type { PrismaClient } from "@prisma/client"

import { CLASSROOMS } from "./constants"
import type { ClassroomRef } from "./types"
import { logSuccess } from "./utils"

// ============================================================================
// CLASSROOM TYPES SEEDING
// ============================================================================

/**
 * Seed classroom types
 */
async function seedClassroomTypes(
  prisma: PrismaClient,
  schoolId: string
): Promise<Map<string, string>> {
  // Get unique types from classrooms
  const types = [...new Set(CLASSROOMS.map((c) => c.type))]
  const typeMap = new Map<string, string>()

  for (const typeName of types) {
    const classroomType = await prisma.classroomType.upsert({
      where: {
        schoolId_name: {
          schoolId,
          name: typeName,
        },
      },
      update: {},
      create: {
        schoolId,
        name: typeName,
      },
    })
    typeMap.set(typeName, classroomType.id)
  }

  logSuccess("Classroom Types", types.length, types.join(", "))

  return typeMap
}

// ============================================================================
// CLASSROOMS SEEDING
// ============================================================================

/**
 * Seed classrooms (30+ rooms including labs, halls, and sports)
 */
export async function seedClassrooms(
  prisma: PrismaClient,
  schoolId: string
): Promise<ClassroomRef[]> {
  // First seed the classroom types
  const typeMap = await seedClassroomTypes(prisma, schoolId)
  const classrooms: ClassroomRef[] = []

  for (const roomData of CLASSROOMS) {
    const typeId = typeMap.get(roomData.type)
    if (!typeId) {
      console.log(`   ⚠️ Classroom type ${roomData.type} not found`)
      continue
    }

    const classroom = await prisma.classroom.upsert({
      where: {
        schoolId_roomName: {
          schoolId,
          roomName: roomData.name,
        },
      },
      update: {
        capacity: roomData.capacity,
        typeId,
      },
      create: {
        schoolId,
        roomName: roomData.name,
        capacity: roomData.capacity,
        typeId,
      },
    })

    classrooms.push({
      id: classroom.id,
      name: classroom.roomName,
      capacity: classroom.capacity,
    })
  }

  // Count by type
  const typeCounts = CLASSROOMS.reduce(
    (acc, c) => {
      acc[c.type] = (acc[c.type] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const details = Object.entries(typeCounts)
    .map(([type, count]) => `${count} ${type}`)
    .join(", ")

  logSuccess("Classrooms", classrooms.length, details)

  return classrooms
}
