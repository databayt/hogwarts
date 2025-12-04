/**
 * Classrooms Seed Module - Bilingual (AR/EN)
 * Creates classroom types and rooms with bilingual naming
 *
 * Layout for 100-student school:
 * - 2 KG Rooms
 * - 6 Primary Classrooms
 * - 4 Secondary Classrooms
 * - 4 Specialized Rooms (Lab, Computer, Library, Art)
 * - 1 Sports Hall
 */

import type { SeedPrisma, ClassroomRef } from "./types";
import { CLASSROOMS } from "./constants";

// Bilingual classroom types
const CLASSROOM_TYPES = [
  { en: "KG Classroom", ar: "فصل روضة" },
  { en: "Standard Classroom", ar: "فصل دراسي" },
  { en: "Laboratory", ar: "معمل" },
  { en: "Computer Lab", ar: "معمل حاسوب" },
  { en: "Library", ar: "مكتبة" },
  { en: "Art Room", ar: "غرفة فنون" },
  { en: "Sports Hall", ar: "صالة رياضية" },
];

export async function seedClassrooms(
  prisma: SeedPrisma,
  schoolId: string
): Promise<{ classrooms: ClassroomRef[] }> {
  console.log("🏛️ Creating classrooms (17 rooms, Bilingual AR/EN)...");

  // Create classroom types with bilingual names
  const typeMap = new Map<string, string>();

  for (const type of CLASSROOM_TYPES) {
    const classroomType = await prisma.classroomType.create({
      data: {
        schoolId,
        name: type.en, // English for database
      },
    });
    typeMap.set(type.en, classroomType.id);
  }

  console.log(`   ✅ Created: ${CLASSROOM_TYPES.length} classroom types`);

  // Create classrooms from bilingual constants
  const classrooms: ClassroomRef[] = [];

  for (const room of CLASSROOMS) {
    const typeId = typeMap.get(room.typeEn);
    if (!typeId) {
      console.warn(`   ⚠️ Type not found: ${room.typeEn}`);
      continue;
    }

    const classroom = await prisma.classroom.create({
      data: {
        schoolId,
        typeId,
        roomName: room.nameEn, // English for database
        capacity: room.capacity,
      },
    });
    classrooms.push({ id: classroom.id });
  }

  // Count by type
  const kgCount = CLASSROOMS.filter(r => r.typeEn === "KG Classroom").length;
  const standardCount = CLASSROOMS.filter(r => r.typeEn === "Standard Classroom").length;
  const specialCount = CLASSROOMS.filter(r => !["KG Classroom", "Standard Classroom"].includes(r.typeEn)).length;

  console.log(`   ✅ Created: ${classrooms.length} classrooms`);
  console.log(`      - KG Rooms: ${kgCount}`);
  console.log(`      - Standard Classrooms: ${standardCount}`);
  console.log(`      - Specialized: ${specialCount} (Lab, Computer, Library, Art, Sports)\n`);

  return { classrooms };
}
