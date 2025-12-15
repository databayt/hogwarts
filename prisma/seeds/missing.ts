/**
 * Missing Data Seed Module
 * Seeds all empty/low-data tables in one efficient pass
 * - Invoices & Receipts
 * - Notifications
 * - Tasks
 * - Lessons (if empty)
 * - Messages & Conversations (if empty)
 * - Health Records (if empty)
 *
 * Uses batch operations for efficiency
 */

import {
  ConversationType,
  InvoiceStatus,
  LessonStatus,
  MessageStatus,
  NotificationChannel,
  NotificationPriority,
  NotificationType,
  ParticipantRole,
  TaskLabel,
  TaskPriority,
  TaskStatus,
} from "@prisma/client"

import type { SeedPrisma } from "./types"

// ============================================================================
// INVOICE DATA
// ============================================================================

const INVOICE_ITEMS = {
  tuition: [
    {
      nameAr: "الرسوم الدراسية - الفصل الأول",
      nameEn: "Tuition Fee - Term 1",
      price: 50000,
    },
    {
      nameAr: "الرسوم الدراسية - الفصل الثاني",
      nameEn: "Tuition Fee - Term 2",
      price: 50000,
    },
    { nameAr: "رسوم التسجيل", nameEn: "Registration Fee", price: 5000 },
  ],
  activities: [
    { nameAr: "رسوم الأنشطة", nameEn: "Activity Fee", price: 3000 },
    { nameAr: "رسوم النقل", nameEn: "Transportation Fee", price: 8000 },
    { nameAr: "رسوم الكتب", nameEn: "Books Fee", price: 4000 },
    { nameAr: "رسوم المختبر", nameEn: "Laboratory Fee", price: 2500 },
  ],
  misc: [
    { nameAr: "رسوم الزي المدرسي", nameEn: "Uniform Fee", price: 3500 },
    { nameAr: "رسوم الامتحانات", nameEn: "Examination Fee", price: 2000 },
    { nameAr: "رسوم المكتبة", nameEn: "Library Fee", price: 1500 },
  ],
}

// ============================================================================
// NOTIFICATION TEMPLATES
// ============================================================================

const NOTIFICATION_TEMPLATES = [
  {
    type: NotificationType.announcement,
    titleAr: "إعلان جديد من إدارة المدرسة",
    titleEn: "New Announcement from School Administration",
    bodyAr: "تم نشر إعلان جديد. يرجى مراجعة لوحة الإعلانات للتفاصيل.",
    bodyEn:
      "A new announcement has been posted. Please check the notice board for details.",
    priority: NotificationPriority.normal,
  },
  {
    type: NotificationType.fee_due,
    titleAr: "تذكير بموعد سداد الرسوم",
    titleEn: "Fee Payment Reminder",
    bodyAr:
      "يرجى سداد الرسوم الدراسية المستحقة قبل نهاية الشهر لتجنب الغرامات.",
    bodyEn:
      "Please pay the outstanding tuition fees by end of month to avoid late charges.",
    priority: NotificationPriority.high,
  },
  {
    type: NotificationType.assignment_created,
    titleAr: "واجب جديد",
    titleEn: "New Assignment",
    bodyAr:
      "تم إضافة واجب جديد في مادة الرياضيات. الموعد النهائي: الأسبوع القادم.",
    bodyEn: "A new Mathematics assignment has been added. Due: Next week.",
    priority: NotificationPriority.normal,
  },
  {
    type: NotificationType.grade_posted,
    titleAr: "تم نشر الدرجات",
    titleEn: "Grades Posted",
    bodyAr: "تم نشر درجات اختبار الفصل الأول. يرجى مراجعة صفحة الدرجات.",
    bodyEn:
      "First term exam grades have been posted. Please check the grades page.",
    priority: NotificationPriority.normal,
  },
  {
    type: NotificationType.event_reminder,
    titleAr: "تذكير بالفعالية",
    titleEn: "Event Reminder",
    bodyAr: "تذكير: اليوم الرياضي المدرسي غداً. يرجى الحضور بالملابس الرياضية.",
    bodyEn:
      "Reminder: School Sports Day is tomorrow. Please come in sports attire.",
    priority: NotificationPriority.high,
  },
  {
    type: NotificationType.attendance_alert,
    titleAr: "تنبيه الحضور",
    titleEn: "Attendance Alert",
    bodyAr: "تم تسجيل غياب الطالب اليوم. يرجى التواصل مع المدرسة.",
    bodyEn: "Student absence recorded today. Please contact the school.",
    priority: NotificationPriority.urgent,
  },
  {
    type: NotificationType.message,
    titleAr: "رسالة جديدة",
    titleEn: "New Message",
    bodyAr: "لديك رسالة جديدة من معلم الصف.",
    bodyEn: "You have a new message from the class teacher.",
    priority: NotificationPriority.normal,
  },
  {
    type: NotificationType.report_ready,
    titleAr: "التقرير جاهز",
    titleEn: "Report Ready",
    bodyAr: "تقرير الطالب الفصلي جاهز للتحميل.",
    bodyEn: "The student's term report is ready for download.",
    priority: NotificationPriority.low,
  },
]

