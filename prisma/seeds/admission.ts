/**
 * Admission Seed
 * Creates Admission Campaigns, Applications, Inquiries, and Tour Bookings
 *
 * Phase 15: Admission
 *
 * Features:
 * - 1 OPEN campaign for current academic year
 * - 50 applications across all statuses
 * - 20 inquiries from interested families
 * - 15 tour bookings (upcoming + completed)
 * - Communication records
 */

import type { PrismaClient } from "@prisma/client"

import type { UserRef, YearLevelRef } from "./types"
import {
  generatePersonalEmail,
  generatePhone,
  logPhase,
  logSuccess,
  randomElement,
  randomNumber,
} from "./utils"

// ============================================================================
// SAMPLE DATA
// ============================================================================

const FIRST_NAMES_MALE = [
  "Mohammed",
  "Ahmed",
  "Omar",
  "Ibrahim",
  "Youssef",
  "Ali",
  "Hassan",
  "Khalid",
  "Mustafa",
  "Tariq",
  "Hamza",
  "Ziad",
  "Karim",
  "Faisal",
  "Samir",
]

const FIRST_NAMES_FEMALE = [
  "Fatima",
  "Aisha",
  "Maryam",
  "Sara",
  "Huda",
  "Noor",
  "Layla",
  "Amina",
  "Zainab",
  "Rania",
  "Yasmin",
  "Salma",
  "Hana",
  "Dina",
  "Maya",
]

const LAST_NAMES = [
  "Abdullah",
  "Hassan",
  "Ali",
  "Ibrahim",
  "Ahmed",
  "Mohammed",
  "Osman",
  "Salih",
  "Bakri",
  "Nour",
  "Khalil",
  "Omar",
  "Youssef",
  "Mustafa",
  "Adam",
]

const CITIES = ["Khartoum", "Omdurman", "Bahri", "Port Sudan", "Kassala"]

const OCCUPATIONS = [
  "Engineer",
  "Doctor",
  "Teacher",
  "Businessman",
  "Accountant",
  "Lawyer",
  "Manager",
  "Architect",
  "Professor",
  "Consultant",
]

const PREVIOUS_SCHOOLS = [
  "Khartoum International School",
  "Unity High School",
  "Al-Noor Academy",
  "Modern Education Academy",
  "Excellence Primary School",
  "Sunrise International School",
  "Cambridge School Sudan",
  "Green Valley Academy",
]

const INQUIRY_SOURCES = [
  "website",
  "social",
  "referral",
  "advertisement",
  "word_of_mouth",
  "school_fair",
]

const INQUIRY_MESSAGES = [
  "I would like to learn more about admission requirements for my child.",
  "Can you please send me information about your curriculum and fees?",
  "I am interested in enrolling my child for the upcoming academic year.",
  "We recently moved to the area and are looking for a good school.",
  "A friend recommended your school. Can we schedule a visit?",
  "What are the admission deadlines and required documents?",
  "I would like to know about scholarship opportunities.",
  "Can you share details about your extracurricular activities?",
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate application number
 */
function generateApplicationNumber(index: number, year: number): string {
  return `APP-${year}-${String(index + 1).padStart(5, "0")}`
}

/**
 * Generate booking number
 */
function generateBookingNumber(index: number): string {
  return `TBK-${String(index + 1).padStart(5, "0")}`
}

/**
 * Get random date in range
 */
function getDateInRange(daysFromNow: number, daysRange: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow + randomNumber(0, daysRange))
  return date
}

/**
 * Get past date
 */
function getPastDate(daysAgo: number, range: number = 10): Date {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo - randomNumber(0, range))
  return date
}

// ============================================================================
// ADMISSION SETTINGS
// ============================================================================

/**
 * Seed admission settings for the school
 */
