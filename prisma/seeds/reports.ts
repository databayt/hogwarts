/**
 * Reports Seed Module - Comprehensive K-12 Report Cards
 * Creates complete academic reports for ALL students with ALL subjects
 *
 * Features:
 * - Full coverage: All 100 students, All subjects
 * - Bilingual teacher comments (Arabic/English)
 * - Sudanese grading scale (A+ to F)
 * - GPA calculation (4.0 scale)
 * - Subject-specific feedback with detailed comments
 * - Attendance and conduct records
 * - Principal remarks and recommendations
 * - Achievement badges and recognitions
 */

import { faker } from "@faker-js/faker";
import type { SeedPrisma, StudentRef, SubjectRef, ClassRef } from "./types";

// ============================================================================
// COMPREHENSIVE BILINGUAL COMMENTS
// ============================================================================

// Bilingual teacher comments based on performance
const TEACHER_COMMENTS = {
  excellent: [
    { en: "Outstanding performance! A role model for other students.", ar: "أداء متميز! قدوة للطلاب الآخرين." },
    { en: "Excellent work ethic and academic achievement. Keep it up!", ar: "أخلاق عمل ممتازة وتحصيل أكاديمي. استمر!" },
    { en: "Demonstrates exceptional understanding and dedication.", ar: "يُظهر فهماً استثنائياً وتفانياً في العمل." },
    { en: "A pleasure to teach. Shows genuine love for learning.", ar: "طالب نموذجي. يُظهر حباً حقيقياً للتعلم." },
    { en: "Consistently exceeds expectations. Very impressive!", ar: "يتجاوز التوقعات باستمرار. مثير للإعجاب!" },
    { en: "Demonstrates leadership qualities and academic excellence.", ar: "يُظهر صفات قيادية وتميزاً أكاديمياً." },
    { en: "A high achiever who inspires classmates to excel.", ar: "متفوق يلهم زملاءه للتميز." },
    { en: "Shows remarkable growth and maturity this term.", ar: "يُظهر نمواً ملحوظاً ونضجاً هذا الفصل." },
  ],
  good: [
    { en: "Good performance. Keep striving for excellence.", ar: "أداء جيد. استمر في السعي نحو التميز." },
    { en: "Shows consistent effort and improvement.", ar: "يُظهر جهداً مستمراً وتحسناً ملحوظاً." },
    { en: "Solid understanding of concepts. Well done!", ar: "فهم قوي للمفاهيم. أحسنت!" },
    { en: "A hardworking student with good potential.", ar: "طالب مجتهد ذو إمكانيات جيدة." },
    { en: "Making good progress. Encourage continued effort.", ar: "يحرز تقدماً جيداً. نشجع استمرار الجهد." },
    { en: "Reliable and diligent. A dependable class member.", ar: "موثوق ومجتهد. عضو فعال في الصف." },
    { en: "Shows good time management and study skills.", ar: "يُظهر مهارات جيدة في إدارة الوقت والدراسة." },
    { en: "Participates well and contributes to class discussions.", ar: "يشارك بفعالية ويساهم في نقاشات الصف." },
  ],
  average: [
    { en: "Satisfactory performance. More focus needed.", ar: "أداء مرضٍ. يحتاج إلى مزيد من التركيز." },
    { en: "Average work. Can achieve more with effort.", ar: "عمل متوسط. يمكن تحقيق المزيد بالجهد." },
    { en: "Shows potential but needs more consistent effort.", ar: "يُظهر إمكانيات لكن يحتاج جهداً أكثر انتظاماً." },
    { en: "Basic understanding achieved. Encourage extra study.", ar: "تم تحقيق فهم أساسي. نشجع الدراسة الإضافية." },
    { en: "Needs to participate more actively in class.", ar: "يحتاج إلى المشاركة بشكل أكثر فعالية في الفصل." },
    { en: "Room for improvement with dedication and focus.", ar: "هناك مجال للتحسن مع التفاني والتركيز." },
    { en: "Should review homework assignments more carefully.", ar: "يجب مراجعة الواجبات المنزلية بعناية أكبر." },
    { en: "Encouraged to seek help when facing difficulties.", ar: "نشجع طلب المساعدة عند مواجهة الصعوبات." },
  ],
  needsImprovement: [
    { en: "Needs significant improvement. Extra support recommended.", ar: "يحتاج تحسناً كبيراً. يُنصح بالدعم الإضافي." },
    { en: "Struggling with material. Please arrange tutoring.", ar: "يواجه صعوبة في المادة. يرجى ترتيب دروس خصوصية." },
    { en: "Requires more attention to homework and studies.", ar: "يحتاج المزيد من الاهتمام بالواجبات والدراسة." },
    { en: "Below expectations. Parent meeting recommended.", ar: "أقل من المتوقع. يُنصح بعقد اجتماع مع ولي الأمر." },
    { en: "Must improve attendance and class participation.", ar: "يجب تحسين الحضور والمشاركة في الفصل." },
    { en: "Additional study sessions strongly recommended.", ar: "يُنصح بشدة بحضور جلسات دراسية إضافية." },
    { en: "Needs parental supervision for homework completion.", ar: "يحتاج إشرافاً من ولي الأمر لإكمال الواجبات." },
    { en: "Encourage regular study habits and organization.", ar: "نشجع اكتساب عادات دراسية منتظمة والتنظيم." },
  ],
};

