/**
 * Classrooms Seed Module
 * Creates classroom types and rooms
 */

import type { SeedPrisma, ClassroomRef } from "./types";

export async function seedClassrooms(
  prisma: SeedPrisma,
  schoolId: string
): Promise<{ classrooms: ClassroomRef[] }> {
  console.log("🏛️ Creating classrooms...");

  // Classroom types
  const ctClassroom = await prisma.classroomType.create({
    data: { schoolId, name: "Standard Classroom" },
  });
  const ctLab = await prisma.classroomType.create({
    data: { schoolId, name: "Laboratory" },
  });
  const ctComputer = await prisma.classroomType.create({
    data: { schoolId, name: "Computer Lab" },
  });
  const ctLibrary = await prisma.classroomType.create({
    data: { schoolId, name: "Library" },
  });
  const ctArt = await prisma.classroomType.create({
    data: { schoolId, name: "Art Room" },
  });

  const roomSeeds = [
    // Standard Classrooms (30)
    ...Array.from({ length: 30 }, (_, i) => ({
      name: `Room ${101 + i}`,
      typeId: ctClassroom.id,
      capacity: 35,
    })),
    // Labs
    { name: "Physics Lab", typeId: ctLab.id, capacity: 30 },
    { name: "Chemistry Lab", typeId: ctLab.id, capacity: 30 },
    { name: "Biology Lab", typeId: ctLab.id, capacity: 30 },
    // Computer Labs
    { name: "Computer Lab 1", typeId: ctComputer.id, capacity: 40 },
    { name: "Computer Lab 2", typeId: ctComputer.id, capacity: 40 },
    // Others
    { name: "Main Library", typeId: ctLibrary.id, capacity: 100 },
    { name: "Art Studio", typeId: ctArt.id, capacity: 25 },
  ];

  const classrooms: ClassroomRef[] = [];
  for (const r of roomSeeds) {
    const classroom = await prisma.classroom.create({
      data: { schoolId, typeId: r.typeId, roomName: r.name, capacity: r.capacity },
    });
    classrooms.push({ id: classroom.id });
  }

  console.log(`   ✅ Created: ${classrooms.length} classrooms\n`);

  return { classrooms };
}