export async function seedAdmissionSettings(
  prisma: PrismaClient,
  schoolId: string
): Promise<void> {
  try {
    await prisma.admissionSettings.upsert({
      where: { schoolId },
      update: {},
      create: {
        schoolId,
        allowMultipleApplications: false,
        requireDocuments: true,
        defaultApplicationFee: 500,
        offerExpiryDays: 14,
        enablePublicPortal: true,
        enableInquiryForm: true,
        enableTourBooking: true,
        enableStatusTracker: true,
        autoEmailNotifications: true,
        smsNotifications: false,
        enableOnlinePayment: false,
        academicWeight: 40,
        entranceWeight: 35,
        interviewWeight: 25,
        tourDuration: 60,
        interviewDuration: 30,
        maxToursPerDay: 5,
        tourDaysOfWeek: [0, 1, 2, 3, 4], // Sun-Thu
        documentRequirements: JSON.stringify([
          {
            name: "Birth Certificate",
            required: true,
            description: "Official copy",
          },
          {
            name: "Previous Report Cards",
            required: true,
            description: "Last 2 years",
          },
          { name: "Passport Photo", required: true, description: "Recent 4x6" },
          {
            name: "Transfer Certificate",
            required: false,
            description: "If applicable",
          },
        ]),
      },
    })
  } catch {
    // Settings may already exist
  }
}

// ============================================================================
// ADMISSION CAMPAIGN
// ============================================================================

/**
 * Seed an OPEN admission campaign for the current academic year
 */
export async function seedAdmissionCampaign(
  prisma: PrismaClient,
  schoolId: string
): Promise<string | null> {
  const currentYear = new Date().getFullYear()
  const nextYear = currentYear + 1
  const academicYear = `${currentYear}-${nextYear}`
  const campaignName = `Admission ${academicYear}`

  try {
    const existing = await prisma.admissionCampaign.findFirst({
      where: { schoolId, name: campaignName },
    })

    if (existing) {
      return existing.id
    }

    const campaign = await prisma.admissionCampaign.create({
      data: {
        schoolId,
        name: campaignName,
        academicYear,
        startDate: new Date(`${currentYear}-01-01`),
        endDate: new Date(`${currentYear}-08-31`),
        status: "OPEN",
        description: `Admission open for the ${academicYear} academic year. Apply now for KG through Grade 12.`,
        eligibilityCriteria: JSON.stringify({
          minAge: { KG1: 4, KG2: 5, Grade1: 6 },
          requiredDocuments: ["Birth Certificate", "Previous Report Cards"],
          entranceTest: true,
          interview: true,
        }),
        requiredDocuments: JSON.stringify([
          "Birth Certificate",
          "Previous Report Cards",
          "Passport Photo",
          "Transfer Certificate",
          "Parent ID",
        ]),
        applicationFee: 500,
        totalSeats: 200,
        reservedSeats: JSON.stringify({
          staff: 10,
          siblings: 20,
          scholarship: 15,
        }),
      },
    })

    return campaign.id
  } catch {
    return null
  }
}

// ============================================================================
// TIME SLOTS
// ============================================================================

/**
 * Seed admission time slots for tours and interviews
 */
export async function seedTimeSlots(
  prisma: PrismaClient,
  schoolId: string,
  campaignId: string
): Promise<string[]> {
  const slotIds: string[] = []

  // Create slots for the next 30 days
  const today = new Date()

  for (let day = 1; day <= 30; day++) {
    const date = new Date(today)
    date.setDate(date.getDate() + day)

    // Skip Friday and Saturday (Sudan weekend)
    const dayOfWeek = date.getDay()
    if (dayOfWeek === 5 || dayOfWeek === 6) continue

    // Create tour slots: 9:00 AM and 2:00 PM
    const tourTimes = [
      { start: "09:00", end: "10:00" },
      { start: "14:00", end: "15:00" },
    ]

    for (const time of tourTimes) {
      try {
        const startTime = new Date(date)
        const [startHour, startMin] = time.start.split(":").map(Number)
        startTime.setHours(startHour, startMin, 0, 0)

        const endTime = new Date(date)
        const [endHour, endMin] = time.end.split(":").map(Number)
        endTime.setHours(endHour, endMin, 0, 0)

        const slotDate = new Date(date)
        slotDate.setHours(0, 0, 0, 0)

        const existing = await prisma.admissionTimeSlot.findFirst({
          where: {
            schoolId,
            date: slotDate,
            startTime,
            slotType: "TOUR",
          },
        })

        if (!existing) {
          const slot = await prisma.admissionTimeSlot.create({
            data: {
              schoolId,
              campaignId,
              slotType: "TOUR",
              date: slotDate,
              startTime,
              endTime,
              maxCapacity: 10,
              currentBookings: 0,
              isActive: true,
              location: "Main Office",
              notes: "School tour for prospective families",
            },
          })
          slotIds.push(slot.id)
        }
      } catch {
        // Skip if slot creation fails
      }
    }
  }

  logSuccess("Time Slots", slotIds.length, "tour slots for 30 days")
  return slotIds
}

