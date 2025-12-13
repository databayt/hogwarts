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

// ============================================================================
// EXTENDED ADMISSION SEEDING
// ============================================================================

import { InquiryStatus, SlotType, BookingStatus } from "@prisma/client";

// Inquiry sources and messages
const INQUIRY_SOURCES = ["website", "social_media", "referral", "advertisement", "walk_in"];
const INQUIRY_MESSAGES = {
  en: [
    "I would like to know more about your school's curriculum and admission requirements.",
    "What are the tuition fees for next academic year? Do you offer scholarships?",
    "Can you provide information about extracurricular activities and sports programs?",
    "I am interested in enrolling my child. What documents are required for admission?",
    "What is the teacher-to-student ratio in your classrooms?",
    "Do you offer transportation services? What areas do you cover?",
    "What makes your school different from others in the area?",
    "Is there a waiting list for certain grade levels?",
  ],
  ar: [
    "أرغب في معرفة المزيد عن منهج مدرستكم ومتطلبات القبول.",
    "ما هي الرسوم الدراسية للعام الدراسي القادم؟ هل تقدمون منحاً دراسية؟",
    "هل يمكنكم تقديم معلومات عن الأنشطة اللامنهجية والبرامج الرياضية؟",
    "أرغب في تسجيل طفلي. ما هي الوثائق المطلوبة للقبول؟",
    "ما هي نسبة المعلمين إلى الطلاب في الفصول الدراسية؟",
    "هل تقدمون خدمات النقل؟ ما هي المناطق التي تغطونها؟",
    "ما الذي يميز مدرستكم عن المدارس الأخرى في المنطقة؟",
    "هل توجد قائمة انتظار لمستويات صفية معينة؟",
  ],
};

/**
 * Seeds extended admission data:
 * - 50 inquiries
 * - 20 time slots (tours + interviews)
 * - 30 tour bookings
 */
