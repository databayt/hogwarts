/**
 * Announcements Seed Module
 * Creates school announcements
 */

import { AnnouncementScope } from "@prisma/client";
import type { SeedPrisma, ClassRef } from "./types";

export async function seedAnnouncements(
  prisma: SeedPrisma,
  schoolId: string,
  classes: ClassRef[]
): Promise<void> {
  console.log("📢 Creating announcements...");

  const announcements = [
    {
      title: "Welcome to Academic Year 2025-2026",
      body: "We are delighted to welcome all students and parents to the new academic year. Let's make this year successful together!",
      scope: AnnouncementScope.school,
      published: true,
    },
    {
      title: "Mid-Term Exams Schedule Released",
      body: "The mid-term examination schedule has been published. Please check the timetable section for details.",
      scope: AnnouncementScope.school,
      published: true,
    },
    {
      title: "Parent-Teacher Meeting",
      body: "A parent-teacher meeting is scheduled for next week. All parents are requested to attend.",
      scope: AnnouncementScope.school,
      published: true,
    },
    {
      title: "Library New Arrivals",
      body: "The school library has received new books in Science and Literature. Visit the library to explore!",
      scope: AnnouncementScope.school,
      published: true,
    },
    {
      title: "Sports Day Announcement",
      body: "Annual Sports Day will be held next month. All students are encouraged to participate.",
      scope: AnnouncementScope.school,
      published: true,
    },
    {
      title: "Science Fair Registration Open",
      body: "Registration for the annual Science Fair is now open. Submit your projects by the end of the month.",
      scope: AnnouncementScope.school,
      published: true,
    },
    {
      title: "Holiday Notice - Eid Celebration",
      body: "School will remain closed from [date] to [date] for Eid celebrations. Enjoy the holiday!",
      scope: AnnouncementScope.school,
      published: true,
    },
    {
      title: "Class Assignment Due",
      body: "Reminder: Your class assignment is due this Friday. Please submit on time.",
      scope: AnnouncementScope.class,
      classId: classes[0]?.id,
      published: true,
    },
  ];

  for (const ann of announcements) {
    await prisma.announcement.create({
      data: { schoolId, ...ann },
    });
  }

  console.log(`   ✅ Created: ${announcements.length} announcements\n`);
}
