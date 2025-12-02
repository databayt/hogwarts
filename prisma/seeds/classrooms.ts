/**
 * Classrooms Seed Module - Realistic K-12 School (100 Students)
 * Creates classroom types and rooms with bilingual naming (Arabic/English)
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

export async function seedClassrooms(
  prisma: SeedPrisma,
  schoolId: string
): Promise<{ classrooms: ClassroomRef[] }> {
  console.log("🏛️ Creating classrooms (17 rooms)...");

  // Create classroom types
  const classroomTypes = [
    "KG Classroom",
    "Standard Classroom",
    "Laboratory",
    "Computer Lab",
    "Library",
    "Art Room",
    "Sports Hall",
  ];

  const typeMap = new Map<string, string>();

  for (const typeName of classroomTypes) {
    const type = await prisma.classroomType.create({
      data: {
        schoolId,
        name: typeName,
      },
    });
    typeMap.set(typeName, type.id);
  }

  console.log(`   ✅ Created: ${classroomTypes.length} classroom types`);

  // Create classrooms
  const roomData = [
    // KG Section
    { name: "KG Room 1", type: "KG Classroom", capacity: 20 },
    { name: "KG Room 2", type: "KG Classroom", capacity: 20 },

    // Primary Section (Grades 1-6)
    { name: "Room 101", type: "Standard Classroom", capacity: 25 },
    { name: "Room 102", type: "Standard Classroom", capacity: 25 },
    { name: "Room 103", type: "Standard Classroom", capacity: 25 },
    { name: "Room 104", type: "Standard Classroom", capacity: 25 },
    { name: "Room 105", type: "Standard Classroom", capacity: 25 },
    { name: "Room 106", type: "Standard Classroom", capacity: 25 },

    // Intermediate & Secondary Section (Grades 7-12)
    { name: "Room 201", type: "Standard Classroom", capacity: 30 },
    { name: "Room 202", type: "Standard Classroom", capacity: 30 },
    { name: "Room 203", type: "Standard Classroom", capacity: 30 },
    { name: "Room 204", type: "Standard Classroom", capacity: 30 },

    // Specialized Rooms
    { name: "Science Lab", type: "Laboratory", capacity: 25 },
    { name: "Computer Lab", type: "Computer Lab", capacity: 25 },
    { name: "Main Library", type: "Library", capacity: 40 },
    { name: "Art Studio", type: "Art Room", capacity: 20 },
    { name: "Sports Hall", type: "Sports Hall", capacity: 100 },
  ];

  const classrooms: ClassroomRef[] = [];

  for (const r of roomData) {
    const typeId = typeMap.get(r.type);
    if (!typeId) {
      console.warn(`   ⚠️ Type not found: ${r.type}`);
      continue;
    }

    const classroom = await prisma.classroom.create({
      data: {
        schoolId,
        typeId,
        roomName: r.name,
        capacity: r.capacity,
      },
    });
    classrooms.push({ id: classroom.id });
  }

  console.log(`   ✅ Created: ${classrooms.length} classrooms`);
  console.log(`      - KG Rooms: 2`);
  console.log(`      - Primary Classrooms: 6`);
  console.log(`      - Secondary Classrooms: 4`);
  console.log(`      - Specialized: 5 (Lab, Computer, Library, Art, Sports)\n`);

  return { classrooms };
}
