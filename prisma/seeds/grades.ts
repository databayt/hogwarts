/**
 * Grades Seed Module - Bilingual (AR/EN)
 * Creates 50,000+ academic results for comprehensive grade reporting
 *
 * Structure:
 * - 100 students × 10 subjects × 4 terms × ~12 assessments = 48,000+ base records
 * - Plus assignment and exam results
 * - Sudanese grading scale (A+ to F)
 * - GPA 4.0 scale calculation
 * - Realistic score distributions
 *
 * Terms: 2 per academic year (Term 1, Term 2)
 * Coverage: Current year + Previous year = 4 terms total
 */

import { faker } from "@faker-js/faker"

import type {
  ClassRef,
  SeedPrisma,
  StudentRef,
  SubjectRef,
  TeacherRef,
} from "./types"

// Grade calculation helper - Sudanese scale
function calculateGrade(percentage: number): string {
  if (percentage >= 95) return "A+"
  if (percentage >= 90) return "A"
  if (percentage >= 85) return "A-"
  if (percentage >= 80) return "B+"
  if (percentage >= 75) return "B"
  if (percentage >= 70) return "B-"
  if (percentage >= 65) return "C+"
  if (percentage >= 60) return "C"
  if (percentage >= 55) return "C-"
  if (percentage >= 50) return "D+"
  if (percentage >= 45) return "D"
  return "F"
}

// Comprehensive bilingual assessment types
const ASSESSMENT_TYPES = [
  // Regular Assessments (Weekly/Bi-weekly)
  {
    titleEn: "Homework Assignment",
    titleAr: "واجب منزلي",
    maxScore: 20,
    frequency: 8,
  },
  {
    titleEn: "Weekly Quiz",
    titleAr: "اختبار أسبوعي",
    maxScore: 25,
    frequency: 4,
  },
  {
    titleEn: "Class Participation",
    titleAr: "مشاركة صفية",
    maxScore: 10,
    frequency: 2,
  },
  // Monthly Assessments
  {
    titleEn: "Monthly Test",
    titleAr: "اختبار شهري",
    maxScore: 50,
    frequency: 2,
  },
  {
    titleEn: "Oral Assessment",
    titleAr: "تقييم شفهي",
    maxScore: 25,
    frequency: 2,
  },
  // Projects & Reports
  {
    titleEn: "Project Submission",
    titleAr: "تسليم مشروع",
    maxScore: 50,
    frequency: 1,
  },
  { titleEn: "Lab Report", titleAr: "تقرير معملي", maxScore: 30, frequency: 1 },
  {
    titleEn: "Research Paper",
    titleAr: "بحث علمي",
    maxScore: 40,
    frequency: 1,
  },
  { titleEn: "Book Report", titleAr: "تقرير كتاب", maxScore: 30, frequency: 1 },
  {
    titleEn: "Group Project",
    titleAr: "مشروع جماعي",
    maxScore: 50,
    frequency: 1,
  },
  // Major Exams
  {
    titleEn: "Midterm Exam",
    titleAr: "اختبار نصف الفصل",
    maxScore: 50,
    frequency: 1,
  },
  {
    titleEn: "Final Exam",
    titleAr: "الاختبار النهائي",
    maxScore: 100,
    frequency: 1,
  },
  // Subject-Specific
  {
    titleEn: "Practical Test",
    titleAr: "اختبار عملي",
    maxScore: 50,
    frequency: 1,
  },
  {
    titleEn: "Quran Recitation",
    titleAr: "تلاوة القرآن",
    maxScore: 25,
    frequency: 2,
  },
  {
    titleEn: "Arabic Dictation",
    titleAr: "إملاء عربي",
    maxScore: 20,
    frequency: 4,
  },
  {
    titleEn: "Essay Writing",
    titleAr: "مقال كتابي",
    maxScore: 40,
    frequency: 2,
  },
  {
    titleEn: "Math Problem Set",
    titleAr: "مسائل رياضيات",
    maxScore: 30,
    frequency: 4,
  },
  {
    titleEn: "Science Experiment",
    titleAr: "تجربة علمية",
    maxScore: 35,
    frequency: 2,
  },
  {
    titleEn: "English Composition",
    titleAr: "إنشاء إنجليزي",
    maxScore: 30,
    frequency: 2,
  },
  {
    titleEn: "Presentation",
    titleAr: "عرض تقديمي",
    maxScore: 25,
    frequency: 1,
  },
]

