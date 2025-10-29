/*
  Admission Module Seed - Complete Admission Management

  This module seeds all admission-related data for a complete demo:
  - Admission campaigns (3: OPEN, CLOSED, COMPLETED)
  - Student applications (100+) across all statuses
  - Communications (acceptance letters, interview invitations, etc.)
*/

import { PrismaClient, AdmissionStatus, AdmissionApplicationStatus, CommunicationType, CommunicationStatus, Gender } from "@prisma/client";
import { faker } from "@faker-js/faker";

type AdmissionSeedData = {
  school: { id: string; name: string };
  users: Array<{ id: string; email: string }>;
};

const MALE_FIRST_NAMES = [
  "Ahmed", "Mohamed", "Osman", "Ibrahim", "Khalid", "Hassan", "Ali", "Omar",
  "Abdullah", "Mustafa", "Kamal", "Tariq", "Yousif", "Salih", "Malik", "Bashir",
];

const FEMALE_FIRST_NAMES = [
  "Fatima", "Aisha", "Mariam", "Amina", "Khadija", "Huda", "Sara", "Layla",
  "Sumaya", "Rania", "Noura", "Zahra", "Samira", "Hana", "Dalal", "Nawal",
];

const SURNAMES = [
  "Hassan", "Ali", "Ahmed", "Mohamed", "Ibrahim", "Osman", "Yousif", "Salih",
  "Abdalla", "Mustafa", "Khalid", "Omar", "Abdelrahman", "Kamal", "Malik",
];

function getRandomName(gender: Gender): { firstName: string; middleName: string; lastName: string } {
  const firstNames = gender === Gender.MALE ? MALE_FIRST_NAMES : FEMALE_FIRST_NAMES;
  return {
    firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
    middleName: firstNames[Math.floor(Math.random() * firstNames.length)],
    lastName: SURNAMES[Math.floor(Math.random() * SURNAMES.length)],
  };
}

