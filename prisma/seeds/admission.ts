/**
 * Admission Seed Module
 * Creates admission campaigns, applications, and communications
 */

import { AdmissionStatus, AdmissionApplicationStatus, CommunicationType, CommunicationStatus, Gender } from "@prisma/client";
import { faker } from "@faker-js/faker";
import type { SeedPrisma, UserRef } from "./types";
import { MALE_NAMES, FEMALE_NAMES, SURNAMES, getRandomName } from "./constants";

export async function seedAdmission(
  prisma: SeedPrisma,
  schoolId: string,
  schoolName: string,
  adminUser: UserRef
): Promise<void> {
  console.log("🎓 Creating admission campaigns and applications...");

  // Campaign 1: Completed (previous year)
  const campaignCompleted = await prisma.admissionCampaign.create({
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

  // Campaign 2: Closed (current year)
  const campaignClosed = await prisma.admissionCampaign.create({
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

  // Campaign 3: Open (upcoming year)
  const campaignOpen = await prisma.admissionCampaign.create({
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

  const campaigns = [
    { campaign: campaignCompleted, count: 30, baseYear: 2024 },
    { campaign: campaignClosed, count: 50, baseYear: 2025 },
    { campaign: campaignOpen, count: 30, baseYear: 2026 },
  ];

  const grades = ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];
  let appCounter = 0;
  const allApplications: { id: string; applicationNumber: string; firstName: string; enrollmentNumber: string | null; waitlistNumber: number | null; status: AdmissionApplicationStatus }[] = [];

  for (const { campaign, count, baseYear } of campaigns) {
    for (let i = 0; i < count; i++) {
      appCounter++;

      const gender = Math.random() > 0.5 ? Gender.MALE : Gender.FEMALE;
      const name = getRandomName(gender === Gender.MALE ? "M" : "F");
      const fatherName = getRandomName("M");
      const motherName = getRandomName("F");

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

      const application = await prisma.application.create({
        data: {
          schoolId,
          campaignId: campaign.id,
          applicationNumber: `APP-${baseYear}-${String(appCounter).padStart(4, "0")}`,
          firstName: name.givenName,
          middleName: MALE_NAMES[appCounter % MALE_NAMES.length],
          lastName: name.surname,
          dateOfBirth,
          gender,
          nationality: "Sudanese",
          email: `${name.givenName.toLowerCase()}.applicant${appCounter}@demo.org`,
          phone: `+249${faker.string.numeric(9)}`,
          address: faker.location.streetAddress(),
          city: faker.location.city(),
          state: "Red Sea",
          postalCode: "11111",
          country: "Sudan",
          fatherName: `${fatherName.givenName} ${fatherName.surname}`,
          fatherPhone: `+249${faker.string.numeric(9)}`,
          motherName: `${motherName.givenName} ${motherName.surname}`,
          motherPhone: `+249${faker.string.numeric(9)}`,
          applyingForClass: grades[Math.floor(Math.random() * grades.length)],
          status,
          submittedAt: faker.date.between({ from: campaign.startDate, to: new Date() }),
          admissionOffered: isSelected,
          admissionConfirmed: isAdmitted,
          enrollmentNumber: isAdmitted ? `ENR-${baseYear}-${String(appCounter).padStart(4, "0")}` : null,
          applicationFeePaid: true,
          paymentDate: faker.date.between({ from: campaign.startDate, to: new Date() }),
        },
      });

      allApplications.push({
        id: application.id,
        applicationNumber: application.applicationNumber,
        firstName: application.firstName,
        enrollmentNumber: application.enrollmentNumber,
        waitlistNumber: null,
        status,
      });

      // Communication
      const commTemplates: Record<AdmissionApplicationStatus, { subject: string; message: string } | null> = {
        [AdmissionApplicationStatus.SUBMITTED]: { subject: "Application Received", message: `Dear ${name.givenName}, Thank you for your application.` },
        [AdmissionApplicationStatus.UNDER_REVIEW]: { subject: "Application Under Review", message: `Dear ${name.givenName}, Your application is under review.` },
        [AdmissionApplicationStatus.SHORTLISTED]: { subject: "Application Shortlisted", message: `Congratulations ${name.givenName}! You have been shortlisted.` },
        [AdmissionApplicationStatus.SELECTED]: { subject: "Admission Offer", message: `Congratulations ${name.givenName}! We offer you admission.` },
        [AdmissionApplicationStatus.ADMITTED]: { subject: "Admission Confirmed", message: `Dear ${name.givenName}, Your admission is confirmed. Welcome!` },
        [AdmissionApplicationStatus.WAITLISTED]: { subject: "Application Waitlisted", message: `Dear ${name.givenName}, You have been placed on the waitlist.` },
        [AdmissionApplicationStatus.REJECTED]: { subject: "Application Status", message: `Dear ${name.givenName}, We regret to inform you...` },
        [AdmissionApplicationStatus.ENTRANCE_SCHEDULED]: null,
        [AdmissionApplicationStatus.INTERVIEW_SCHEDULED]: null,
        [AdmissionApplicationStatus.WITHDRAWN]: null,
      };

      const template = commTemplates[status];
      if (template) {
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
      }
    }
  }

  console.log(`   ✅ Created: 3 campaigns, ${allApplications.length} applications\n`);
}