// Expanded bilingual feedback templates
const FEEDBACK_TEMPLATES = {
  excellent: [
    { en: "Outstanding work! Keep it up!", ar: "عمل متميز! استمر!" },
    {
      en: "Excellent performance. Shows deep understanding.",
      ar: "أداء ممتاز. يُظهر فهماً عميقاً.",
    },
    { en: "Impressive work. Very well done!", ar: "عمل مثير للإعجاب. أحسنت!" },
    {
      en: "Exceptional effort and understanding demonstrated.",
      ar: "جهد استثنائي وفهم واضح.",
    },
    {
      en: "Superb work. You've exceeded expectations.",
      ar: "عمل رائع. تجاوزت التوقعات.",
    },
    {
      en: "A role model for your peers. Excellent!",
      ar: "قدوة لزملائك. ممتاز!",
    },
    { en: "Mastery of the material demonstrated.", ar: "إتقان واضح للمادة." },
    {
      en: "Consistently brilliant work. Ma sha Allah!",
      ar: "عمل رائع باستمرار. ما شاء الله!",
    },
    {
      en: "Shows leadership in academic excellence.",
      ar: "يُظهر ريادة في التفوق الأكاديمي.",
    },
    { en: "Perfect understanding of concepts.", ar: "فهم مثالي للمفاهيم." },
  ],
  good: [
    { en: "Good work. Keep improving!", ar: "عمل جيد. استمر في التحسن!" },
    {
      en: "Well done. A few areas to strengthen.",
      ar: "أحسنت. بعض الجوانب تحتاج تقوية.",
    },
    {
      en: "Solid performance. Continue this effort.",
      ar: "أداء قوي. استمر في هذا الجهد.",
    },
    {
      en: "Good understanding shown. Keep practicing.",
      ar: "فهم جيد. واصل الممارسة.",
    },
    {
      en: "Nice work! Some room for improvement.",
      ar: "عمل جيد! هناك مجال للتحسن.",
    },
    {
      en: "Making steady progress. Well done!",
      ar: "تحرز تقدماً ثابتاً. أحسنت!",
    },
    { en: "Shows dedication and effort.", ar: "يُظهر التفاني والجهد." },
    {
      en: "Above average performance. Keep pushing.",
      ar: "أداء فوق المتوسط. استمر.",
    },
    { en: "Good grasp of the material.", ar: "استيعاب جيد للمادة." },
    {
      en: "Commendable effort. Build on this.",
      ar: "جهد يستحق الإشادة. ابنِ على هذا.",
    },
  ],
  average: [
    {
      en: "Satisfactory work. More practice needed.",
      ar: "عمل مرضٍ. يحتاج المزيد من الممارسة.",
    },
    {
      en: "Average performance. Focus on weak areas.",
      ar: "أداء متوسط. ركز على نقاط الضعف.",
    },
    {
      en: "Acceptable work. Try to be more thorough.",
      ar: "عمل مقبول. حاول أن تكون أكثر دقة.",
    },
    {
      en: "Basic understanding shown. Keep working hard.",
      ar: "فهم أساسي. واصل العمل بجد.",
    },
    {
      en: "Decent effort. Review the material again.",
      ar: "جهد لا بأس به. راجع المادة مرة أخرى.",
    },
    {
      en: "Can do better with more effort.",
      ar: "يمكنك الأفضل بمزيد من الجهد.",
    },
    {
      en: "Needs more attention to details.",
      ar: "يحتاج المزيد من الاهتمام بالتفاصيل.",
    },
    {
      en: "Room for improvement. Stay focused.",
      ar: "هناك مجال للتحسن. ابقَ مركزاً.",
    },
    {
      en: "Meeting minimum requirements. Aim higher.",
      ar: "تحقيق الحد الأدنى. اطمح للأعلى.",
    },
    {
      en: "Adequate work. More effort will show results.",
      ar: "عمل كافٍ. المزيد من الجهد سيُظهر النتائج.",
    },
  ],
  needsImprovement: [
    {
      en: "Needs improvement. Please seek help if needed.",
      ar: "يحتاج تحسناً. اطلب المساعدة إن لزم.",
    },
    {
      en: "More effort required. Consider extra practice.",
      ar: "يتطلب المزيد من الجهد. فكر في الممارسة الإضافية.",
    },
    {
      en: "Below expectations. Let's discuss how to improve.",
      ar: "أقل من المتوقع. دعنا نناقش كيفية التحسن.",
    },
    {
      en: "Struggling with concepts. Extra support recommended.",
      ar: "يواجه صعوبة في المفاهيم. يُنصح بالدعم الإضافي.",
    },
    {
      en: "Requires more attention. Don't hesitate to ask for help.",
      ar: "يحتاج المزيد من الاهتمام. لا تتردد في طلب المساعدة.",
    },
    {
      en: "Must improve. Consider tutoring sessions.",
      ar: "يجب التحسن. فكر في دروس خصوصية.",
    },
    {
      en: "Needs significant improvement in this area.",
      ar: "يحتاج تحسناً كبيراً في هذا المجال.",
    },
    {
      en: "Please review fundamentals and practice more.",
      ar: "يرجى مراجعة الأساسيات والممارسة أكثر.",
    },
    {
      en: "Attend remedial classes for better understanding.",
      ar: "احضر الحصص التعويضية لفهم أفضل.",
    },
    {
      en: "Work closely with teacher for improvement.",
      ar: "اعمل مع المعلم عن قرب للتحسن.",
    },
  ],
}