export async function seedAdmissionModule(prisma: PrismaClient, data: AdmissionSeedData) {
  console.log("\n🎓 Seeding Admission Module...");

  const { school, users } = data;
  const adminUser = users.find(u => u.email.includes("admin"));

  if (!adminUser) {
    console.log("⚠️  Admin user not found, skipping admission seed");
    return;
  }

  // ===== 1. ADMISSION CAMPAIGNS =====
  console.log("  📢 Creating admission campaigns...");

  // Campaign 1: Completed (previous year)
  const campaignCompleted = await prisma.admissionCampaign.upsert({
    where: {
      schoolId_name: {
        schoolId: school.id,
        name: "Admissions 2024-2025",
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      name: "Admissions 2024-2025",
      academicYear: "2024-2025",
      startDate: new Date("2024-01-01T00:00:00Z"),
      endDate: new Date("2024-05-31T23:59:59Z"),
      status: AdmissionStatus.COMPLETED,
      description: "Admissions for Academic Year 2024-2025",
      eligibilityCriteria: {
        minAge: 6,
        maxAge: 18,
        minimumPercentage: 60,
      },
      requiredDocuments: [
        "Birth Certificate",
        "Previous School Certificate",
        "Transfer Certificate",
        "Passport Size Photo",
        "Identity Proof",
      ],
      applicationFee: 500,
      totalSeats: 300,
      reservedSeats: {
        General: 150,
        OBC: 81,
        SC: 45,
        ST: 24,
      },
    },
  });

  // Campaign 2: Closed (current year - processing)
  const campaignClosed = await prisma.admissionCampaign.upsert({
    where: {
      schoolId_name: {
        schoolId: school.id,
        name: "Admissions 2025-2026",
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      name: "Admissions 2025-2026",
      academicYear: "2025-2026",
      startDate: new Date("2025-01-01T00:00:00Z"),
      endDate: new Date("2025-05-31T23:59:59Z"),
      status: AdmissionStatus.CLOSED,
      description: "Admissions for Academic Year 2025-2026",
      eligibilityCriteria: {
        minAge: 6,
        maxAge: 18,
        minimumPercentage: 65,
      },
      requiredDocuments: [
        "Birth Certificate",
        "Previous School Certificate",
        "Transfer Certificate",
        "Passport Size Photo",
        "Identity Proof",
        "Medical Certificate",
      ],
      applicationFee: 500,
      totalSeats: 350,
      reservedSeats: {
        General: 175,
        OBC: 95,
        SC: 53,
        ST: 27,
      },
    },
  });

  // Campaign 3: Open (upcoming year)
  const campaignOpen = await prisma.admissionCampaign.upsert({
    where: {
      schoolId_name: {
        schoolId: school.id,
        name: "Admissions 2026-2027",
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      name: "Admissions 2026-2027",
      academicYear: "2026-2027",
      startDate: new Date("2026-01-01T00:00:00Z"),
      endDate: new Date("2026-05-31T23:59:59Z"),
      status: AdmissionStatus.OPEN,
      description: "Admissions for Academic Year 2026-2027",
      eligibilityCriteria: {
        minAge: 6,
        maxAge: 18,
        minimumPercentage: 65,
      },
      requiredDocuments: [
        "Birth Certificate",
        "Previous School Certificate",
        "Transfer Certificate",
        "Passport Size Photo",
        "Identity Proof",
        "Medical Certificate",
      ],
      applicationFee: 550,
      totalSeats: 350,
      reservedSeats: {
        General: 175,
        OBC: 95,
        SC: 53,
        ST: 27,
      },
    },
  });

  console.log("  ✅ Created 3 admission campaigns (COMPLETED, CLOSED, OPEN)");

  // ===== 2. STUDENT APPLICATIONS =====
  console.log("  📝 Creating student applications (100+)...");

  const campaigns = [
    { campaign: campaignCompleted, count: 30, baseYear: 2024 },
    { campaign: campaignClosed, count: 50, baseYear: 2025 },
    { campaign: campaignOpen, count: 30, baseYear: 2026 },
  ];

  const applicationStatuses = [
    AdmissionApplicationStatus.SUBMITTED,
    AdmissionApplicationStatus.UNDER_REVIEW,
    AdmissionApplicationStatus.SHORTLISTED,
    AdmissionApplicationStatus.ENTRANCE_SCHEDULED,
    AdmissionApplicationStatus.INTERVIEW_SCHEDULED,
    AdmissionApplicationStatus.SELECTED,
    AdmissionApplicationStatus.WAITLISTED,
    AdmissionApplicationStatus.REJECTED,
    AdmissionApplicationStatus.ADMITTED,
    AdmissionApplicationStatus.WITHDRAWN,
  ];

  const categories = ["General", "OBC", "SC", "ST"];
  const grades = ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];

  let applicationCounter = 0;
  const allApplications = [];

  for (const { campaign, count, baseYear } of campaigns) {
    for (let i = 0; i < count; i++) {
      applicationCounter++;

      const gender = Math.random() > 0.5 ? Gender.MALE : Gender.FEMALE;
      const name = getRandomName(gender);
      const fatherName = getRandomName(Gender.MALE);
      const motherName = getRandomName(Gender.FEMALE);

      const dateOfBirth = faker.date.between({
        from: `${baseYear - 18}-01-01`,
        to: `${baseYear - 6}-12-31`,
      });

      // Determine status based on campaign status
      let status: AdmissionApplicationStatus;
      if (campaign.status === AdmissionStatus.COMPLETED) {
        // Completed campaigns: most are ADMITTED or REJECTED
        status = Math.random() > 0.3
          ? AdmissionApplicationStatus.ADMITTED
          : AdmissionApplicationStatus.REJECTED;
      } else if (campaign.status === AdmissionStatus.CLOSED) {
        // Closed campaigns: various stages of processing
        status = applicationStatuses[Math.floor(Math.random() * applicationStatuses.length)];
      } else {
        // Open campaigns: mostly SUBMITTED or UNDER_REVIEW
        status = Math.random() > 0.5
          ? AdmissionApplicationStatus.SUBMITTED
          : AdmissionApplicationStatus.UNDER_REVIEW;
      }

      const previousMarks = faker.number.float({ min: 60, max: 98, multipleOf: 0.01 });
      const entranceScore = status !== AdmissionApplicationStatus.SUBMITTED && status !== AdmissionApplicationStatus.UNDER_REVIEW
        ? faker.number.float({ min: 50, max: 100, multipleOf: 0.01 })
        : null;
      const interviewScore = ([AdmissionApplicationStatus.INTERVIEW_SCHEDULED, AdmissionApplicationStatus.SELECTED, AdmissionApplicationStatus.ADMITTED] as AdmissionApplicationStatus[]).includes(status)
        ? faker.number.float({ min: 50, max: 100, multipleOf: 0.01 })
        : null;
      const meritScore = entranceScore && interviewScore
        ? (parseFloat(entranceScore.toString()) * 0.6 + parseFloat(interviewScore.toString()) * 0.4)
        : entranceScore
          ? parseFloat(entranceScore.toString())
          : null;

      const isSelected = status === AdmissionApplicationStatus.SELECTED || status === AdmissionApplicationStatus.ADMITTED;
      const isAdmitted = status === AdmissionApplicationStatus.ADMITTED;

      const application = await prisma.application.create({
        data: {
          schoolId: school.id,
          campaignId: campaign.id,
          applicationNumber: `APP-${baseYear}-${String(applicationCounter).padStart(4, "0")}`,

          // Applicant Details
          firstName: name.firstName,
          middleName: name.middleName,
          lastName: name.lastName,
          dateOfBirth,
          gender,
          nationality: "Sudanese",
          religion: "Islam",
          category: categories[Math.floor(Math.random() * categories.length)],

          // Contact Information
          email: `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}${applicationCounter}@demo.org`,
          phone: `+249${faker.string.numeric(9)}`,
          alternatePhone: Math.random() > 0.5 ? `+249${faker.string.numeric(9)}` : null,
          address: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          postalCode: faker.location.zipCode(),
          country: "Sudan",

          // Parent/Guardian Details
          fatherName: `${fatherName.firstName} ${fatherName.lastName}`,
          fatherOccupation: faker.person.jobTitle(),
          fatherPhone: `+249${faker.string.numeric(9)}`,
          fatherEmail: `${fatherName.firstName.toLowerCase()}.${fatherName.lastName.toLowerCase()}@demo.org`,
          motherName: `${motherName.firstName} ${motherName.lastName}`,
          motherOccupation: faker.person.jobTitle(),
          motherPhone: `+249${faker.string.numeric(9)}`,
          motherEmail: `${motherName.firstName.toLowerCase()}.${motherName.lastName.toLowerCase()}@demo.org`,

          // Academic Details
          previousSchool: faker.company.name() + " School",
          previousClass: grades[Math.floor(Math.random() * grades.length)],
          previousMarks,
          previousPercentage: previousMarks,
          achievements: Math.random() > 0.6 ? "School topper, Sports champion" : null,

          // Application Details
          applyingForClass: grades[Math.floor(Math.random() * grades.length)],
          preferredStream: Math.random() > 0.5 ? "Science" : "Commerce",
          secondLanguage: "Arabic",
          thirdLanguage: Math.random() > 0.5 ? "French" : "German",

          // Documents
          documents: [
            { name: "Birth Certificate", url: "/uploads/birth_cert.pdf" },
            { name: "Previous School Certificate", url: "/uploads/school_cert.pdf" },
            { name: "Photo", url: "/uploads/photo.jpg" },
          ],
          photoUrl: "/uploads/applicant_photo.jpg",
          signatureUrl: "/uploads/applicant_signature.png",

          // Status Tracking
          status,
          submittedAt: faker.date.between({ from: campaign.startDate, to: new Date() }),
          reviewedAt: status !== AdmissionApplicationStatus.SUBMITTED ? faker.date.between({ from: campaign.startDate, to: new Date() }) : null,
          reviewedBy: status !== AdmissionApplicationStatus.SUBMITTED ? adminUser.id : null,
          reviewNotes: status === AdmissionApplicationStatus.REJECTED ? "Does not meet minimum criteria" : null,

          // Merit & Selection
          entranceScore,
          interviewScore,
          meritScore,
          meritRank: isSelected ? faker.number.int({ min: 1, max: 300 }) : null,
          waitlistNumber: status === AdmissionApplicationStatus.WAITLISTED ? faker.number.int({ min: 1, max: 50 }) : null,

          // Admission Details
          admissionOffered: isSelected,
          offerDate: isSelected ? faker.date.between({ from: campaign.startDate, to: new Date() }) : null,
          offerExpiryDate: isSelected ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
          admissionConfirmed: isAdmitted,
          confirmationDate: isAdmitted ? faker.date.between({ from: campaign.startDate, to: new Date() }) : null,
          enrollmentNumber: isAdmitted ? `ENR-${baseYear}-${String(applicationCounter).padStart(4, "0")}` : null,

          // Payment
          applicationFeePaid: true,
          paymentId: `PAY-${baseYear}-${faker.string.alphanumeric(8).toUpperCase()}`,
          paymentDate: faker.date.between({ from: campaign.startDate, to: new Date() }),
        },
      });

      allApplications.push({ ...application, status });
    }
  }

  console.log(`  ✅ Created ${allApplications.length} student applications across all campaigns`);

  // ===== 3. COMMUNICATIONS =====
  console.log("  ✉️  Creating communications with applicants...");

  const communicationTemplates = {
    [AdmissionApplicationStatus.SUBMITTED]: {
      type: CommunicationType.EMAIL,
      subject: "Application Received",
      message: "Dear {name}, Thank you for submitting your application. Your application number is {appNumber}. We will review your application and get back to you soon.",
    },
    [AdmissionApplicationStatus.UNDER_REVIEW]: {
      type: CommunicationType.EMAIL,
      subject: "Application Under Review",
      message: "Dear {name}, Your application (#{appNumber}) is currently under review. We will notify you of the next steps shortly.",
    },
    [AdmissionApplicationStatus.SHORTLISTED]: {
      type: CommunicationType.EMAIL,
      subject: "Application Shortlisted",
      message: "Congratulations {name}! Your application (#{appNumber}) has been shortlisted. You will receive further instructions for the entrance examination.",
    },
    [AdmissionApplicationStatus.ENTRANCE_SCHEDULED]: {
      type: CommunicationType.EMAIL,
      subject: "Entrance Examination Schedule",
      message: "Dear {name}, Your entrance examination for application #{appNumber} is scheduled for [DATE]. Please arrive 30 minutes early with your application acknowledgment.",
    },
    [AdmissionApplicationStatus.INTERVIEW_SCHEDULED]: {
      type: CommunicationType.EMAIL,
      subject: "Interview Invitation",
      message: "Congratulations {name}! Based on your entrance examination performance, you have been selected for an interview. Interview date: [DATE].",
    },
    [AdmissionApplicationStatus.SELECTED]: {
      type: CommunicationType.EMAIL,
      subject: "Admission Offer",
      message: "Congratulations {name}! We are pleased to offer you admission to {school} for the academic year. Application #{appNumber}. Please confirm your admission within 15 days.",
    },
    [AdmissionApplicationStatus.ADMITTED]: {
      type: CommunicationType.EMAIL,
      subject: "Admission Confirmed",
      message: "Dear {name}, Your admission has been confirmed. Your enrollment number is {enrollmentNumber}. Welcome to {school}!",
    },
    [AdmissionApplicationStatus.WAITLISTED]: {
      type: CommunicationType.EMAIL,
      subject: "Application Waitlisted",
      message: "Dear {name}, Your application (#{appNumber}) has been placed on the waitlist. Your waitlist position is {waitlistNumber}. We will notify you if a seat becomes available.",
    },
    [AdmissionApplicationStatus.REJECTED]: {
      type: CommunicationType.EMAIL,
      subject: "Application Status Update",
      message: "Dear {name}, Thank you for your interest in {school}. After careful consideration, we regret to inform you that we are unable to offer you admission at this time. Application #{appNumber}.",
    },
  };

  let communicationCount = 0;
  for (const app of allApplications) {
    // Send communication for all applications (none are drafts)
    const template = communicationTemplates[app.status as keyof typeof communicationTemplates];

      if (template) {
        const message = template.message
          .replace(/{name}/g, app.firstName)
          .replace(/{appNumber}/g, app.applicationNumber)
          .replace(/{school}/g, school.name)
          .replace(/{enrollmentNumber}/g, app.enrollmentNumber || "")
          .replace(/{waitlistNumber}/g, app.waitlistNumber?.toString() || "");

        await prisma.communication.create({
          data: {
            schoolId: school.id,
            applicationId: app.id,
            type: template.type,
            subject: template.subject,
            message,
            sentBy: adminUser.id,
            status: Math.random() > 0.1 ? CommunicationStatus.DELIVERED : CommunicationStatus.SENT,
          },
        });

        communicationCount++;
      }
  }

  console.log(`  ✅ Created ${communicationCount} communications with applicants`);

  console.log("\n✅ Admission Module seeding complete!");
  console.log(`   📊 Summary:`);
  console.log(`      - Admission Campaigns: 3`);
  console.log(`      - Applications: ${allApplications.length}`);
  console.log(`      - Communications: ${communicationCount}`);
  console.log(`      - Status Distribution:`);

  // Count applications by status
  const statusCounts = allApplications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`         ${status}: ${count}`);
  });
}