// ============================================================================
// APPLICATIONS
// ============================================================================

/**
 * Seed applications with distribution across statuses
 * Target: 50 applications
 * - 10 DRAFT
 * - 10 SUBMITTED
 * - 8 UNDER_REVIEW
 * - 5 SHORTLISTED
 * - 5 SELECTED
 * - 5 ADMITTED
 * - 3 WAITLISTED
 * - 2 REJECTED
 * - 2 WITHDRAWN
 */
export async function seedApplications(
  prisma: PrismaClient,
  schoolId: string,
  campaignId: string,
  yearLevels: YearLevelRef[],
  adminUsers: UserRef[]
): Promise<number> {
  let applicationCount = 0

  // Application status distribution
  type StatusConfig = {
    status:
      | "DRAFT"
      | "SUBMITTED"
      | "UNDER_REVIEW"
      | "SHORTLISTED"
      | "SELECTED"
      | "ADMITTED"
      | "WAITLISTED"
      | "REJECTED"
      | "WITHDRAWN"
    count: number
    hasEntranceScore: boolean
    hasInterviewScore: boolean
    hasMeritScore: boolean
    isAdmitted: boolean
  }

  const statusDistribution: StatusConfig[] = [
    {
      status: "DRAFT",
      count: 10,
      hasEntranceScore: false,
      hasInterviewScore: false,
      hasMeritScore: false,
      isAdmitted: false,
    },
    {
      status: "SUBMITTED",
      count: 10,
      hasEntranceScore: false,
      hasInterviewScore: false,
      hasMeritScore: false,
      isAdmitted: false,
    },
    {
      status: "UNDER_REVIEW",
      count: 8,
      hasEntranceScore: false,
      hasInterviewScore: false,
      hasMeritScore: false,
      isAdmitted: false,
    },
    {
      status: "SHORTLISTED",
      count: 5,
      hasEntranceScore: true,
      hasInterviewScore: false,
      hasMeritScore: false,
      isAdmitted: false,
    },
    {
      status: "SELECTED",
      count: 5,
      hasEntranceScore: true,
      hasInterviewScore: true,
      hasMeritScore: true,
      isAdmitted: false,
    },
    {
      status: "ADMITTED",
      count: 5,
      hasEntranceScore: true,
      hasInterviewScore: true,
      hasMeritScore: true,
      isAdmitted: true,
    },
    {
      status: "WAITLISTED",
      count: 3,
      hasEntranceScore: true,
      hasInterviewScore: true,
      hasMeritScore: true,
      isAdmitted: false,
    },
    {
      status: "REJECTED",
      count: 2,
      hasEntranceScore: true,
      hasInterviewScore: true,
      hasMeritScore: true,
      isAdmitted: false,
    },
    {
      status: "WITHDRAWN",
      count: 2,
      hasEntranceScore: false,
      hasInterviewScore: false,
      hasMeritScore: false,
      isAdmitted: false,
    },
  ]

  let applicationIndex = 0
  let meritRank = 1

  for (const config of statusDistribution) {
    for (let i = 0; i < config.count; i++) {
      const isMale = Math.random() < 0.5
      const firstNames = isMale ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE
      const firstName = randomElement(firstNames)
      const lastName = randomElement(LAST_NAMES)
      const fatherFirstName = randomElement(FIRST_NAMES_MALE)
      const motherFirstName = randomElement(FIRST_NAMES_FEMALE)

      const applicationNumber = generateApplicationNumber(
        applicationIndex,
        new Date().getFullYear()
      )
      const email = generatePersonalEmail(firstName, lastName, applicationIndex)
      const phone = generatePhone(applicationIndex)
      const city = randomElement(CITIES)

      // Pick a grade level to apply for
      const yearLevel = randomElement(yearLevels)
      const applyingForClass = yearLevel?.levelName || "Grade 1"

      // Generate scores for applicable statuses
      const entranceScore = config.hasEntranceScore
        ? randomNumber(60, 100)
        : null
      const interviewScore = config.hasInterviewScore
        ? randomNumber(60, 100)
        : null
      const meritScore =
        config.hasMeritScore && entranceScore && interviewScore
          ? Math.round(entranceScore * 0.35 + interviewScore * 0.25 + 40) // 40% academic
          : null

      // Calculate dates based on status
      const createdAt = getPastDate(randomNumber(10, 60))
      const submittedAt =
        config.status !== "DRAFT"
          ? new Date(createdAt.getTime() + randomNumber(1, 5) * 86400000)
          : null
      const reviewedAt = [
        "UNDER_REVIEW",
        "SHORTLISTED",
        "SELECTED",
        "ADMITTED",
        "WAITLISTED",
        "REJECTED",
      ].includes(config.status)
        ? new Date(
            (submittedAt || createdAt).getTime() +
              randomNumber(3, 10) * 86400000
          )
        : null

      const reviewedBy =
        reviewedAt && adminUsers.length > 0
          ? randomElement(adminUsers)?.id
          : null

      try {
        const existing = await prisma.application.findFirst({
          where: { schoolId, applicationNumber },
        })

        if (!existing) {
          await prisma.application.create({
            data: {
              schoolId,
              campaignId,
              applicationNumber,
              firstName,
              lastName,
              dateOfBirth: new Date(
                new Date().getFullYear() - randomNumber(5, 17),
                randomNumber(0, 11),
                randomNumber(1, 28)
              ),
              gender: isMale ? "MALE" : "FEMALE",
              nationality: "Sudanese",
              religion: "Islam",
              category: "General",
              email,
              phone,
              address: `${randomNumber(1, 200)} Street ${randomNumber(1, 50)}`,
              city,
              state: "Khartoum",
              postalCode: String(randomNumber(10000, 99999)),
              country: "Sudan",
              fatherName: `${fatherFirstName} ${lastName}`,
              fatherOccupation: randomElement(OCCUPATIONS),
              fatherPhone: generatePhone(applicationIndex + 100),
              fatherEmail: generatePersonalEmail(
                fatherFirstName,
                lastName,
                applicationIndex + 100
              ),
              motherName: `${motherFirstName} ${randomElement(LAST_NAMES)}`,
              motherOccupation: randomElement([
                ...OCCUPATIONS,
                "Homemaker",
                "Homemaker",
              ]),
              motherPhone: generatePhone(applicationIndex + 200),
              previousSchool:
                Math.random() < 0.7 ? randomElement(PREVIOUS_SCHOOLS) : null,
              previousClass:
                Math.random() < 0.7 ? `Grade ${randomNumber(1, 11)}` : null,
              previousPercentage:
                Math.random() < 0.7 ? randomNumber(60, 98) : null,
              applyingForClass,
              status: config.status,
              submittedAt,
              reviewedAt,
              reviewedBy,
              reviewNotes: reviewedAt
                ? `Application reviewed. ${config.status === "REJECTED" ? "Does not meet eligibility criteria." : "Meets basic requirements."}`
                : null,
              entranceScore,
              interviewScore,
              meritScore,
              meritRank: config.hasMeritScore ? meritRank++ : null,
              waitlistNumber:
                config.status === "WAITLISTED" ? randomNumber(1, 10) : null,
              admissionOffered: config.isAdmitted,
              offerDate: config.isAdmitted ? reviewedAt : null,
              offerExpiryDate: config.isAdmitted
                ? new Date((reviewedAt || new Date()).getTime() + 14 * 86400000)
                : null,
              admissionConfirmed: config.isAdmitted && Math.random() < 0.8,
              confirmationDate:
                config.isAdmitted && Math.random() < 0.8
                  ? new Date(
                      (reviewedAt || new Date()).getTime() +
                        randomNumber(1, 7) * 86400000
                    )
                  : null,
              applicationFeePaid: config.status !== "DRAFT",
              paymentDate: config.status !== "DRAFT" ? submittedAt : null,
              createdAt,
              updatedAt: reviewedAt || submittedAt || createdAt,
            },
          })
          applicationCount++
        }
      } catch {
        // Skip if application creation fails
      }

      applicationIndex++
    }
  }

  logSuccess("Applications", applicationCount, "across all statuses")
  return applicationCount
}

