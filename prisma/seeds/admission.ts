/**
 * Admission Seed Module - Bilingual (AR/EN)
 * Creates admission campaigns, applications, and communications
 */

import { AdmissionStatus, AdmissionApplicationStatus, CommunicationType, CommunicationStatus, Gender } from "@prisma/client";
import { faker } from "@faker-js/faker";
import type { SeedPrisma, UserRef } from "./types";
import { MALE_NAMES, getRandomName } from "./constants";

export async function seedAdmission(
  prisma: SeedPrisma,
  schoolId: string,
  schoolName: string,
  adminUser: UserRef
): Promise<void> {
  console.log("🎓 Creating admission campaigns and applications...");

  let campaignCreatedCount = 0;
  let campaignSkippedCount = 0;

  // Campaign 1: Completed (previous year) - findFirst + create
  let campaignCompleted = await prisma.admissionCampaign.findFirst({
    where: { schoolId, name: "Admissions 2024-2025", academicYear: "2024-2025" },
  });
  if (!campaignCompleted) {
    campaignCompleted = await prisma.admissionCampaign.create({
      data: {
        schoolId,
        name: "Admissions 2024-2025",
        academicYear: "2024-2025",
        startDate: new Date("2024-01-01T00:00:00Z"),
        endDate: new Date("2024-05-31T23:59:59Z"),
        status: AdmissionStatus.COMPLETED,
        description: "Admissions for Academic Year 2024-2025",
        applicationFee: 500,
        totalSeats: 300,
      },
    });
    campaignCreatedCount++;
  } else {
    campaignSkippedCount++;
  }

  // Campaign 2: Closed (current year) - findFirst + create
  let campaignClosed = await prisma.admissionCampaign.findFirst({
    where: { schoolId, name: "Admissions 2025-2026", academicYear: "2025-2026" },
  });
  if (!campaignClosed) {
    campaignClosed = await prisma.admissionCampaign.create({
      data: {
        schoolId,
        name: "Admissions 2025-2026",
        academicYear: "2025-2026",
        startDate: new Date("2025-01-01T00:00:00Z"),
        endDate: new Date("2025-05-31T23:59:59Z"),
        status: AdmissionStatus.CLOSED,
        description: "Admissions for Academic Year 2025-2026",
        applicationFee: 500,
        totalSeats: 350,
      },
    });
    campaignCreatedCount++;
  } else {
    campaignSkippedCount++;
  }

  // Campaign 3: Open (upcoming year) - findFirst + create
  let campaignOpen = await prisma.admissionCampaign.findFirst({
    where: { schoolId, name: "Admissions 2026-2027", academicYear: "2026-2027" },
  });
  if (!campaignOpen) {
    campaignOpen = await prisma.admissionCampaign.create({
      data: {
        schoolId,
        name: "Admissions 2026-2027",
        academicYear: "2026-2027",
        startDate: new Date("2026-01-01T00:00:00Z"),
        endDate: new Date("2026-05-31T23:59:59Z"),
        status: AdmissionStatus.OPEN,
        description: "Admissions for Academic Year 2026-2027",
        applicationFee: 550,
        totalSeats: 350,
      },
    });
    campaignCreatedCount++;
  } else {
    campaignSkippedCount++;
  }

  const campaigns = [
    { campaign: campaignCompleted, count: 30, baseYear: 2024 },
    { campaign: campaignClosed, count: 50, baseYear: 2025 },
    { campaign: campaignOpen, count: 30, baseYear: 2026 },
  ];

  const grades = ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];
  let appCounter = 0;
  let appCreatedCount = 0;
  let appSkippedCount = 0;
  let commCreatedCount = 0;
  const allApplications: { id: string; applicationNumber: string; firstName: string; enrollmentNumber: string | null; waitlistNumber: number | null; status: AdmissionApplicationStatus }[] = [];

  for (const { campaign, count, baseYear } of campaigns) {
    for (let i = 0; i < count; i++) {
      appCounter++;

      const applicationNumber = `APP-${baseYear}-${String(appCounter).padStart(4, "0")}`;

      // Check if application already exists
      const existingApp = await prisma.application.findFirst({
        where: { schoolId, applicationNumber },
      });

      if (existingApp) {
        appSkippedCount++;
        allApplications.push({
          id: existingApp.id,
          applicationNumber: existingApp.applicationNumber,
          firstName: existingApp.firstName,
          enrollmentNumber: existingApp.enrollmentNumber,
          waitlistNumber: null,
          status: existingApp.status,
        });
        continue; // Skip - application already exists
      }

      const gender = Math.random() > 0.5 ? Gender.MALE : Gender.FEMALE;
      const name = getRandomName(gender === Gender.MALE ? "M" : "F", appCounter);
      const fatherName = getRandomName("M", appCounter + 1000);
      const motherName = getRandomName("F", appCounter + 2000);

      const dateOfBirth = faker.date.between({
        from: `${baseYear - 18}-01-01`,
        to: `${baseYear - 6}-12-31`,
      });

      // Status based on campaign
      let status: AdmissionApplicationStatus;
      if (campaign.status === AdmissionStatus.COMPLETED) {
        status = Math.random() > 0.3 ? AdmissionApplicationStatus.ADMITTED : AdmissionApplicationStatus.REJECTED;
      } else if (campaign.status === AdmissionStatus.CLOSED) {
        const statuses = [
          AdmissionApplicationStatus.SUBMITTED,
          AdmissionApplicationStatus.UNDER_REVIEW,
          AdmissionApplicationStatus.SHORTLISTED,
          AdmissionApplicationStatus.SELECTED,
          AdmissionApplicationStatus.WAITLISTED,
          AdmissionApplicationStatus.ADMITTED,
        ];
        status = statuses[Math.floor(Math.random() * statuses.length)];
      } else {
        status = Math.random() > 0.5 ? AdmissionApplicationStatus.SUBMITTED : AdmissionApplicationStatus.UNDER_REVIEW;
      }

      const isAdmitted = status === AdmissionApplicationStatus.ADMITTED;
      const isSelected = status === AdmissionApplicationStatus.SELECTED || isAdmitted;

      // Use English names for database storage (bilingual)
      const middleNameEn = MALE_NAMES.givenEn[appCounter % MALE_NAMES.givenEn.length];

      const application = await prisma.application.create({
        data: {
          schoolId,
          campaignId: campaign.id,
          applicationNumber,
          firstName: name.givenNameEn,
          middleName: middleNameEn,
          lastName: name.surnameEn,
          dateOfBirth,
          gender,
          nationality: "Sudanese",
          email: `${name.givenNameEn.toLowerCase()}.applicant${appCounter}@demo.org`,
          phone: `+249${faker.string.numeric(9)}`,
          address: faker.location.streetAddress(),
          city: faker.location.city(),
          state: "Red Sea",
          postalCode: "11111",
          country: "Sudan",
          fatherName: `${fatherName.givenNameEn} ${fatherName.surnameEn}`,
          fatherPhone: `+249${faker.string.numeric(9)}`,
          motherName: `${motherName.givenNameEn} ${motherName.surnameEn}`,
          motherPhone: `+249${faker.string.numeric(9)}`,
          applyingForClass: grades[Math.floor(Math.random() * grades.length)],
          status,
          submittedAt: faker.date.between({ from: campaign.startDate, to: campaign.endDate }),
          admissionOffered: isSelected,
          admissionConfirmed: isAdmitted,
          enrollmentNumber: isAdmitted ? `ENR-${baseYear}-${String(appCounter).padStart(4, "0")}` : null,
          applicationFeePaid: true,
          paymentDate: faker.date.between({ from: campaign.startDate, to: campaign.endDate }),
        },
      });
      appCreatedCount++;

      allApplications.push({
        id: application.id,
        applicationNumber: application.applicationNumber,
        firstName: application.firstName,
        enrollmentNumber: application.enrollmentNumber,
        waitlistNumber: null,
        status,
      });

      // Communication (using English names for email templates) - findFirst + create
      const commTemplates: Record<AdmissionApplicationStatus, { subject: string; message: string } | null> = {
        [AdmissionApplicationStatus.DRAFT]: null,
        [AdmissionApplicationStatus.SUBMITTED]: { subject: "Application Received", message: `Dear ${name.givenNameEn}, Thank you for your application.` },
        [AdmissionApplicationStatus.UNDER_REVIEW]: { subject: "Application Under Review", message: `Dear ${name.givenNameEn}, Your application is under review.` },
        [AdmissionApplicationStatus.SHORTLISTED]: { subject: "Application Shortlisted", message: `Congratulations ${name.givenNameEn}! You have been shortlisted.` },
        [AdmissionApplicationStatus.SELECTED]: { subject: "Admission Offer", message: `Congratulations ${name.givenNameEn}! We offer you admission.` },
        [AdmissionApplicationStatus.ADMITTED]: { subject: "Admission Confirmed", message: `Dear ${name.givenNameEn}, Your admission is confirmed. Welcome!` },
        [AdmissionApplicationStatus.WAITLISTED]: { subject: "Application Waitlisted", message: `Dear ${name.givenNameEn}, You have been placed on the waitlist.` },
        [AdmissionApplicationStatus.REJECTED]: { subject: "Application Status", message: `Dear ${name.givenNameEn}, We regret to inform you...` },
        [AdmissionApplicationStatus.ENTRANCE_SCHEDULED]: null,
        [AdmissionApplicationStatus.INTERVIEW_SCHEDULED]: null,
        [AdmissionApplicationStatus.WITHDRAWN]: null,
      };

      const template = commTemplates[status];
      if (template) {
        // Check if communication already exists for this application + subject
        const existingComm = await prisma.communication.findFirst({
          where: { schoolId, applicationId: application.id, subject: template.subject },
        });

        if (!existingComm) {
          await prisma.communication.create({
            data: {
              schoolId,
              applicationId: application.id,
              type: CommunicationType.EMAIL,
              subject: template.subject,
              message: template.message,
              sentBy: adminUser.id,
              status: CommunicationStatus.DELIVERED,
            },
          });
          commCreatedCount++;
        }
      }
    }
  }

  const totalCampaigns = campaignCreatedCount + campaignSkippedCount;
  console.log(`   ✅ Created: ${campaignCreatedCount}/${totalCampaigns} campaigns${campaignSkippedCount > 0 ? ` (${campaignSkippedCount} existing)` : ""}`);
  console.log(`   ✅ Created: ${appCreatedCount} applications${appSkippedCount > 0 ? ` (${appSkippedCount} existing skipped)` : ""}`);
  console.log(`   ✅ Created: ${commCreatedCount} communications\n`);
}
