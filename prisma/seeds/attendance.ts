/**
 * Attendance Seed Module - Sudanese K-12 School
 * Creates realistic attendance data for 30 days
 *
 * Features:
 * - Sudanese weekend (Friday/Saturday)
 * - Realistic distribution: 85% present, 5% late, 8% absent
 * - Student identifiers (barcode, RFID)
 * - QR code sessions for check-in
 */

// ============================================================================
// ADVANCED ATTENDANCE FEATURES
// ============================================================================
import type {
  AttendanceMethod,
  AttendanceStatus,
  BiometricType,
  CardType,
  DeviceType,
  IdentifierType,
} from "@prisma/client"

import type { ClassRef, SeedPrisma, StudentRef } from "./types"

export async function seedAttendance(
  prisma: SeedPrisma,
  schoolId: string,
  classes: ClassRef[],
  students: StudentRef[]
): Promise<void> {
  console.log("📊 Creating attendance data (Sudanese K-12 School)...")

  // Get class enrollments to know which students are in which class
  const enrollments = await prisma.studentClass.findMany({
    where: { schoolId },
    select: { studentId: true, classId: true },
  })

  // Build a map of classId -> studentIds
  const classStudentMap = new Map<string, string[]>()
  for (const e of enrollments) {
    if (!classStudentMap.has(e.classId)) {
      classStudentMap.set(e.classId, [])
    }
    classStudentMap.get(e.classId)!.push(e.studentId)
  }

  // Generate 30 days of attendance data
  const today = new Date()
  const attendanceRecords: {
    schoolId: string
    studentId: string
    classId: string
    date: Date
    status: AttendanceStatus
    method: AttendanceMethod
    checkInTime: Date
    checkOutTime: Date | null
    markedAt: Date
  }[] = []

  let totalRecords = 0
  let presentCount = 0
  let absentCount = 0
  let lateCount = 0

  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const date = new Date(today)
    date.setDate(date.getDate() - dayOffset)
    date.setHours(0, 0, 0, 0)

    // Skip weekends (Friday and Saturday for Sudan)
    const dayOfWeek = date.getDay()
    if (dayOfWeek === 5 || dayOfWeek === 6) continue

    // Process each class
    for (const cls of classes) {
      const studentIds = classStudentMap.get(cls.id) || []

      for (const studentId of studentIds) {
        // Realistic distribution: 85% present, 5% late, 8% absent, 2% excused/sick
        const rand = Math.random()
        let status: AttendanceStatus
        let checkInHour: number
        let checkInMinute: number

        if (rand < 0.85) {
          status = "PRESENT"
          checkInHour = 7
          checkInMinute = Math.floor(Math.random() * 25) + 30 // 7:30-7:55
          presentCount++
        } else if (rand < 0.9) {
          status = "LATE"
          checkInHour = 8
          checkInMinute = Math.floor(Math.random() * 30) // 8:00-8:30
          lateCount++
        } else if (rand < 0.98) {
          status = "ABSENT"
          checkInHour = 0
          checkInMinute = 0
          absentCount++
        } else if (rand < 0.99) {
          status = "EXCUSED"
          checkInHour = 0
          checkInMinute = 0
        } else {
          status = "SICK"
          checkInHour = 0
          checkInMinute = 0
        }

        // Add some day-of-week variation (Monday blues, Thursday energy)
        if (dayOfWeek === 0 && Math.random() < 0.1) {
          // Sunday - slightly more late arrivals
          if (status === "PRESENT") {
            status = "LATE"
            checkInHour = 8
            checkInMinute = Math.floor(Math.random() * 15)
            presentCount--
            lateCount++
          }
        }
        if (dayOfWeek === 3 && Math.random() < 0.05) {
          // Wednesday - slightly more absences
          if (status === "PRESENT") {
            status = "ABSENT"
            checkInHour = 0
            checkInMinute = 0
            presentCount--
            absentCount++
          }
        }

        // Create check-in time
        const checkInTime = new Date(date)
        if (checkInHour > 0) {
          checkInTime.setHours(checkInHour, checkInMinute, 0, 0)
        }

        // Create check-out time (3:00 PM with some variation)
        let checkOutTime: Date | null = null
        if (status === "PRESENT" || status === "LATE") {
          checkOutTime = new Date(date)
          checkOutTime.setHours(15, Math.floor(Math.random() * 30), 0, 0)
        }

        // Select method based on status
        const methods: AttendanceMethod[] = [
          "MANUAL",
          "QR_CODE",
          "BARCODE",
          "GEOFENCE",
        ]
        const method = methods[Math.floor(Math.random() * methods.length)]

        attendanceRecords.push({
          schoolId,
          studentId,
          classId: cls.id,
          date,
          status,
          method,
          checkInTime:
            status !== "ABSENT" && status !== "EXCUSED" && status !== "SICK"
              ? checkInTime
              : date,
          checkOutTime,
          markedAt: checkInTime,
        })

        totalRecords++
      }
    }
  }

  // Batch insert attendance records
  if (attendanceRecords.length > 0) {
    // Use createMany for efficiency
    await prisma.attendance.createMany({
      data: attendanceRecords,
      skipDuplicates: true,
    })
  }

  // Create some student identifiers for barcode/QR scanning
  console.log("🏷️  Creating student identifiers...")
  const identifiers: {
    schoolId: string
    studentId: string
    type: IdentifierType
    value: string
    isActive: boolean
    isPrimary: boolean
    issuedAt: Date
  }[] = []

  for (const student of students.slice(0, 50)) {
    // First 50 students
    // Barcode identifier
    identifiers.push({
      schoolId,
      studentId: student.id,
      type: "BARCODE",
      value: `STU${student.id.slice(-6).toUpperCase()}`,
      isActive: true,
      isPrimary: true,
      issuedAt: new Date(),
    })

    // RFID card for some students
    if (Math.random() < 0.5) {
      identifiers.push({
        schoolId,
        studentId: student.id,
        type: "RFID_CARD",
        value: `RFID${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        isActive: true,
        isPrimary: false,
        issuedAt: new Date(),
      })
    }
  }

  if (identifiers.length > 0) {
    await prisma.studentIdentifier.createMany({
      data: identifiers,
      skipDuplicates: true,
    })
  }

  // Create some QR code sessions
  console.log("📱 Creating QR code sessions...")
  const sessions = []

  // Get an admin user for generatedBy
  const adminUser = await prisma.user.findFirst({
    where: { schoolId, role: "ADMIN" },
    select: { id: true },
  })

  if (adminUser) {
    for (const cls of classes.slice(0, 5)) {
      const sessionDate = new Date()
      sessionDate.setHours(8, 0, 0, 0)

      sessions.push({
        schoolId,
        classId: cls.id,
        code: `QR${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
        payload: JSON.stringify({ classId: cls.id, className: cls.name }),
        generatedBy: adminUser.id,
        generatedAt: sessionDate,
        expiresAt: new Date(sessionDate.getTime() + 30 * 60 * 1000), // 30 minutes
        isActive: false,
        scanCount: Math.floor(Math.random() * 20) + 10,
        scannedBy: JSON.stringify([]),
      })
    }

    if (sessions.length > 0) {
      await prisma.qRCodeSession.createMany({
        data: sessions,
        skipDuplicates: true,
      })
    }
  }

  console.log(`   ✅ Created: ${totalRecords} attendance records`)
  console.log(
    `      - Present: ${presentCount} (${Math.round((presentCount / totalRecords) * 100)}%)`
  )
  console.log(
    `      - Late: ${lateCount} (${Math.round((lateCount / totalRecords) * 100)}%)`
  )
  console.log(
    `      - Absent: ${absentCount} (${Math.round((absentCount / totalRecords) * 100)}%)`
  )
  console.log(`   ✅ Created: ${identifiers.length} student identifiers`)
  console.log(`   ✅ Created: ${sessions.length} QR code sessions\n`)
}