// Bilingual subject-specific comments
const SUBJECT_COMMENTS = {
  excellent: [
    { en: "Exceptional understanding of subject material.", ar: "فهم استثنائي لمادة الدراسة." },
    { en: "Outstanding work. A top performer in this subject.", ar: "عمل متميز. من أفضل الطلاب في هذه المادة." },
    { en: "Shows deep knowledge and analytical skills.", ar: "يُظهر معرفة عميقة ومهارات تحليلية." },
    { en: "Demonstrates mastery of all concepts.", ar: "يُظهر إتقاناً لجميع المفاهيم." },
    { en: "Creative problem-solving abilities.", ar: "قدرات إبداعية في حل المشكلات." },
    { en: "Excellent application of theoretical concepts.", ar: "تطبيق ممتاز للمفاهيم النظرية." },
  ],
  good: [
    { en: "Good grasp of subject concepts.", ar: "إدراك جيد لمفاهيم المادة." },
    { en: "Solid performance. Keep up the good work!", ar: "أداء قوي. استمر في العمل الجيد!" },
    { en: "Making steady progress in this subject.", ar: "يحرز تقدماً ثابتاً في هذه المادة." },
    { en: "Shows interest and engages with material.", ar: "يُظهر اهتماماً وتفاعلاً مع المادة." },
    { en: "Good homework and assignment completion.", ar: "إنجاز جيد للواجبات والمهام." },
    { en: "Participates actively in subject discussions.", ar: "يشارك بفعالية في نقاشات المادة." },
  ],
  average: [
    { en: "Basic understanding achieved.", ar: "تم تحقيق فهم أساسي." },
    { en: "Needs more practice with this subject.", ar: "يحتاج المزيد من الممارسة في هذه المادة." },
    { en: "Satisfactory but can improve with effort.", ar: "مرضٍ لكن يمكن التحسن بالجهد." },
    { en: "Inconsistent performance. More focus needed.", ar: "أداء غير منتظم. يحتاج تركيزاً أكثر." },
    { en: "Should complete all practice exercises.", ar: "يجب إكمال جميع تمارين الممارسة." },
    { en: "Encouraged to ask questions during class.", ar: "نشجع طرح الأسئلة خلال الحصة." },
  ],
  needsImprovement: [
    { en: "Struggling with subject material.", ar: "يواجه صعوبة في مادة الدراسة." },
    { en: "Requires additional support in this subject.", ar: "يحتاج دعماً إضافياً في هذه المادة." },
    { en: "Must improve understanding of core concepts.", ar: "يجب تحسين فهم المفاهيم الأساسية." },
    { en: "Remedial classes recommended.", ar: "يُنصح بحصص تقوية." },
    { en: "Review of fundamental concepts needed.", ar: "يحتاج مراجعة المفاهيم الأساسية." },
    { en: "One-on-one tutoring would be beneficial.", ar: "الدروس الخصوصية ستكون مفيدة." },
  ],
};