function getFeedback(percentage: number): string {
  let templateSet
  if (percentage >= 85) {
    templateSet = FEEDBACK_TEMPLATES.excellent
  } else if (percentage >= 70) {
    templateSet = FEEDBACK_TEMPLATES.good
  } else if (percentage >= 55) {
    templateSet = FEEDBACK_TEMPLATES.average
  } else {
    templateSet = FEEDBACK_TEMPLATES.needsImprovement
  }

  const feedback = faker.helpers.arrayElement(templateSet)
  return `${feedback.ar} | ${feedback.en}`
}

// Generate a student's academic profile (consistent performance level)
function generateStudentProfile(): { baseLevel: number; variation: number } {
  const rand = Math.random()
  // Distribution: 15% excellent, 30% good, 35% average, 20% struggling
  if (rand < 0.15) {
    return { baseLevel: 85, variation: 10 } // Excellent: 75-95
  } else if (rand < 0.45) {
    return { baseLevel: 75, variation: 12 } // Good: 63-87
  } else if (rand < 0.8) {
    return { baseLevel: 62, variation: 15 } // Average: 47-77
  } else {
    return { baseLevel: 50, variation: 18 } // Struggling: 32-68
  }
}

// Generate score based on student profile with some random variation
function generateScore(
  profile: { baseLevel: number; variation: number },
  maxScore: number
): number {
  const percentage = Math.max(
    0,
    Math.min(
      100,
      profile.baseLevel +
        faker.number.int({ min: -profile.variation, max: profile.variation })
    )
  )
  return Math.round((percentage / 100) * maxScore)
}