// Device templates
const DEVICE_TEMPLATES = [
  {
    type: "RFID_READER" as DeviceType,
    name: "Main Gate RFID Reader",
    location: "Main Entrance Gate",
    model: "ACR122U NFC Reader",
  },
  {
    type: "FINGERPRINT_SCANNER" as DeviceType,
    name: "Admin Office Scanner",
    location: "Administration Building",
    model: "ZKTeco F18",
  },
  {
    type: "FACE_CAMERA" as DeviceType,
    name: "Classroom Block Entry",
    location: "Building A Entrance",
    model: "Hikvision DS-K1T671M",
  },
  {
    type: "TABLET_KIOSK" as DeviceType,
    name: "Student Check-in Kiosk 1",
    location: "Main Hall",
    model: "Samsung Galaxy Tab A8",
  },
  {
    type: "TABLET_KIOSK" as DeviceType,
    name: "Student Check-in Kiosk 2",
    location: "Cafeteria Entrance",
    model: "Samsung Galaxy Tab A8",
  },
  {
    type: "WEB_CAMERA" as DeviceType,
    name: "Library Entry Camera",
    location: "Library Entrance",
    model: "Logitech C920",
  },
  {
    type: "SMART_GATE" as DeviceType,
    name: "Vehicle Entry Gate",
    location: "Parking Area Gate",
    model: "CAME BX-74",
  },
  {
    type: "NFC_READER" as DeviceType,
    name: "Sports Hall Reader",
    location: "Sports Complex",
    model: "PN532 NFC Module",
  },
]