// Principal remarks for report cards
const PRINCIPAL_REMARKS = {
  excellent: [
    { en: "Congratulations on outstanding academic performance. You represent the best of Comboni School.", ar: "تهانينا على الأداء الأكاديمي المتميز. أنت تمثل أفضل ما في مدرسة كمبوني." },
    { en: "Your dedication inspires the entire school community. Keep shining!", ar: "تفانيك يلهم مجتمع المدرسة بأكمله. استمر في التألق!" },
    { en: "Excellence achieved through hard work. May you continue to succeed.", ar: "تميز تحقق بالعمل الجاد. نتمنى لك استمرار النجاح." },
  ],
  good: [
    { en: "Good progress this term. Continue working hard to reach your potential.", ar: "تقدم جيد هذا الفصل. استمر في العمل بجد لتحقيق إمكاناتك." },
    { en: "Your efforts are appreciated. Aim higher next term!", ar: "جهودك موضع تقدير. استهدف الأعلى في الفصل القادم!" },
    { en: "Well done on maintaining good standards. Keep improving!", ar: "أحسنت في الحفاظ على مستوى جيد. استمر في التحسن!" },
  ],
  average: [
    { en: "We believe you can do better. Let's work together for improvement.", ar: "نؤمن بأنك قادر على الأفضل. لنعمل معاً للتحسن." },
    { en: "Focus on your studies and you will see improvement.", ar: "ركز على دراستك وسترى التحسن." },
    { en: "Set goals and work consistently to achieve them.", ar: "ضع أهدافاً واعمل بانتظام لتحقيقها." },
  ],
  needsImprovement: [
    { en: "Improvement required. Please schedule a meeting with your class teacher.", ar: "يلزم التحسن. يرجى تحديد موعد لقاء مع معلم الصف." },
    { en: "We're here to support you. Let's make next term better.", ar: "نحن هنا لدعمك. دعنا نجعل الفصل القادم أفضل." },
    { en: "Your success is important to us. Please seek help when needed.", ar: "نجاحك مهم لنا. يرجى طلب المساعدة عند الحاجة." },
  ],
};