// ============================================================================
// INQUIRIES
// ============================================================================

/**
 * Seed admission inquiries
 * Target: 20 inquiries
 */
export async function seedInquiries(
  prisma: PrismaClient,
  schoolId: string
): Promise<number> {
  let inquiryCount = 0

  type InquiryConfig = {
    status:
      | "NEW"
      | "CONTACTED"
      | "QUALIFIED"
      | "CONVERTED"
      | "UNQUALIFIED"
      | "CLOSED"
    count: number
  }

  const statusDistribution: InquiryConfig[] = [
    { status: "NEW", count: 5 },
    { status: "CONTACTED", count: 5 },
    { status: "QUALIFIED", count: 4 },
    { status: "CONVERTED", count: 3 },
    { status: "UNQUALIFIED", count: 2 },
    { status: "CLOSED", count: 1 },
  ]

  let index = 0

  for (const config of statusDistribution) {
    for (let i = 0; i < config.count; i++) {
      const parentFirstName = randomElement(FIRST_NAMES_MALE)
      const parentLastName = randomElement(LAST_NAMES)
      const studentFirstName = randomElement([
        ...FIRST_NAMES_MALE,
        ...FIRST_NAMES_FEMALE,
      ])
      const email = generatePersonalEmail(
        parentFirstName,
        parentLastName,
        index + 500
      )

      try {
        const existing = await prisma.admissionInquiry.findFirst({
          where: { schoolId, email },
        })

        if (!existing) {
          await prisma.admissionInquiry.create({
            data: {
              schoolId,
              parentName: `${parentFirstName} ${parentLastName}`,
              email,
              phone: generatePhone(index + 500),
              studentName: `${studentFirstName} ${parentLastName}`,
              studentDOB: new Date(
                new Date().getFullYear() - randomNumber(5, 16),
                randomNumber(0, 11),
                randomNumber(1, 28)
              ),
              interestedGrade: `Grade ${randomNumber(1, 12)}`,
              source: randomElement(INQUIRY_SOURCES),
              message: randomElement(INQUIRY_MESSAGES),
              status: config.status,
              followUpDate:
                config.status === "CONTACTED" ? getDateInRange(1, 7) : null,
              subscribeNewsletter: Math.random() < 0.6,
              createdAt: getPastDate(randomNumber(1, 30)),
            },
          })
          inquiryCount++
        }
      } catch {
        // Skip if inquiry creation fails
      }

      index++
    }
  }

  logSuccess("Inquiries", inquiryCount, "from interested families")
  return inquiryCount
}