// Card types for students
const CARD_TYPES: CardType[] = [
  "RFID_125KHZ",
  "RFID_13_56MHZ",
  "NFC_MIFARE",
  "BARCODE",
]

/**
 * Seeds advanced attendance features:
 * - 8 attendance devices
 * - Access cards for students/teachers
 * - Biometric templates (fingerprint/face)
 */
export async function seedAdvancedAttendance(
  prisma: SeedPrisma,
  schoolId: string,
  students: StudentRef[]
): Promise<void> {
  console.log("🔒 Creating advanced attendance infrastructure...")

  // Check existing counts
  const existingDevices = await prisma.attendanceDevice.count({
    where: { schoolId },
  })
  const existingCards = await prisma.accessCard.count({ where: { schoolId } })

  if (existingDevices >= 5 && existingCards >= 100) {
    console.log(
      `   ✅ Advanced attendance already exists (${existingDevices} devices, ${existingCards} cards), skipping\n`
    )
    return
  }

  // Get admin user for installedBy/issuedBy
  const adminUser = await prisma.user.findFirst({
    where: { schoolId, role: "ADMIN" },
    select: { id: true },
  })

  // Get teachers for access cards
  const teachers = await prisma.teacher.findMany({
    where: { schoolId },
    select: { id: true, givenName: true },
    take: 50,
  })

  let deviceCount = 0
  let cardCount = 0
  let biometricCount = 0

  // ============================================
  // 1. Create Attendance Devices (8)
  // ============================================
  for (const template of DEVICE_TEMPLATES) {
    const deviceId = `DEV-${schoolId.slice(0, 4)}-${String(deviceCount + 1).padStart(3, "0")}`

    const existingDevice = await prisma.attendanceDevice.findFirst({
      where: { schoolId, deviceId },
    })

    if (!existingDevice) {
      // Generate IP and MAC addresses
      const ipOctet = 100 + deviceCount
      const macSuffix = Math.random().toString(16).slice(2, 14).toUpperCase()

      await prisma.attendanceDevice.create({
        data: {
          schoolId,
          deviceId,
          name: template.name,
          type: template.type,
          model: template.model,
          location: template.location,
          ipAddress: `192.168.1.${ipOctet}`,
          macAddress: `AA:BB:CC:${macSuffix.slice(0, 2)}:${macSuffix.slice(2, 4)}:${macSuffix.slice(4, 6)}`,
          isActive: true,
          isOnline: Math.random() > 0.2, // 80% online
          lastPing: Math.random() > 0.2 ? new Date() : null,
          configuration: JSON.stringify({
            timeout: 30,
            retryAttempts: 3,
            syncInterval: 300,
          }),
          installedAt: new Date(
            Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
          ),
          installedBy: adminUser?.id || null,
        },
      })
      deviceCount++
    }
  }

  // ============================================
  // 2. Create Access Cards for Students (200)
  // ============================================
  const studentsForCards = students.slice(0, 200)

  for (const [index, student] of studentsForCards.entries()) {
    const cardNumber = `CARD-${schoolId.slice(0, 4)}-${String(index + 1).padStart(5, "0")}`

    const existingCard = await prisma.accessCard.findFirst({
      where: { cardNumber },
    })

    if (!existingCard) {
      const cardType = CARD_TYPES[index % CARD_TYPES.length]
      const issuedDate = new Date(
        Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
      )

      await prisma.accessCard.create({
        data: {
          schoolId,
          cardNumber,
          cardType,
          studentId: student.id,
          isActive: Math.random() > 0.05, // 95% active
          isPrimary: true,
          issuedAt: issuedDate,
          issuedBy: adminUser?.id || null,
          activatedAt: new Date(issuedDate.getTime() + 24 * 60 * 60 * 1000),
          expiresAt: new Date(
            issuedDate.getTime() + 3 * 365 * 24 * 60 * 60 * 1000
          ), // 3 years
          lastUsedAt: Math.random() > 0.3 ? new Date() : null,
          usageCount: Math.floor(Math.random() * 200),
          accessLevel: "STUDENT",
        },
      })
      cardCount++
    }
  }

  // ============================================
  // 3. Create Access Cards for Teachers (50)
  // ============================================
  for (const [index, teacher] of teachers.entries()) {
    const cardNumber = `CARD-TCH-${schoolId.slice(0, 4)}-${String(index + 1).padStart(4, "0")}`

    const existingCard = await prisma.accessCard.findFirst({
      where: { cardNumber },
    })

    if (!existingCard) {
      const cardType = CARD_TYPES[index % CARD_TYPES.length]
      const issuedDate = new Date(
        Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
      )

      await prisma.accessCard.create({
        data: {
          schoolId,
          cardNumber,
          cardType,
          teacherId: teacher.id,
          isActive: true,
          isPrimary: true,
          issuedAt: issuedDate,
          issuedBy: adminUser?.id || null,
          activatedAt: issuedDate,
          expiresAt: new Date(
            issuedDate.getTime() + 5 * 365 * 24 * 60 * 60 * 1000
          ), // 5 years
          lastUsedAt: new Date(),
          usageCount: Math.floor(Math.random() * 500) + 100,
          accessLevel: "TEACHER",
        },
      })
      cardCount++
    }
  }

  // ============================================
  // 4. Create Biometric Templates (100 students)
  // ============================================
  const studentsForBiometrics = students.slice(0, 100)

  for (const [index, student] of studentsForBiometrics.entries()) {
    // Fingerprint template
    const existingFingerprint = await prisma.biometricTemplate.findFirst({
      where: {
        schoolId,
        studentId: student.id,
        type: "FINGERPRINT" as BiometricType,
      },
    })

    if (!existingFingerprint) {
      // Generate a fake encrypted template (in reality this would be from a scanner)
      const fakeTemplate = Buffer.from(
        Math.random().toString(36).repeat(100)
      ).toString("base64")

      await prisma.biometricTemplate.create({
        data: {
          schoolId,
          studentId: student.id,
          type: "FINGERPRINT",
          template: fakeTemplate,
          quality: 0.75 + Math.random() * 0.25, // 75-100% quality
          isActive: true,
          isPrimary: true,
          enrolledAt: new Date(
            Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
          ),
          enrolledBy: adminUser?.id || null,
          lastMatchedAt: Math.random() > 0.3 ? new Date() : null,
          matchCount: Math.floor(Math.random() * 100),
          failureCount: Math.floor(Math.random() * 5),
        },
      })
      biometricCount++
    }

    // Face template for 50% of students
    if (index % 2 === 0) {
      const existingFace = await prisma.biometricTemplate.findFirst({
        where: {
          schoolId,
          studentId: student.id,
          type: "FACE" as BiometricType,
        },
      })

      if (!existingFace) {
        const fakeTemplate = Buffer.from(
          Math.random().toString(36).repeat(150)
        ).toString("base64")

        await prisma.biometricTemplate.create({
          data: {
            schoolId,
            studentId: student.id,
            type: "FACE",
            template: fakeTemplate,
            quality: 0.8 + Math.random() * 0.2,
            isActive: true,
            isPrimary: false,
            enrolledAt: new Date(
              Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
            ),
            enrolledBy: adminUser?.id || null,
            matchCount: Math.floor(Math.random() * 50),
            failureCount: Math.floor(Math.random() * 3),
          },
        })
        biometricCount++
      }
    }
  }

  console.log(`   ✅ Advanced attendance infrastructure created:`)
  console.log(`      - ${deviceCount} attendance devices`)
  console.log(`      - ${cardCount} access cards (students + teachers)`)
  console.log(`      - ${biometricCount} biometric templates\n`)
}