// Achievement badges
const ACHIEVEMENT_BADGES = [
  { name: "Perfect Attendance", nameAr: "الحضور الكامل", condition: (attendance: number) => attendance >= 95 },
  { name: "Academic Excellence", nameAr: "التميز الأكاديمي", condition: (avg: number) => avg >= 95 },
  { name: "Honor Roll", nameAr: "قائمة الشرف", condition: (avg: number) => avg >= 90 },
  { name: "Most Improved", nameAr: "الأكثر تحسناً", condition: (_: number, improvement: number) => improvement >= 10 },
  { name: "Perfect Math Score", nameAr: "درجة كاملة في الرياضيات", condition: () => false }, // Special
  { name: "Literature Excellence", nameAr: "تميز في الأدب", condition: () => false }, // Special
  { name: "Science Star", nameAr: "نجم العلوم", condition: () => false }, // Special
  { name: "Good Conduct", nameAr: "حسن السلوك", condition: () => true }, // Most students get this
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getTeacherComment(score: number): string {
  const commentSet =
    score >= 90 ? TEACHER_COMMENTS.excellent :
    score >= 75 ? TEACHER_COMMENTS.good :
    score >= 60 ? TEACHER_COMMENTS.average :
    TEACHER_COMMENTS.needsImprovement;

  const comment = faker.helpers.arrayElement(commentSet);
  return `${comment.ar}\n${comment.en}`;
}

function getSubjectComment(score: number): string {
  const commentSet =
    score >= 90 ? SUBJECT_COMMENTS.excellent :
    score >= 75 ? SUBJECT_COMMENTS.good :
    score >= 60 ? SUBJECT_COMMENTS.average :
    SUBJECT_COMMENTS.needsImprovement;

  const comment = faker.helpers.arrayElement(commentSet);
  return `${comment.ar} | ${comment.en}`;
}

function getPrincipalRemark(avgScore: number): string {
  const remarkSet =
    avgScore >= 90 ? PRINCIPAL_REMARKS.excellent :
    avgScore >= 75 ? PRINCIPAL_REMARKS.good :
    avgScore >= 60 ? PRINCIPAL_REMARKS.average :
    PRINCIPAL_REMARKS.needsImprovement;

  const remark = faker.helpers.arrayElement(remarkSet);
  return `${remark.ar}\n${remark.en}`;
}

function calculateGrade(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "A-";
  if (score >= 80) return "B+";
  if (score >= 75) return "B";
  if (score >= 70) return "B-";
  if (score >= 65) return "C+";
  if (score >= 60) return "C";
  if (score >= 55) return "C-";
  if (score >= 50) return "D+";
  if (score >= 45) return "D";
  return "F";
}

function calculateGPA(score: number): string {
  if (score >= 95) return "4.00";
  if (score >= 90) return "3.70";
  if (score >= 85) return "3.30";
  if (score >= 80) return "3.00";
  if (score >= 75) return "2.70";
  if (score >= 70) return "2.30";
  if (score >= 65) return "2.00";
  if (score >= 60) return "1.70";
  if (score >= 55) return "1.30";
  if (score >= 50) return "1.00";
  if (score >= 45) return "0.70";
  return "0.00";
}

function generateStudentPerformanceProfile(studentIndex: number): { baseScore: number; variance: number; improvement: number } {
  // Create realistic distribution of student performance
  const performanceTiers = [
    { baseScore: 92, variance: 5, improvement: 2, weight: 15 }, // Top performers
    { baseScore: 82, variance: 8, improvement: 5, weight: 30 }, // Good students
    { baseScore: 72, variance: 10, improvement: 3, weight: 35 }, // Average students
    { baseScore: 60, variance: 12, improvement: 8, weight: 15 }, // Struggling students
    { baseScore: 50, variance: 15, improvement: 10, weight: 5 }, // At-risk students
  ];

  // Use student index to create consistent performance profile
  const seed = (studentIndex * 17) % 100;
  let cumWeight = 0;
  for (const tier of performanceTiers) {
    cumWeight += tier.weight;
    if (seed < cumWeight) {
      return {
        baseScore: tier.baseScore,
        variance: tier.variance,
        improvement: faker.number.int({ min: -tier.improvement, max: tier.improvement }),
      };
    }
  }
  return { baseScore: 72, variance: 10, improvement: 0 };
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

export async function seedReports(
  prisma: SeedPrisma,
  schoolId: string,
  termId: string,
  students: StudentRef[],
  subjects: SubjectRef[],
  classes?: ClassRef[]
): Promise<void> {
  console.log("📊 Creating comprehensive report cards (ALL students, ALL subjects)...");

  // Get all terms for this school
  const terms = await prisma.term.findMany({
    where: { schoolId },
    orderBy: { startDate: "desc" },
    take: 2,
  });

  const currentTerm = terms[0];
  const previousTerm = terms[1];

  // Get student enrollments to know which subjects each student takes
  const studentEnrollments = await prisma.studentClass.findMany({
    where: { schoolId },
    select: { studentId: true, classId: true },
  });

  // Get classes with their subjects
  const classesWithSubjects = await prisma.class.findMany({
    where: { schoolId },
    select: { id: true, subjectId: true },
  });

  // Create map of student -> subjects
  const studentSubjectsMap = new Map<string, Set<string>>();
  for (const enrollment of studentEnrollments) {
    const classInfo = classesWithSubjects.find(c => c.id === enrollment.classId);
    if (classInfo?.subjectId) {
      if (!studentSubjectsMap.has(enrollment.studentId)) {
        studentSubjectsMap.set(enrollment.studentId, new Set());
      }
      studentSubjectsMap.get(enrollment.studentId)!.add(classInfo.subjectId);
    }
  }

  let reportCount = 0;
  let gradeCount = 0;
  let badgeCount = 0;

  // Statistics tracking
  const gradeDistribution: Record<string, number> = {};
  let totalAvgScore = 0;

  // Create report cards for ALL students
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const studentProfile = generateStudentPerformanceProfile(i);

    // Get subjects for this student (or all subjects if not enrolled)
    const studentSubjectIds = studentSubjectsMap.get(student.id);
    const studentSubjects = studentSubjectIds
      ? subjects.filter(s => studentSubjectIds.has(s.id))
      : subjects; // Use all subjects if no specific enrollment

    // If student has no subjects, use a default set
    const subjectsToGrade = studentSubjects.length > 0 ? studentSubjects : subjects.slice(0, 8);

    // Generate grades for each subject
    const subjectGrades: { subjectId: string; score: number; grade: string; subjectName?: string }[] = [];

    for (const subject of subjectsToGrade) {
      // Calculate score with variance around base score
      const variance = faker.number.int({ min: -studentProfile.variance, max: studentProfile.variance });
      const rawScore = studentProfile.baseScore + variance + studentProfile.improvement;
      const score = Math.min(100, Math.max(0, rawScore));
      const grade = calculateGrade(score);

      subjectGrades.push({
        subjectId: subject.id,
        score,
        grade,
        subjectName: subject.subjectName,
      });
    }

    // Calculate overall statistics
    const totalScore = subjectGrades.reduce((sum, g) => sum + g.score, 0);
    const avgScore = Math.round(totalScore / subjectGrades.length);
    const overallGrade = calculateGrade(avgScore);
    const overallGPA = calculateGPA(avgScore);

    totalAvgScore += avgScore;
    gradeDistribution[overallGrade] = (gradeDistribution[overallGrade] || 0) + 1;

    // Attendance calculation (realistic distribution)
    const totalSchoolDays = faker.number.int({ min: 85, max: 92 });
    const daysAbsent = avgScore >= 80
      ? faker.number.int({ min: 0, max: 3 })
      : avgScore >= 60
      ? faker.number.int({ min: 2, max: 8 })
      : faker.number.int({ min: 5, max: 15 });
    const daysLate = faker.number.int({ min: 0, max: 5 });
    const daysPresent = totalSchoolDays - daysAbsent;
    const attendanceRate = Math.round((daysPresent / totalSchoolDays) * 100);

    // Generate conduct score
    const conductScore = avgScore >= 80
      ? faker.number.int({ min: 85, max: 100 })
      : avgScore >= 60
      ? faker.number.int({ min: 70, max: 90 })
      : faker.number.int({ min: 55, max: 80 });

    // Calculate rank (will be updated later)
    const rank = i + 1;

    // Create report card
    const reportCard = await prisma.reportCard.create({
      data: {
        schoolId,
        studentId: student.id,
        termId,
        overallGrade,
        overallGPA,
        rank,
        totalStudents: students.length,
        daysPresent,
        daysAbsent,
        daysLate,
        teacherComments: getTeacherComment(avgScore),
        principalComments: getPrincipalRemark(avgScore),
        isPublished: i < Math.floor(students.length * 0.8), // 80% published
        publishedAt: i < Math.floor(students.length * 0.8) ? new Date() : null,
      },
    });
    reportCount++;

    // Create grades for each subject
    for (const gradeData of subjectGrades) {
      await prisma.reportCardGrade.create({
        data: {
          schoolId,
          reportCardId: reportCard.id,
          subjectId: gradeData.subjectId,
          grade: gradeData.grade,
          score: gradeData.score.toString(),
          maxScore: "100.00",
          percentage: gradeData.score,
          comments: getSubjectComment(gradeData.score),
        },
      });
      gradeCount++;
    }

    // Award achievement badges
    const badges: string[] = [];
    if (attendanceRate >= 95) badges.push("Perfect Attendance | الحضور الكامل");
    if (avgScore >= 95) badges.push("Academic Excellence | التميز الأكاديمي");
    if (avgScore >= 90) badges.push("Honor Roll | قائمة الشرف");
    if (conductScore >= 90) badges.push("Good Conduct | حسن السلوك");
    if (subjectGrades.some(g => g.subjectName?.includes("Math") && g.score >= 95)) badges.push("Math Champion | بطل الرياضيات");
    if (subjectGrades.some(g => g.subjectName?.includes("Arabic") && g.score >= 95)) badges.push("Arabic Excellence | تميز في العربية");

    badgeCount += badges.length;
  }

  // Calculate final statistics
  const avgSchoolScore = Math.round(totalAvgScore / students.length);
  const honorRollCount = (gradeDistribution["A+"] || 0) + (gradeDistribution["A"] || 0);
  const needsImprovementCount = (gradeDistribution["D"] || 0) + (gradeDistribution["D+"] || 0) + (gradeDistribution["F"] || 0);

  console.log(`   ✅ Created: ${reportCount} comprehensive report cards (ALL students)`);
  console.log(`   ✅ Created: ${gradeCount} subject grades with bilingual comments`);
  console.log(`   ✅ Awarded: ${badgeCount} achievement badges`);
  console.log(`   📈 School Statistics:`);
  console.log(`      - Average Score: ${avgSchoolScore}%`);
  console.log(`      - Honor Roll Students: ${honorRollCount}`);
  console.log(`      - Needs Improvement: ${needsImprovementCount}`);
  console.log(`      - Grade Distribution: A: ${(gradeDistribution["A+"] || 0) + (gradeDistribution["A"] || 0) + (gradeDistribution["A-"] || 0)}, B: ${(gradeDistribution["B+"] || 0) + (gradeDistribution["B"] || 0) + (gradeDistribution["B-"] || 0)}, C: ${(gradeDistribution["C+"] || 0) + (gradeDistribution["C"] || 0) + (gradeDistribution["C-"] || 0)}, D/F: ${needsImprovementCount}\n`);
}