// ============================================================================
// TOUR BOOKINGS
// ============================================================================

/**
 * Seed tour bookings
 * Target: 15 bookings (10 upcoming, 5 completed)
 */
export async function seedTourBookings(
  prisma: PrismaClient,
  schoolId: string,
  slotIds: string[]
): Promise<number> {
  if (slotIds.length === 0) {
    logSuccess("Tour Bookings", 0, "no slots available")
    return 0
  }

  let bookingCount = 0

  type BookingConfig = {
    status: "PENDING" | "CONFIRMED" | "COMPLETED" | "NO_SHOW" | "CANCELLED"
    count: number
    isPast: boolean
  }

  const bookingDistribution: BookingConfig[] = [
    { status: "CONFIRMED", count: 8, isPast: false },
    { status: "PENDING", count: 2, isPast: false },
    { status: "COMPLETED", count: 3, isPast: true },
    { status: "NO_SHOW", count: 1, isPast: true },
    { status: "CANCELLED", count: 1, isPast: false },
  ]

  let index = 0

  for (const config of bookingDistribution) {
    for (let i = 0; i < config.count; i++) {
      const slotId = slotIds[index % slotIds.length]
      const parentFirstName = randomElement(FIRST_NAMES_MALE)
      const parentLastName = randomElement(LAST_NAMES)
      const email = generatePersonalEmail(
        parentFirstName,
        parentLastName,
        index + 700
      )
      const bookingNumber = generateBookingNumber(index)

      try {
        const existing = await prisma.tourBooking.findFirst({
          where: { bookingNumber },
        })

        if (!existing) {
          await prisma.tourBooking.create({
            data: {
              schoolId,
              slotId,
              bookingNumber,
              parentName: `${parentFirstName} ${parentLastName}`,
              email,
              phone: generatePhone(index + 700),
              studentName: `${randomElement([...FIRST_NAMES_MALE, ...FIRST_NAMES_FEMALE])} ${parentLastName}`,
              interestedGrade: `Grade ${randomNumber(1, 12)}`,
              status: config.status,
              attendedAt:
                config.status === "COMPLETED"
                  ? getPastDate(randomNumber(1, 10))
                  : null,
              noShowReason:
                config.status === "NO_SHOW"
                  ? "Family did not show up for scheduled tour"
                  : null,
              numberOfAttendees: randomNumber(1, 3),
              reminderSent: config.status !== "PENDING",
              reminderSentAt:
                config.status !== "PENDING" ? getPastDate(1) : null,
              cancelledAt:
                config.status === "CANCELLED"
                  ? getPastDate(randomNumber(1, 5))
                  : null,
              cancelReason:
                config.status === "CANCELLED"
                  ? "Family requested cancellation due to schedule conflict"
                  : null,
              createdAt: getPastDate(randomNumber(5, 20)),
            },
          })

          // Update slot booking count
          await prisma.admissionTimeSlot.update({
            where: { id: slotId },
            data: {
              currentBookings: {
                increment: 1,
              },
            },
          })

          bookingCount++
        }
      } catch {
        // Skip if booking creation fails
      }

      index++
    }
  }

  logSuccess("Tour Bookings", bookingCount, "upcoming + completed")
  return bookingCount
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

/**
 * Seed all admission-related data
 * - 1 OPEN campaign
 * - 50 applications
 * - 20 inquiries
 * - 15 tour bookings
 */
export async function seedAdmission(
  prisma: PrismaClient,
  schoolId: string,
  yearLevels: YearLevelRef[],
  adminUsers: UserRef[]
): Promise<number> {
  logPhase(15, "ADMISSION", "القبول والتسجيل")

  // 1. Seed admission settings
  await seedAdmissionSettings(prisma, schoolId)

  // 2. Create admission campaign
  const campaignId = await seedAdmissionCampaign(prisma, schoolId)
  if (!campaignId) {
    logSuccess("Admission Campaign", 0, "failed to create")
    return 0
  }
  const currentYear = new Date().getFullYear()
  logSuccess("Admission Campaign", 1, `${currentYear}-${currentYear + 1} OPEN`)

  // 3. Create time slots
  const slotIds = await seedTimeSlots(prisma, schoolId, campaignId)

  // 4. Seed applications
  const applicationCount = await seedApplications(
    prisma,
    schoolId,
    campaignId,
    yearLevels,
    adminUsers
  )

  // 5. Seed inquiries
  const inquiryCount = await seedInquiries(prisma, schoolId)

  // 6. Seed tour bookings
  const bookingCount = await seedTourBookings(prisma, schoolId, slotIds)

  return applicationCount + inquiryCount + bookingCount
}