// ============================================================================
// TASK TEMPLATES (for demo data-table block)
// ============================================================================

const TASK_TEMPLATES = [
  {
    title: "Update student records",
    status: TaskStatus.done,
    label: TaskLabel.documentation,
    priority: TaskPriority.high,
  },
  {
    title: "Fix attendance calculation bug",
    status: TaskStatus.in_progress,
    label: TaskLabel.bug,
    priority: TaskPriority.high,
  },
  {
    title: "Add grade export feature",
    status: TaskStatus.todo,
    label: TaskLabel.feature,
    priority: TaskPriority.medium,
  },
  {
    title: "Improve report loading speed",
    status: TaskStatus.in_progress,
    label: TaskLabel.enhancement,
    priority: TaskPriority.medium,
  },
  {
    title: "Document API endpoints",
    status: TaskStatus.todo,
    label: TaskLabel.documentation,
    priority: TaskPriority.low,
  },
  {
    title: "Fix mobile layout issues",
    status: TaskStatus.done,
    label: TaskLabel.bug,
    priority: TaskPriority.high,
  },
  {
    title: "Add bulk student import",
    status: TaskStatus.todo,
    label: TaskLabel.feature,
    priority: TaskPriority.high,
  },
  {
    title: "Update teacher dashboard",
    status: TaskStatus.in_progress,
    label: TaskLabel.enhancement,
    priority: TaskPriority.medium,
  },
  {
    title: "Fix notification delivery",
    status: TaskStatus.done,
    label: TaskLabel.bug,
    priority: TaskPriority.high,
  },
  {
    title: "Add parent portal features",
    status: TaskStatus.todo,
    label: TaskLabel.feature,
    priority: TaskPriority.medium,
  },
  {
    title: "Optimize database queries",
    status: TaskStatus.in_progress,
    label: TaskLabel.enhancement,
    priority: TaskPriority.high,
  },
  {
    title: "Write unit tests for auth",
    status: TaskStatus.todo,
    label: TaskLabel.documentation,
    priority: TaskPriority.medium,
  },
  {
    title: "Fix calendar sync issue",
    status: TaskStatus.done,
    label: TaskLabel.bug,
    priority: TaskPriority.medium,
  },
  {
    title: "Add SMS notifications",
    status: TaskStatus.todo,
    label: TaskLabel.feature,
    priority: TaskPriority.low,
  },
  {
    title: "Improve search functionality",
    status: TaskStatus.in_progress,
    label: TaskLabel.enhancement,
    priority: TaskPriority.medium,
  },
  {
    title: "Document deployment process",
    status: TaskStatus.done,
    label: TaskLabel.documentation,
    priority: TaskPriority.low,
  },
  {
    title: "Fix PDF export formatting",
    status: TaskStatus.todo,
    label: TaskLabel.bug,
    priority: TaskPriority.medium,
  },
  {
    title: "Add multi-language support",
    status: TaskStatus.done,
    label: TaskLabel.feature,
    priority: TaskPriority.high,
  },
  {
    title: "Optimize image loading",
    status: TaskStatus.in_progress,
    label: TaskLabel.enhancement,
    priority: TaskPriority.low,
  },
  {
    title: "Update user manual",
    status: TaskStatus.todo,
    label: TaskLabel.documentation,
    priority: TaskPriority.low,
  },
]

// ============================================================================
// LESSON TEMPLATES (Additional bilingual lessons)
// ============================================================================

