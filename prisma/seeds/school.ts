/**
 * School Seed Module - Bilingual (AR/EN)
 *
 * Creates the Demo School with:
 * - School entity with bilingual name
 * - School branding with colors and settings
 * - Sudanese school configuration
 *
 * Subdomain: demo.databayt.org
 */

import type { SeedPrisma, SchoolRef } from "./types";
import { DEMO_SCHOOL } from "./constants";

export async function seedSchool(prisma: SeedPrisma): Promise<SchoolRef> {
  console.log("🏫 Creating Demo School (Bilingual AR/EN)...");
  console.log("   📍 Subdomain: demo.databayt.org");
  console.log("   🇸🇩 Location: Khartoum, Sudan");
  console.log("");

  // Create school with primary name (using Arabic as stored name)
  // The app will display Arabic or English based on locale
  const school = await prisma.school.create({
    data: {
      // School uses Arabic name as primary (RTL default)
      // App components should check locale and use appropriate display name
      name: DEMO_SCHOOL.nameEn, // Store English for broader compatibility
      domain: DEMO_SCHOOL.domain,
      email: DEMO_SCHOOL.email,
      website: DEMO_SCHOOL.website,
      phoneNumber: DEMO_SCHOOL.phoneEn,
      address: DEMO_SCHOOL.addressEn, // English for database
      timezone: DEMO_SCHOOL.timezone,
      planType: DEMO_SCHOOL.planType,
      maxStudents: DEMO_SCHOOL.maxStudents,
      maxTeachers: DEMO_SCHOOL.maxTeachers,
      isActive: true,
    },
  });

  // Create school branding
  // Databayt colors: Primary Blue (#3B82F6), Secondary Amber (#F59E0B)
  await prisma.schoolBranding.create({
    data: {
      schoolId: school.id,
      // Colors inspired by Sudanese flag (green, white, black, red)
      // with modern educational twist
      primaryColor: "#3B82F6",    // Databayt Blue (knowledge & trust)
      secondaryColor: "#F59E0B",  // Amber (achievement & excellence)
      borderRadius: "md",
      shadow: "lg",
      // Visibility settings
      isPubliclyListed: true,
      allowSelfEnrollment: true,
      requireParentApproval: true,
      informationSharing: "full-sharing",
    },
  });

  // Print bilingual information
  console.log("   ✅ School Created Successfully");
  console.log("");
  console.log("   📋 School Details (Bilingual):");
  console.log("   ┌─────────────────────────────────────────────────────────┐");
  console.log(`   │ Name (EN): ${DEMO_SCHOOL.nameEn.padEnd(43)}│`);
  console.log(`   │ Name (AR): ${DEMO_SCHOOL.nameAr.padEnd(43)}│`);
  console.log("   ├─────────────────────────────────────────────────────────┤");
  console.log(`   │ Domain:    ${DEMO_SCHOOL.domain.padEnd(43)}│`);
  console.log(`   │ URL:       ${DEMO_SCHOOL.website.padEnd(43)}│`);
  console.log("   ├─────────────────────────────────────────────────────────┤");
  console.log(`   │ Email:     ${DEMO_SCHOOL.email.padEnd(43)}│`);
  console.log(`   │ Phone:     ${DEMO_SCHOOL.phoneEn.padEnd(43)}│`);
  console.log("   ├─────────────────────────────────────────────────────────┤");
  console.log(`   │ Address (EN): ${DEMO_SCHOOL.addressEn.padEnd(40)}│`);
  console.log(`   │ Address (AR): ${DEMO_SCHOOL.addressAr.padEnd(40)}│`);
  console.log(`   │ City:      ${DEMO_SCHOOL.cityEn} / ${DEMO_SCHOOL.cityAr}`.padEnd(58) + "│");
  console.log("   ├─────────────────────────────────────────────────────────┤");
  console.log(`   │ Timezone:  ${DEMO_SCHOOL.timezone.padEnd(43)}│`);
  console.log(`   │ Plan:      ${DEMO_SCHOOL.planType.padEnd(43)}│`);
  console.log(`   │ Capacity:  ${DEMO_SCHOOL.maxStudents} students, ${DEMO_SCHOOL.maxTeachers} teachers`.padEnd(54) + "│");
  console.log("   ├─────────────────────────────────────────────────────────┤");
  console.log(`   │ Motto (EN): ${DEMO_SCHOOL.mottoEn.padEnd(42)}│`);
  console.log(`   │ Motto (AR): ${DEMO_SCHOOL.mottoAr.padEnd(42)}│`);
  console.log("   └─────────────────────────────────────────────────────────┘");
  console.log("");
  console.log("   🎓 School Levels (Bilingual):");
  console.log("   ┌─────────────────────────────────────────────────────────┐");
  DEMO_SCHOOL.levelsEn.forEach((en, i) => {
    const ar = DEMO_SCHOOL.levelsAr[i];
    console.log(`   │ ${(i + 1)}. ${en.padEnd(20)} ${ar.padEnd(25)}│`);
  });
  console.log("   └─────────────────────────────────────────────────────────┘");
  console.log("");

  return {
    id: school.id,
    name: school.name,
    domain: school.domain,
  };
}
