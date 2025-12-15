/**
 * Classrooms Seed Module - Bilingual (AR/EN)
 * Creates classroom types and rooms with bilingual naming
 *
 * Layout for K-12 school (55 rooms):
 * - 4 KG Rooms
 * - 18 Primary Classrooms (Grades 1-6)
 * - 18 Secondary Classrooms (Grades 7-12)
 * - 5 Science Labs (Physics, Chemistry, Biology)
 * - 3 Computer Labs
 * - 4 Arts & Special Rooms (Music, Art, Activity Hall)
 * - 2 Library Rooms (Main, Reading Room)
 * - 3 Sports Facilities (Hall, Fitness, Field)
 * - 5 Admin Offices
 * - 3 Teacher Workrooms
 * - 4 Support Facilities (Clinic, Cafeteria, Meeting, Assembly)
 */

import { CLASSROOMS } from "./constants"
import type { ClassroomRef, SeedPrisma } from "./types"

// Bilingual classroom types - all types used in constants.ts
const CLASSROOM_TYPES = [
  // Academic Spaces
  { en: "KG Classroom", ar: "فصل روضة" },
  { en: "Standard Classroom", ar: "فصل دراسي" },
  { en: "Laboratory", ar: "معمل" },
  { en: "Computer Lab", ar: "معمل حاسوب" },
  // Resource & Learning
  { en: "Library", ar: "مكتبة" },
  { en: "Reading Room", ar: "غرفة مطالعة" },
  { en: "Resource Room", ar: "غرفة موارد" },
  // Arts & Activities
  { en: "Art Room", ar: "غرفة فنون" },
  { en: "Music Room", ar: "غرفة موسيقى" },
  { en: "Activity Hall", ar: "قاعة أنشطة" },
  // Sports & Fitness
  { en: "Sports Hall", ar: "صالة رياضية" },
  { en: "Fitness Room", ar: "غرفة لياقة" },
  { en: "Sports Field", ar: "ملعب" },
  // Administrative
  { en: "Administrative Office", ar: "مكتب إداري" },
  { en: "Staff Room", ar: "غرفة معلمين" },
  { en: "Meeting Room", ar: "غرفة اجتماعات" },
  // Support Facilities
  { en: "Clinic", ar: "عيادة" },
  { en: "Cafeteria", ar: "كافتيريا" },
  { en: "Assembly Hall", ar: "قاعة تجمعات" },
]

export async function seedClassrooms(
  prisma: SeedPrisma,
  schoolId: string
): Promise<{ classrooms: ClassroomRef[] }> {
  console.log("🏛️ Creating classrooms (55 rooms, Bilingual AR/EN)...")

  // Upsert classroom types with bilingual names
  const typeMap = new Map<string, string>()

  for (const type of CLASSROOM_TYPES) {
    const classroomType = await prisma.classroomType.upsert({
      where: { schoolId_name: { schoolId, name: type.en } },
      update: {}, // No updates needed
      create: {
        schoolId,
        name: type.en,
      },
    })
    typeMap.set(type.en, classroomType.id)
  }

  console.log(`   ✅ Created: ${CLASSROOM_TYPES.length} classroom types`)

  // Upsert classrooms from bilingual constants
  const classrooms: ClassroomRef[] = []

  for (const room of CLASSROOMS) {
    const typeId = typeMap.get(room.typeEn)
    if (!typeId) {
      console.warn(`   ⚠️ Type not found: ${room.typeEn}`)
      continue
    }

    const classroom = await prisma.classroom.upsert({
      where: { schoolId_roomName: { schoolId, roomName: room.nameEn } },
      update: {
        typeId,
        capacity: room.capacity,
      },
      create: {
        schoolId,
        typeId,
        roomName: room.nameEn,
        capacity: room.capacity,
      },
    })
    classrooms.push({ id: classroom.id })
  }

  // Count by type category
  const kgCount = CLASSROOMS.filter((r) => r.typeEn === "KG Classroom").length
  const standardCount = CLASSROOMS.filter(
    (r) => r.typeEn === "Standard Classroom"
  ).length
  const labCount = CLASSROOMS.filter((r) =>
    ["Laboratory", "Computer Lab"].includes(r.typeEn)
  ).length
  const artsCount = CLASSROOMS.filter((r) =>
    ["Art Room", "Music Room", "Activity Hall"].includes(r.typeEn)
  ).length
  const libraryCount = CLASSROOMS.filter((r) =>
    ["Library", "Reading Room", "Resource Room"].includes(r.typeEn)
  ).length
  const sportsCount = CLASSROOMS.filter((r) =>
    ["Sports Hall", "Fitness Room", "Sports Field"].includes(r.typeEn)
  ).length
  const adminCount = CLASSROOMS.filter((r) =>
    ["Administrative Office", "Staff Room", "Meeting Room"].includes(r.typeEn)
  ).length
  const supportCount = CLASSROOMS.filter((r) =>
    ["Clinic", "Cafeteria", "Assembly Hall"].includes(r.typeEn)
  ).length

  console.log(`   ✅ Created: ${classrooms.length} classrooms`)
  console.log(`      - KG Rooms: ${kgCount}`)
  console.log(`      - Standard Classrooms: ${standardCount}`)
  console.log(`      - Labs (Science + Computer): ${labCount}`)
  console.log(`      - Arts & Activities: ${artsCount}`)
  console.log(`      - Library & Resources: ${libraryCount}`)
  console.log(`      - Sports Facilities: ${sportsCount}`)
  console.log(`      - Admin & Staff: ${adminCount}`)
  console.log(`      - Support Facilities: ${supportCount}\n`)

  return { classrooms }
}