const ADDITIONAL_LESSONS = [
  {
    title: "الجمع والطرح | Addition and Subtraction",
    subject: "Mathematics",
    grade: "Grade 1",
  },
  {
    title: "الحروف الأبجدية | Alphabet Letters",
    subject: "Arabic",
    grade: "Grade 1",
  },
  {
    title: "My Family and Friends",
    subject: "English Language",
    grade: "Grade 2",
  },
  {
    title: "النباتات والحيوانات | Plants and Animals",
    subject: "Science",
    grade: "Grade 3",
  },
  {
    title: "الوضوء والصلاة | Wudu and Prayer",
    subject: "Islamic Studies",
    grade: "Grade 2",
  },
  {
    title: "خريطة السودان | Map of Sudan",
    subject: "Geography",
    grade: "Grade 4",
  },
  {
    title: "الضرب والقسمة | Multiplication and Division",
    subject: "Mathematics",
    grade: "Grade 3",
  },
  {
    title: "قصص الأنبياء | Stories of Prophets",
    subject: "Islamic Studies",
    grade: "Grade 4",
  },
  {
    title: "Reading Comprehension Basics",
    subject: "English Language",
    grade: "Grade 3",
  },
  { title: "جسم الإنسان | Human Body", subject: "Science", grade: "Grade 5" },
]

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

