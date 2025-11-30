/**
 * School Seed Module
 * Creates the demo school
 */

import type { SeedPrisma, SchoolRef } from "./types";
import { DEMO_SCHOOL } from "./constants";

export async function seedSchool(prisma: SeedPrisma): Promise<SchoolRef> {
  console.log("🏫 Creating Demo School...");

  const school = await prisma.school.create({
    data: {
      name: DEMO_SCHOOL.name,
      domain: DEMO_SCHOOL.domain,
      email: DEMO_SCHOOL.email,
      website: DEMO_SCHOOL.website,
      timezone: DEMO_SCHOOL.timezone,
      planType: DEMO_SCHOOL.planType,
      maxStudents: DEMO_SCHOOL.maxStudents,
      maxTeachers: DEMO_SCHOOL.maxTeachers,
    },
  });

  // Create school branding
  await prisma.schoolBranding.create({
    data: {
      schoolId: school.id,
      primaryColor: "#1e40af",
      secondaryColor: "#dc2626",
      borderRadius: "md",
      shadow: "lg",
      isPubliclyListed: true,
      allowSelfEnrollment: true,
      requireParentApproval: true,
      informationSharing: "full-sharing",
    },
  });

  console.log(`   ✅ Created: ${school.name} (${school.domain}.databayt.org)\n`);

  return {
    id: school.id,
    name: school.name,
    domain: school.domain,
  };
}
