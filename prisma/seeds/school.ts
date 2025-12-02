/**
 * School Seed Module
 * Creates the demo school - Comboni School (Full K-12)
 * Based on the renowned Comboni Schools of Sudan (established 1900)
 * Named after Saint Daniel Comboni, first bishop of Central Africa
 */

import type { SeedPrisma, SchoolRef } from "./types";
import { DEMO_SCHOOL } from "./constants";

export async function seedSchool(prisma: SeedPrisma): Promise<SchoolRef> {
  console.log("🏫 Creating مدرسة كمبوني (Comboni School - Full K-12)...");
  console.log("   📜 Heritage: Comboni Schools - Excellence in Sudanese Education since 1900");
  console.log("   📚 Levels: " + DEMO_SCHOOL.levels.join(" → ") + "\n");

  const school = await prisma.school.create({
    data: {
      name: DEMO_SCHOOL.nameEn,  // Comboni School (Full K-12)
      domain: DEMO_SCHOOL.domain,
      email: DEMO_SCHOOL.email,
      website: DEMO_SCHOOL.website,
      timezone: DEMO_SCHOOL.timezone,
      planType: DEMO_SCHOOL.planType,
      maxStudents: DEMO_SCHOOL.maxStudents,
      maxTeachers: DEMO_SCHOOL.maxTeachers,
    },
  });

  // Create school branding - Comboni School colors
  // Blue (#1E3A8A - representing knowledge and faith)
  // Gold (#D4AF37 - representing excellence and achievement)
  await prisma.schoolBranding.create({
    data: {
      schoolId: school.id,
      primaryColor: "#1E3A8A",    // Comboni blue (knowledge & faith)
      secondaryColor: "#D4AF37",  // Gold (excellence)
      borderRadius: "md",
      shadow: "lg",
      isPubliclyListed: true,
      allowSelfEnrollment: true,
      requireParentApproval: true,
      informationSharing: "full-sharing",
    },
  });

  console.log(`   ✅ Created: ${DEMO_SCHOOL.nameEn}`);
  console.log(`   📍 Location: ${DEMO_SCHOOL.address}, ${DEMO_SCHOOL.city}, ${DEMO_SCHOOL.state}`);
  console.log(`   📞 Phone: ${DEMO_SCHOOL.phone}`);
  console.log(`   🎓 Motto: ${DEMO_SCHOOL.motto} (${DEMO_SCHOOL.mottoEn})`);
  console.log(`   🏛️ Type: ${DEMO_SCHOOL.schoolType}\n`);

  return {
    id: school.id,
    name: school.name,
    domain: school.domain,
  };
}