// Get assessment types applicable to a subject
function getSubjectAssessments(subjectName: string): typeof ASSESSMENT_TYPES {
  const baseAssessments = ASSESSMENT_TYPES.filter(
    (a) =>
      a.titleEn.includes("Homework") ||
      a.titleEn.includes("Quiz") ||
      a.titleEn.includes("Participation") ||
      a.titleEn.includes("Monthly") ||
      a.titleEn.includes("Midterm") ||
      a.titleEn.includes("Final")
  )

  // Add subject-specific assessments
  const lowerName = subjectName.toLowerCase()

  if (lowerName.includes("arabic") || lowerName.includes("عربي")) {
    return [
      ...baseAssessments,
      ...ASSESSMENT_TYPES.filter(
        (a) => a.titleEn.includes("Dictation") || a.titleEn.includes("Essay")
      ),
    ]
  }
  if (
    lowerName.includes("quran") ||
    lowerName.includes("islamic") ||
    lowerName.includes("قرآن") ||
    lowerName.includes("إسلام")
  ) {
    return [
      ...baseAssessments,
      ...ASSESSMENT_TYPES.filter(
        (a) => a.titleEn.includes("Quran") || a.titleEn.includes("Oral")
      ),
    ]
  }
  if (lowerName.includes("math") || lowerName.includes("رياضيات")) {
    return [
      ...baseAssessments,
      ...ASSESSMENT_TYPES.filter((a) => a.titleEn.includes("Problem Set")),
    ]
  }
  if (
    lowerName.includes("science") ||
    lowerName.includes("physics") ||
    lowerName.includes("chemistry") ||
    lowerName.includes("biology") ||
    lowerName.includes("علوم") ||
    lowerName.includes("فيزياء") ||
    lowerName.includes("كيمياء") ||
    lowerName.includes("أحياء")
  ) {
    return [
      ...baseAssessments,
      ...ASSESSMENT_TYPES.filter(
        (a) =>
          a.titleEn.includes("Lab") ||
          a.titleEn.includes("Experiment") ||
          a.titleEn.includes("Practical")
      ),
    ]
  }
  if (lowerName.includes("english") || lowerName.includes("إنجليزي")) {
    return [
      ...baseAssessments,
      ...ASSESSMENT_TYPES.filter(
        (a) => a.titleEn.includes("Composition") || a.titleEn.includes("Essay")
      ),
    ]
  }

  // Default: add projects and presentations
  return [
    ...baseAssessments,
    ...ASSESSMENT_TYPES.filter(
      (a) => a.titleEn.includes("Project") || a.titleEn.includes("Presentation")
    ),
  ]
}