export async function seedAdmissionExtended(
  prisma: SeedPrisma,
  schoolId: string,
  adminUser: UserRef
): Promise<void> {
  console.log("🔔 Creating extended admission data (inquiries, tours)...");

  // Check existing counts
  const existingInquiries = await prisma.admissionInquiry.count({ where: { schoolId } });
  const existingSlots = await prisma.admissionTimeSlot.count({ where: { schoolId } });
  const existingBookings = await prisma.tourBooking.count({ where: { schoolId } });

  if (existingInquiries >= 30 && existingSlots >= 10) {
    console.log(`   ✅ Extended data already exists (${existingInquiries} inquiries, ${existingSlots} slots), skipping\n`);
    return;
  }

  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const threeMonthsFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  // Get active campaign
  const activeCampaign = await prisma.admissionCampaign.findFirst({
    where: { schoolId, status: AdmissionStatus.OPEN },
  });

  const grades = ["KG1", "KG2", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
                  "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];

  // ============================================
  // 1. Create Inquiries (50)
  // ============================================
  let inquiryCount = 0;

  for (let i = 0; i < 50; i++) {
    const gender = Math.random() > 0.5 ? "M" : "F";
    const parentName = getRandomName(gender, i + 5000);
    const childName = getRandomName(Math.random() > 0.5 ? "M" : "F", i + 6000);
    const useArabic = Math.random() > 0.5;

    // Random status distribution
    const statusRoll = Math.random();
    let status: InquiryStatus;
    if (statusRoll < 0.2) status = InquiryStatus.NEW;
    else if (statusRoll < 0.5) status = InquiryStatus.CONTACTED;
    else if (statusRoll < 0.7) status = InquiryStatus.QUALIFIED;
    else if (statusRoll < 0.85) status = InquiryStatus.CONVERTED;
    else status = InquiryStatus.UNQUALIFIED;

    const email = `inquiry.${parentName.givenNameEn.toLowerCase()}${i}@demo.org`;

    // Check if inquiry exists
    const existingInquiry = await prisma.admissionInquiry.findFirst({
      where: { schoolId, email },
    });

    if (!existingInquiry) {
      const messages = useArabic ? INQUIRY_MESSAGES.ar : INQUIRY_MESSAGES.en;

      await prisma.admissionInquiry.create({
        data: {
          schoolId,
          parentName: `${parentName.givenNameEn} ${parentName.surnameEn}`,
          email,
          phone: `+249-9${faker.string.numeric(8)}`,
          studentName: `${childName.givenNameEn} ${childName.surnameEn}`,
          studentDOB: faker.date.birthdate({ min: 4, max: 18, mode: "age" }),
          interestedGrade: grades[Math.floor(Math.random() * grades.length)],
          source: INQUIRY_SOURCES[Math.floor(Math.random() * INQUIRY_SOURCES.length)],
          message: messages[Math.floor(Math.random() * messages.length)],
          status,
          followUpDate: status === InquiryStatus.NEW || status === InquiryStatus.CONTACTED
            ? new Date(now.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000)
            : null,
          assignedTo: Math.random() > 0.3 ? adminUser.id : null,
          subscribeNewsletter: Math.random() > 0.4,
          createdAt: new Date(
            sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime())
          ),
        },
      });
      inquiryCount++;
    }
  }

  // ============================================
  // 2. Create Time Slots (20)
  // ============================================
  let slotCount = 0;
  const createdSlots: { id: string; type: SlotType }[] = [];

  // Tour slots (10)
  for (let i = 0; i < 10; i++) {
    const slotDate = new Date(now.getTime() + (i * 7 + Math.floor(Math.random() * 3)) * 24 * 60 * 60 * 1000);
    // Normalize to just date
    slotDate.setHours(0, 0, 0, 0);

    const startHour = 9 + Math.floor(Math.random() * 4); // 9am-12pm
    const startTime = new Date(slotDate);
    startTime.setHours(startHour, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(startHour + 1, 30, 0, 0);

    // Check if similar slot exists
    const existingSlot = await prisma.admissionTimeSlot.findFirst({
      where: {
        schoolId,
        slotType: SlotType.TOUR,
        date: slotDate,
      },
    });

    if (!existingSlot) {
      const slot = await prisma.admissionTimeSlot.create({
        data: {
          schoolId,
          campaignId: activeCampaign?.id || null,
          slotType: SlotType.TOUR,
          date: slotDate,
          startTime,
          endTime,
          maxCapacity: 10 + Math.floor(Math.random() * 10),
          currentBookings: 0,
          isActive: true,
          location: "Main Campus - Administration Building",
          conductedBy: adminUser.id,
          notes: "School tour including classrooms, library, sports facilities, and cafeteria.",
        },
      });
      createdSlots.push({ id: slot.id, type: SlotType.TOUR });
      slotCount++;
    }
  }

  // Interview slots (10)
  for (let i = 0; i < 10; i++) {
    const slotDate = new Date(now.getTime() + (i * 5 + Math.floor(Math.random() * 3) + 14) * 24 * 60 * 60 * 1000);
    slotDate.setHours(0, 0, 0, 0);

    const startHour = 10 + Math.floor(Math.random() * 4); // 10am-1pm
    const startTime = new Date(slotDate);
    startTime.setHours(startHour, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(startHour, 30, 0, 0);

    const existingSlot = await prisma.admissionTimeSlot.findFirst({
      where: {
        schoolId,
        slotType: SlotType.INTERVIEW,
        date: slotDate,
      },
    });

    if (!existingSlot) {
      const slot = await prisma.admissionTimeSlot.create({
        data: {
          schoolId,
          campaignId: activeCampaign?.id || null,
          slotType: SlotType.INTERVIEW,
          date: slotDate,
          startTime,
          endTime,
          maxCapacity: 5,
          currentBookings: 0,
          isActive: true,
          location: "Interview Room A",
          conductedBy: adminUser.id,
          notes: "Parent and student interview with admission committee.",
        },
      });
      createdSlots.push({ id: slot.id, type: SlotType.INTERVIEW });
      slotCount++;
    }
  }

  // ============================================
  // 3. Create Tour Bookings (30)
  // ============================================
  let bookingCount = 0;
  const tourSlots = createdSlots.filter(s => s.type === SlotType.TOUR);

  if (tourSlots.length > 0) {
    for (let i = 0; i < 30; i++) {
      const slot = tourSlots[i % tourSlots.length];
      const gender = Math.random() > 0.5 ? "M" : "F";
      const parentName = getRandomName(gender, i + 7000);
      const childName = getRandomName(Math.random() > 0.5 ? "M" : "F", i + 8000);
      const email = `tour.${parentName.givenNameEn.toLowerCase()}${i}@demo.org`;
      const bookingNumber = `TOUR-${String(i + 1).padStart(5, "0")}`;

      // Check if booking exists
      const existingBooking = await prisma.tourBooking.findFirst({
        where: { bookingNumber },
      });

      if (!existingBooking) {
        // Random status
        const statusRoll = Math.random();
        let status: BookingStatus;
        if (statusRoll < 0.6) status = BookingStatus.CONFIRMED;
        else if (statusRoll < 0.75) status = BookingStatus.COMPLETED;
        else if (statusRoll < 0.9) status = BookingStatus.PENDING;
        else status = BookingStatus.CANCELLED;

        await prisma.tourBooking.create({
          data: {
            schoolId,
            slotId: slot.id,
            bookingNumber,
            parentName: `${parentName.givenNameEn} ${parentName.surnameEn}`,
            email,
            phone: `+249-9${faker.string.numeric(8)}`,
            studentName: `${childName.givenNameEn} ${childName.surnameEn}`,
            interestedGrade: grades[Math.floor(Math.random() * grades.length)],
            status,
            attendedAt: status === BookingStatus.COMPLETED ? new Date() : null,
            numberOfAttendees: 1 + Math.floor(Math.random() * 3),
            reminderSent: status === BookingStatus.CONFIRMED || status === BookingStatus.COMPLETED,
            reminderSentAt: status === BookingStatus.CONFIRMED ? new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) : null,
          },
        });
        bookingCount++;

        // Update slot booking count
        await prisma.admissionTimeSlot.update({
          where: { id: slot.id },
          data: { currentBookings: { increment: 1 } },
        });
      }
    }
  }

  console.log(`   ✅ Extended admission data created:`);
  console.log(`      - ${inquiryCount} admission inquiries`);
  console.log(`      - ${slotCount} time slots (tours + interviews)`);
  console.log(`      - ${bookingCount} tour bookings\n`);
}