export async function seedMissingData(
  prisma: SeedPrisma,
  schoolId: string
): Promise<void> {
  console.log(
    "🔧 Seeding missing data (invoices, notifications, tasks, etc.)..."
  )

  const now = new Date()
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  // Get required references
  const [adminUser, students, teachers, guardians, classes] = await Promise.all(
    [
      prisma.user.findFirst({
        where: { email: "admin@databayt.org" },
        select: { id: true },
      }),
      prisma.student.findMany({
        where: { schoolId },
        select: { id: true, givenName: true, userId: true },
        take: 100,
      }),
      prisma.teacher.findMany({
        where: { schoolId, userId: { not: null } },
        select: { id: true, userId: true, givenName: true },
        take: 20,
      }),
      prisma.guardian.findMany({
        where: { schoolId, userId: { not: null } },
        include: {
          studentGuardians: {
            include: { student: { select: { givenName: true } } },
            take: 1,
          },
        },
        take: 50,
      }),
      prisma.class.findMany({
        where: { schoolId },
        select: { id: true, name: true },
        take: 50,
      }),
    ]
  )

  if (!adminUser) {
    console.log("   ⚠️  No admin user found, some seeds skipped")
  }

  // === 1. INVOICES ===
  const existingInvoices = await prisma.userInvoice.count({
    where: { schoolId },
  })
  if (existingInvoices < 10) {
    console.log("   📄 Creating invoices...")
    let invoiceCount = 0

    for (let i = 0; i < Math.min(50, students.length); i++) {
      const student = students[i]
      if (!student.userId) continue

      const invoiceDate = new Date(
        threeMonthsAgo.getTime() +
          Math.random() * (now.getTime() - threeMonthsAgo.getTime())
      )
      const dueDate = new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000)
      const status =
        Math.random() > 0.3
          ? InvoiceStatus.PAID
          : Math.random() > 0.5
            ? InvoiceStatus.UNPAID
            : InvoiceStatus.OVERDUE

      // Create addresses first
      const fromAddress = await prisma.userInvoiceAddress.create({
        data: {
          schoolId,
          name: "مدرسة تجريبية | Demo School",
          email: "finance@demo.databayt.org",
          address1: "شارع الجامعة، الخرطوم | University Street, Khartoum",
        },
      })

      const toAddress = await prisma.userInvoiceAddress.create({
        data: {
          schoolId,
          name: `ولي أمر ${student.givenName}`,
          email: `parent${i + 1}@demo.databayt.org`,
          address1: `الخرطوم، السودان | Khartoum, Sudan`,
        },
      })

      // Select random items
      const selectedItems = [
        INVOICE_ITEMS.tuition[
          Math.floor(Math.random() * INVOICE_ITEMS.tuition.length)
        ],
        INVOICE_ITEMS.activities[
          Math.floor(Math.random() * INVOICE_ITEMS.activities.length)
        ],
      ]
      if (Math.random() > 0.5) {
        selectedItems.push(
          INVOICE_ITEMS.misc[
            Math.floor(Math.random() * INVOICE_ITEMS.misc.length)
          ]
        )
      }

      const subTotal = selectedItems.reduce((sum, item) => sum + item.price, 0)
      const discount = Math.random() > 0.7 ? subTotal * 0.1 : 0
      const total = subTotal - discount

      // Create invoice
      const invoice = await prisma.userInvoice.create({
        data: {
          schoolId,
          userId: student.userId,
          invoice_no: `INV-${new Date().getFullYear()}-${String(i + 1).padStart(4, "0")}`,
          invoice_date: invoiceDate,
          due_date: dueDate,
          currency: "SDG",
          fromAddressId: fromAddress.id,
          toAddressId: toAddress.id,
          sub_total: subTotal,
          discount,
          tax_percentage: 0,
          total,
          status,
          notes:
            Math.random() > 0.5
              ? "شكراً لاختياركم مدرستنا | Thank you for choosing our school"
              : null,
        },
      })

      // Create invoice items
      await prisma.userInvoiceItem.createMany({
        data: selectedItems.map((item) => ({
          schoolId,
          invoiceId: invoice.id,
          item_name: Math.random() > 0.5 ? item.nameAr : item.nameEn,
          quantity: 1,
          price: item.price,
          total: item.price,
        })),
      })

      invoiceCount++
    }
    console.log(`      ✅ Created ${invoiceCount} invoices`)
  } else {
    console.log(`   ✅ Invoices already exist (${existingInvoices}), skipping`)
  }

  // === 2. NOTIFICATIONS ===
  const existingNotifications = await prisma.notification.count({
    where: { schoolId },
  })
  if (existingNotifications < 20) {
    console.log("   🔔 Creating notifications...")

    const notificationRecords: {
      schoolId: string
      userId: string
      type: NotificationType
      priority: NotificationPriority
      title: string
      body: string
      channels: NotificationChannel[]
      read: boolean
      readAt: Date | null
      actorId: string | null
      createdAt: Date
    }[] = []

    const allUsers = [
      ...students.filter((s) => s.userId).map((s) => s.userId!),
      ...teachers.filter((t) => t.userId).map((t) => t.userId!),
      ...guardians.filter((g) => g.userId).map((g) => g.userId!),
    ]

    // Create 200 notifications distributed across users
    for (let i = 0; i < 200 && allUsers.length > 0; i++) {
      const template = NOTIFICATION_TEMPLATES[i % NOTIFICATION_TEMPLATES.length]
      const userId = allUsers[i % allUsers.length]
      const useArabic = Math.random() > 0.5
      const isRead = Math.random() > 0.4
      const createdAt = new Date(
        threeMonthsAgo.getTime() +
          Math.random() * (now.getTime() - threeMonthsAgo.getTime())
      )

      notificationRecords.push({
        schoolId,
        userId,
        type: template.type,
        priority: template.priority,
        title: useArabic ? template.titleAr : template.titleEn,
        body: useArabic ? template.bodyAr : template.bodyEn,
        channels: [NotificationChannel.in_app],
        read: isRead,
        readAt: isRead
          ? new Date(createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000)
          : null,
        actorId: adminUser?.id || null,
        createdAt,
      })
    }

    await prisma.notification.createMany({
      data: notificationRecords,
      skipDuplicates: true,
    })
    console.log(`      ✅ Created ${notificationRecords.length} notifications`)
  } else {
    console.log(
      `   ✅ Notifications already exist (${existingNotifications}), skipping`
    )
  }

  // === 3. TASKS (for data-table demo) ===
  const existingTasks = await prisma.task.count({ where: { schoolId } })
  if (existingTasks < 10) {
    console.log("   📋 Creating tasks...")

    await prisma.task.createMany({
      data: TASK_TEMPLATES.map((task, i) => ({
        schoolId,
        code: `TASK-${String(i + 1).padStart(3, "0")}`,
        title: task.title,
        status: task.status,
        label: task.label,
        priority: task.priority,
        estimatedHours: Math.floor(Math.random() * 20) + 1,
        archived: Math.random() > 0.9,
      })),
      skipDuplicates: true,
    })
    console.log(`      ✅ Created ${TASK_TEMPLATES.length} tasks`)
  } else {
    console.log(`   ✅ Tasks already exist (${existingTasks}), skipping`)
  }

  // === 4. LESSONS (if empty) ===
  const existingLessons = await prisma.lesson.count({ where: { schoolId } })
  if (existingLessons < 10 && classes.length > 0) {
    console.log("   📖 Creating lesson plans...")

    const lessonRecords: {
      schoolId: string
      classId: string
      title: string
      description: string
      lessonDate: Date
      startTime: string
      endTime: string
      objectives: string
      materials: string
      activities: string
      assessment: string
      notes: string
      status: LessonStatus
    }[] = []

    for (let i = 0; i < 100; i++) {
      const template = ADDITIONAL_LESSONS[i % ADDITIONAL_LESSONS.length]
      const targetClass = classes[i % classes.length]
      const dayOffset = i < 30 ? -(30 - i) : (i - 30) * 2
      const lessonDate = new Date(now)
      lessonDate.setDate(lessonDate.getDate() + dayOffset)

      const status =
        dayOffset < -7
          ? LessonStatus.COMPLETED
          : dayOffset < 3
            ? LessonStatus.IN_PROGRESS
            : LessonStatus.PLANNED
      const startHour = 8 + (i % 6)

      lessonRecords.push({
        schoolId,
        classId: targetClass.id,
        title: template.title,
        description: `Comprehensive lesson for ${template.grade}: ${template.title}`,
        lessonDate,
        startTime: `${String(startHour).padStart(2, "0")}:00`,
        endTime: `${String(startHour).padStart(2, "0")}:55`,
        objectives: `فهم وتطبيق ${template.title} | Understand and apply ${template.title}`,
        materials:
          "Textbook, Whiteboard, Worksheets, Visual aids | كتاب، سبورة، أوراق عمل، وسائل بصرية",
        activities:
          "Introduction (10 min), Direct instruction (15 min), Practice (20 min), Assessment (10 min)",
        assessment: "Class participation, Worksheet completion, Exit ticket",
        notes: `Homework: Complete exercises from textbook | الواجب: حل تمارين الكتاب`,
        status,
      })
    }

    await prisma.lesson.createMany({
      data: lessonRecords,
      skipDuplicates: true,
    })
    console.log(`      ✅ Created ${lessonRecords.length} lessons`)
  } else {
    console.log(`   ✅ Lessons already exist (${existingLessons}), skipping`)
  }

  // === 5. CONVERSATIONS & MESSAGES (if empty) ===
  const existingConversations = await prisma.conversation.count({
    where: { schoolId },
  })
  if (
    existingConversations < 10 &&
    teachers.length > 0 &&
    guardians.length > 0
  ) {
    console.log("   💬 Creating conversations and messages...")

    let conversationCount = 0
    let messageCount = 0

    const messageTopics = [
      {
        parentAr: "السلام عليكم، كيف حال ابني في الصف؟",
        parentEn: "Hello, how is my child doing in class?",
        teacherAr:
          "وعليكم السلام، ابنك طالب مجتهد وملتزم. يشارك بنشاط في الحصص.",
        teacherEn:
          "Hello, your child is a hardworking and committed student. They participate actively in class.",
      },
      {
        parentAr: "هل يمكنني معرفة موعد الامتحان القادم؟",
        parentEn: "Can I know when the next exam is?",
        teacherAr: "نعم، الامتحان القادم يوم الأحد. سأرسل لكم جدول المراجعة.",
        teacherEn:
          "Yes, the next exam is on Sunday. I'll send you the revision schedule.",
      },
      {
        parentAr: "ابني سيتغيب غداً بسبب موعد طبي.",
        parentEn:
          "My child will be absent tomorrow due to a medical appointment.",
        teacherAr: "شكراً لإعلامي. سأحضر له الواجبات الفائتة.",
        teacherEn:
          "Thank you for informing me. I'll prepare the missed assignments for them.",
      },
    ]

    for (let i = 0; i < Math.min(30, guardians.length); i++) {
      const guardian = guardians[i]
      const teacher = teachers[i % teachers.length]

      if (!guardian.userId || !teacher.userId) continue

      const topic = messageTopics[i % messageTopics.length]
      const useArabic = Math.random() > 0.5
      const conversationTime = new Date(
        threeMonthsAgo.getTime() +
          Math.random() * (now.getTime() - threeMonthsAgo.getTime())
      )

      // Create conversation
      const conversation = await prisma.conversation.create({
        data: {
          schoolId,
          type: ConversationType.direct,
          createdById: guardian.userId,
          directParticipant1Id: guardian.userId,
          directParticipant2Id: teacher.userId,
          lastMessageAt: conversationTime,
        },
      })

      // Create participants
      await prisma.conversationParticipant.createMany({
        data: [
          {
            conversationId: conversation.id,
            userId: guardian.userId,
            role: ParticipantRole.owner,
          },
          {
            conversationId: conversation.id,
            userId: teacher.userId,
            role: ParticipantRole.member,
          },
        ],
        skipDuplicates: true,
      })

      // Create messages (2-4 per conversation)
      const messageCountForConv = 2 + Math.floor(Math.random() * 3)
      for (let j = 0; j < messageCountForConv; j++) {
        const isParent = j % 2 === 0
        const senderId = isParent ? guardian.userId : teacher.userId
        let content: string
        if (isParent) {
          content = useArabic ? topic.parentAr : topic.parentEn
        } else {
          content = useArabic ? topic.teacherAr : topic.teacherEn
        }

        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderId,
            content,
            contentType: "text",
            status: MessageStatus.delivered,
            createdAt: new Date(
              conversationTime.getTime() + j * 60 * 60 * 1000
            ),
          },
        })
        messageCount++
      }
      conversationCount++
    }
    console.log(
      `      ✅ Created ${conversationCount} conversations with ${messageCount} messages`
    )
  } else {
    console.log(
      `   ✅ Conversations already exist (${existingConversations}), skipping`
    )
  }

  // === 6. HEALTH RECORDS (if empty) ===
  const existingHealth = await prisma.healthRecord.count({
    where: { schoolId },
  })
  if (existingHealth < 50 && students.length > 0) {
    console.log("   🏥 Creating health records...")

    const healthTypes = [
      "Vaccination",
      "Medical Check-up",
      "Incident",
      "Illness",
    ]
    const healthRecords: {
      schoolId: string
      studentId: string
      recordDate: Date
      recordType: string
      title: string
      description: string
      severity: string | null
      doctorName: string | null
      hospitalName: string | null
      recordedBy: string
    }[] = []

    for (let i = 0; i < Math.min(200, students.length * 2); i++) {
      const student = students[i % students.length]
      const recordType = healthTypes[i % healthTypes.length]
      const useArabic = Math.random() > 0.5

      let title: string,
        description: string,
        severity: string | null = "Low"
      switch (recordType) {
        case "Vaccination":
          title = useArabic ? "التطعيم السنوي" : "Annual Vaccination"
          description = useArabic
            ? "تم تطعيم الطالب ضمن برنامج التطعيم المدرسي"
            : "Student vaccinated as part of school immunization program"
          severity = null
          break
        case "Medical Check-up":
          title = useArabic ? "الفحص الصحي الدوري" : "Routine Health Check-up"
          description = useArabic
            ? "فحص صحي روتيني، النتائج طبيعية"
            : "Routine health screening, results normal"
          break
        case "Incident":
          title = useArabic ? "إصابة طفيفة" : "Minor Injury"
          description = useArabic
            ? "إصابة طفيفة أثناء الاستراحة، تم تطبيق الإسعافات الأولية"
            : "Minor injury during recess, first aid applied"
          break
        default:
          title = useArabic ? "شكوى صحية" : "Health Complaint"
          description = useArabic
            ? "اشتكى الطالب من صداع، تم إرساله للمنزل"
            : "Student complained of headache, sent home"
          severity = "Medium"
      }

      healthRecords.push({
        schoolId,
        studentId: student.id,
        recordDate: new Date(
          threeMonthsAgo.getTime() +
            Math.random() * (now.getTime() - threeMonthsAgo.getTime())
        ),
        recordType,
        title,
        description,
        severity,
        doctorName:
          recordType === "Medical Check-up" ? "Dr. Ahmed Hassan" : null,
        hospitalName:
          recordType === "Medical Check-up" ? "Khartoum Medical Center" : null,
        recordedBy: adminUser?.id || "system",
      })
    }

    await prisma.healthRecord.createMany({
      data: healthRecords,
      skipDuplicates: true,
    })
    console.log(`      ✅ Created ${healthRecords.length} health records`)
  } else {
    console.log(
      `   ✅ Health records already exist (${existingHealth}), skipping`
    )
  }

  console.log("   ✅ Missing data seed completed\n")
}