export async function seedGrades(
  prisma: SeedPrisma,
  schoolId: string,
  classes: ClassRef[],
  subjects: SubjectRef[],
  students: StudentRef[],
  teachers: TeacherRef[]
): Promise<void> {
  console.log(
    "📝 Creating academic results (50,000+ records, Bilingual AR/EN)..."
  )

  // Check if we already have enough results
  const existingCount = await prisma.result.count({ where: { schoolId } })
  if (existingCount >= 45000) {
    console.log(
      `   ⏭️ Already have ${existingCount.toLocaleString()} results, skipping...\n`
    )
    return
  }

  // Get all subject details
  const subjectDetails = await prisma.subject.findMany({
    where: { schoolId },
    select: { id: true, subjectName: true },
  })
  const subjectNameMap = new Map(
    subjectDetails.map((s) => [s.id, s.subjectName])
  )

  // Get student-class enrollments using StudentClass model
  const studentClasses = await prisma.studentClass.findMany({
    where: { schoolId },
    select: { studentId: true, classId: true },
  })

  // Create a map of classId -> studentIds
  const classStudentMap = new Map<string, string[]>()
  for (const sc of studentClasses) {
    const studentList = classStudentMap.get(sc.classId) || []
    studentList.push(sc.studentId)
    classStudentMap.set(sc.classId, studentList)
  }

  // Get classes with their subjectId
  const classesWithSubject = await prisma.class.findMany({
    where: { schoolId },
    select: { id: true, subjectId: true },
  })

  // Create a map of classId -> subjectId
  const classSubjectMap = new Map<string, string>()
  for (const cls of classesWithSubject) {
    classSubjectMap.set(cls.id, cls.subjectId)
  }

  // Create student performance profiles (consistent across terms)
  const studentProfiles = new Map<
    string,
    { baseLevel: number; variation: number }
  >()
  for (const student of students) {
    studentProfiles.set(student.id, generateStudentProfile())
  }

  // Define academic terms (4 terms: 2 years × 2 terms each)
  const currentYear = new Date().getFullYear()
  const terms = [
    { year: currentYear - 1, term: 1, startMonth: 8, endMonth: 12 }, // Previous Year Term 1
    { year: currentYear - 1, term: 2, startMonth: 1, endMonth: 5 }, // Previous Year Term 2
    { year: currentYear, term: 1, startMonth: 8, endMonth: 12 }, // Current Year Term 1
    { year: currentYear, term: 2, startMonth: 1, endMonth: 5 }, // Current Year Term 2 (ongoing)
  ]

  const results: {
    schoolId: string
    studentId: string
    classId: string
    subjectId?: string
    score: number
    maxScore: number
    percentage: number
    grade: string
    title: string
    feedback: string
    gradedAt: Date
  }[] = []

  // Generate comprehensive results for all student-subject combinations
  for (const classObj of classes) {
    const classStudents = classStudentMap.get(classObj.id) || []
    const subjectId = classSubjectMap.get(classObj.id)
    const subjectName = subjectId
      ? subjectNameMap.get(subjectId) || "General"
      : "General"
    const applicableAssessments = getSubjectAssessments(subjectName)

    for (const studentId of classStudents) {
      const profile = studentProfiles.get(studentId) || generateStudentProfile()

      // Generate results for each term
      for (const termInfo of terms) {
        // Skip future months for current term
        const isCurrentTerm =
          termInfo.year === currentYear && termInfo.term === 2
        const currentMonth = new Date().getMonth() + 1
        const effectiveEndMonth = isCurrentTerm
          ? Math.min(currentMonth, termInfo.endMonth)
          : termInfo.endMonth

        // Generate results for each assessment type
        for (const assessment of applicableAssessments) {
          // Generate multiple instances based on frequency
          for (let i = 0; i < assessment.frequency; i++) {
            // Determine grading date within the term
            const monthRange = effectiveEndMonth - termInfo.startMonth + 1
            if (monthRange <= 0) continue

            const gradingMonth =
              termInfo.startMonth + Math.floor(Math.random() * monthRange)
            const gradingYear =
              termInfo.term === 2 && termInfo.startMonth === 1
                ? termInfo.year
                : termInfo.term === 1
                  ? termInfo.year
                  : termInfo.year

            const gradingDate = new Date(
              gradingYear,
              gradingMonth - 1,
              faker.number.int({ min: 1, max: 28 })
            )

            // Skip if grading date is in the future
            if (gradingDate > new Date()) continue

            // 92% completion rate for regular work
            if (Math.random() > 0.92 && !assessment.titleEn.includes("Exam"))
              continue
            // 97% attendance for exams
            if (Math.random() > 0.97 && assessment.titleEn.includes("Exam"))
              continue

            const score = generateScore(profile, assessment.maxScore)
            const percentage = Math.round((score / assessment.maxScore) * 100)
            const grade = calculateGrade(percentage)

            results.push({
              schoolId,
              studentId,
              classId: classObj.id,
              subjectId: subjectId || undefined,
              score,
              maxScore: assessment.maxScore,
              percentage,
              grade,
              title: `${assessment.titleAr} | ${assessment.titleEn} - ${termInfo.year} T${termInfo.term} #${i + 1}`,
              feedback: getFeedback(percentage),
              gradedAt: gradingDate,
            })
          }
        }
      }
    }
  }

  // Add results from existing assignments and exams
  const assignments = await prisma.assignment.findMany({
    where: { schoolId },
    select: { id: true, title: true, totalPoints: true, classId: true },
  })

  const exams = await prisma.exam.findMany({
    where: { schoolId },
    select: {
      id: true,
      title: true,
      totalMarks: true,
      classId: true,
      subjectId: true,
    },
  })

  // Assignment results
  for (const assignment of assignments) {
    const classStudents = classStudentMap.get(assignment.classId) || []
    const subjectId = classSubjectMap.get(assignment.classId)

    for (const studentId of classStudents) {
      if (Math.random() < 0.9) {
        const profile =
          studentProfiles.get(studentId) || generateStudentProfile()
        const maxScore = Number(assignment.totalPoints) || 100
        const score = generateScore(profile, maxScore)
        const percentage = Math.round((score / maxScore) * 100)

        results.push({
          schoolId,
          studentId,
          classId: assignment.classId,
          subjectId: subjectId || undefined,
          score,
          maxScore,
          percentage,
          grade: calculateGrade(percentage),
          title: assignment.title || "واجب | Assignment",
          feedback: getFeedback(percentage),
          gradedAt: faker.date.recent({ days: 60 }),
        })
      }
    }
  }

  // Exam results
  for (const exam of exams) {
    if (!exam.classId) continue
    const classStudents = classStudentMap.get(exam.classId) || []

    for (const studentId of classStudents) {
      if (Math.random() < 0.95) {
        const profile =
          studentProfiles.get(studentId) || generateStudentProfile()
        const maxScore = Number(exam.totalMarks) || 100
        const score = generateScore(profile, maxScore)
        const percentage = Math.round((score / maxScore) * 100)

        results.push({
          schoolId,
          studentId,
          classId: exam.classId,
          subjectId: exam.subjectId || undefined,
          score,
          maxScore,
          percentage,
          grade: calculateGrade(percentage),
          title: exam.title || "اختبار | Exam",
          feedback: getFeedback(percentage),
          gradedAt: faker.date.recent({ days: 90 }),
        })
      }
    }
  }

  // Batch insert results in chunks of 5000 for performance
  const BATCH_SIZE = 5000
  let totalInserted = 0

  for (let i = 0; i < results.length; i += BATCH_SIZE) {
    const batch = results.slice(i, i + BATCH_SIZE)
    const inserted = await prisma.result.createMany({
      data: batch.map((r) => ({
        schoolId: r.schoolId,
        studentId: r.studentId,
        classId: r.classId,
        subjectId: r.subjectId,
        score: r.score,
        maxScore: r.maxScore,
        percentage: r.percentage,
        grade: r.grade,
        title: r.title,
        feedback: r.feedback,
        gradedAt: r.gradedAt,
      })),
      skipDuplicates: true,
    })
    totalInserted += inserted.count
    console.log(
      `   📊 Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(results.length / BATCH_SIZE)} (${inserted.count} records)`
    )
  }

  // Calculate final statistics
  const gradeDistribution = results.reduce(
    (acc, r) => {
      acc[r.grade] = (acc[r.grade] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const avgPercentage =
    results.length > 0
      ? Math.round(
          results.reduce((sum, r) => sum + r.percentage, 0) / results.length
        )
      : 0

  const aGrades =
    (gradeDistribution["A"] || 0) +
    (gradeDistribution["A+"] || 0) +
    (gradeDistribution["A-"] || 0)
  const bGrades =
    (gradeDistribution["B"] || 0) +
    (gradeDistribution["B+"] || 0) +
    (gradeDistribution["B-"] || 0)
  const cGrades =
    (gradeDistribution["C"] || 0) +
    (gradeDistribution["C+"] || 0) +
    (gradeDistribution["C-"] || 0)
  const dGrades = (gradeDistribution["D"] || 0) + (gradeDistribution["D+"] || 0)
  const fGrades = gradeDistribution["F"] || 0

  console.log(
    `   ✅ Created: ${totalInserted.toLocaleString()} academic results (of ${results.length.toLocaleString()} generated)`
  )
  console.log(
    `      - Coverage: ${students.length} students × ${subjects.length} subjects × 4 terms`
  )
  console.log(`      - Average percentage: ${avgPercentage}%`)
  console.log(`      - Grade distribution:`)
  console.log(
    `        A (A+/A/A-): ${aGrades.toLocaleString()} (${Math.round((aGrades / results.length) * 100)}%)`
  )
  console.log(
    `        B (B+/B/B-): ${bGrades.toLocaleString()} (${Math.round((bGrades / results.length) * 100)}%)`
  )
  console.log(
    `        C (C+/C/C-): ${cGrades.toLocaleString()} (${Math.round((cGrades / results.length) * 100)}%)`
  )
  console.log(
    `        D (D+/D):    ${dGrades.toLocaleString()} (${Math.round((dGrades / results.length) * 100)}%)`
  )
  console.log(
    `        F:          ${fGrades.toLocaleString()} (${Math.round((fGrades / results.length) * 100)}%)\n`
  )
}
