/**
 * Grades Seed Module - Bilingual (AR/EN)
 * Creates academic results (Result model) for the grades module
 * Populates data for K-12 students with various assignments and exams
 *
 * Features:
 * - Bilingual assignment types (Arabic/English)
 * - Bilingual feedback templates
 * - Sudanese grading scale
 * - GPA 4.0 scale calculation
 */

import { faker } from "@faker-js/faker";
import type { SeedPrisma, ClassRef, StudentRef, SubjectRef, TeacherRef } from "./types";

// Grade calculation helper - Sudanese scale
function calculateGrade(percentage: number): string {
  if (percentage >= 95) return "A+";
  if (percentage >= 90) return "A";
  if (percentage >= 85) return "A-";
  if (percentage >= 80) return "B+";
  if (percentage >= 75) return "B";
  if (percentage >= 70) return "B-";
  if (percentage >= 65) return "C+";
  if (percentage >= 60) return "C";
  if (percentage >= 55) return "C-";
  if (percentage >= 50) return "D+";
  if (percentage >= 45) return "D";
  return "F";
}

// Bilingual assignment types for variety
const ASSIGNMENT_TYPES = [
  { titleEn: "Homework Assignment", titleAr: "واجب منزلي", maxScore: 20 },
  { titleEn: "Weekly Quiz", titleAr: "اختبار أسبوعي", maxScore: 25 },
  { titleEn: "Project Submission", titleAr: "تسليم مشروع", maxScore: 50 },
  { titleEn: "Lab Report", titleAr: "تقرير معملي", maxScore: 30 },
  { titleEn: "Essay Assignment", titleAr: "مقال كتابي", maxScore: 40 },
  { titleEn: "Oral Presentation", titleAr: "عرض شفهي", maxScore: 25 },
  { titleEn: "Group Project", titleAr: "مشروع جماعي", maxScore: 50 },
  { titleEn: "Research Paper", titleAr: "بحث علمي", maxScore: 100 },
  { titleEn: "Practical Test", titleAr: "اختبار عملي", maxScore: 50 },
  { titleEn: "Class Participation", titleAr: "مشاركة صفية", maxScore: 10 },
  { titleEn: "Midterm Exam", titleAr: "اختبار نصف الفصل", maxScore: 50 },
  { titleEn: "Final Exam", titleAr: "الاختبار النهائي", maxScore: 100 },
  { titleEn: "Book Report", titleAr: "تقرير كتاب", maxScore: 30 },
  { titleEn: "Quran Recitation", titleAr: "تلاوة القرآن", maxScore: 25 },
  { titleEn: "Arabic Dictation", titleAr: "إملاء عربي", maxScore: 20 },
];

// Bilingual feedback templates
const FEEDBACK_TEMPLATES = {
  excellent: [
    { en: "Outstanding work! Keep it up!", ar: "عمل متميز! استمر!" },
    { en: "Excellent performance. Shows deep understanding.", ar: "أداء ممتاز. يُظهر فهماً عميقاً." },
    { en: "Impressive work. Very well done!", ar: "عمل مثير للإعجاب. أحسنت!" },
    { en: "Exceptional effort and understanding demonstrated.", ar: "جهد استثنائي وفهم واضح." },
    { en: "Superb work. You've exceeded expectations.", ar: "عمل رائع. تجاوزت التوقعات." },
    { en: "A role model for your peers. Excellent!", ar: "قدوة لزملائك. ممتاز!" },
    { en: "Mastery of the material demonstrated.", ar: "إتقان واضح للمادة." },
  ],
  good: [
    { en: "Good work. Keep improving!", ar: "عمل جيد. استمر في التحسن!" },
    { en: "Well done. A few areas to strengthen.", ar: "أحسنت. بعض الجوانب تحتاج تقوية." },
    { en: "Solid performance. Continue this effort.", ar: "أداء قوي. استمر في هذا الجهد." },
    { en: "Good understanding shown. Keep practicing.", ar: "فهم جيد. واصل الممارسة." },
    { en: "Nice work! Some room for improvement.", ar: "عمل جيد! هناك مجال للتحسن." },
    { en: "Making steady progress. Well done!", ar: "تحرز تقدماً ثابتاً. أحسنت!" },
    { en: "Shows dedication and effort.", ar: "يُظهر التفاني والجهد." },
  ],
  average: [
    { en: "Satisfactory work. More practice needed.", ar: "عمل مرضٍ. يحتاج المزيد من الممارسة." },
    { en: "Average performance. Focus on weak areas.", ar: "أداء متوسط. ركز على نقاط الضعف." },
    { en: "Acceptable work. Try to be more thorough.", ar: "عمل مقبول. حاول أن تكون أكثر دقة." },
    { en: "Basic understanding shown. Keep working hard.", ar: "فهم أساسي. واصل العمل بجد." },
    { en: "Decent effort. Review the material again.", ar: "جهد لا بأس به. راجع المادة مرة أخرى." },
    { en: "Can do better with more effort.", ar: "يمكنك الأفضل بمزيد من الجهد." },
    { en: "Needs more attention to details.", ar: "يحتاج المزيد من الاهتمام بالتفاصيل." },
  ],
  needsImprovement: [
    { en: "Needs improvement. Please seek help if needed.", ar: "يحتاج تحسناً. اطلب المساعدة إن لزم." },
    { en: "More effort required. Consider extra practice.", ar: "يتطلب المزيد من الجهد. فكر في الممارسة الإضافية." },
    { en: "Below expectations. Let's discuss how to improve.", ar: "أقل من المتوقع. دعنا نناقش كيفية التحسن." },
    { en: "Struggling with concepts. Extra support recommended.", ar: "يواجه صعوبة في المفاهيم. يُنصح بالدعم الإضافي." },
    { en: "Requires more attention. Don't hesitate to ask for help.", ar: "يحتاج المزيد من الاهتمام. لا تتردد في طلب المساعدة." },
    { en: "Must improve. Consider tutoring sessions.", ar: "يجب التحسن. فكر في دروس خصوصية." },
    { en: "Needs significant improvement in this area.", ar: "يحتاج تحسناً كبيراً في هذا المجال." },
  ],
};

function getFeedback(percentage: number): string {
  let templateSet;
  if (percentage >= 85) {
    templateSet = FEEDBACK_TEMPLATES.excellent;
  } else if (percentage >= 70) {
    templateSet = FEEDBACK_TEMPLATES.good;
  } else if (percentage >= 55) {
    templateSet = FEEDBACK_TEMPLATES.average;
  } else {
    templateSet = FEEDBACK_TEMPLATES.needsImprovement;
  }

  const feedback = faker.helpers.arrayElement(templateSet);
  return `${feedback.ar} | ${feedback.en}`;
}

export async function seedGrades(
  prisma: SeedPrisma,
  schoolId: string,
  classes: ClassRef[],
  subjects: SubjectRef[],
  students: StudentRef[],
  teachers: TeacherRef[]
): Promise<void> {
  console.log("📝 Creating academic results (Bilingual AR/EN)...");

  // Get assignments from the database (created by exams seed)
  const assignments = await prisma.assignment.findMany({
    where: { schoolId },
    select: { id: true, title: true, totalPoints: true, classId: true },
  });

  // Get exams from the database
  const exams = await prisma.exam.findMany({
    where: { schoolId },
    select: { id: true, title: true, totalMarks: true, classId: true, subjectId: true },
  });

  // Get classes with their subjectId
  const classesWithSubject = await prisma.class.findMany({
    where: { schoolId },
    select: { id: true, subjectId: true },
  });

  // Create a map of classId -> subjectId
  const classSubjectMap = new Map<string, string>();
  for (const cls of classesWithSubject) {
    classSubjectMap.set(cls.id, cls.subjectId);
  }

  // Get student-class enrollments using StudentClass model
  const studentClasses = await prisma.studentClass.findMany({
    where: { schoolId },
    select: { studentId: true, classId: true },
  });

  // Create a map of classId -> studentIds
  const classStudentMap = new Map<string, string[]>();
  for (const sc of studentClasses) {
    const studentList = classStudentMap.get(sc.classId) || [];
    studentList.push(sc.studentId);
    classStudentMap.set(sc.classId, studentList);
  }

  const results: {
    schoolId: string;
    studentId: string;
    classId: string;
    assignmentId?: string;
    examId?: string;
    subjectId?: string;
    score: number;
    maxScore: number;
    percentage: number;
    grade: string;
    title?: string;
    feedback?: string;
    gradedAt: Date;
  }[] = [];

  // Create results for assignments
  for (const assignment of assignments) {
    const classStudents = classStudentMap.get(assignment.classId) || [];
    const subjectId = classSubjectMap.get(assignment.classId);

    for (const studentId of classStudents) {
      // 90% chance student completed the assignment
      if (Math.random() < 0.90) {
        const maxScore = Number(assignment.totalPoints) || 100;
        // Score distribution: mostly B-A range with some variation
        const baseScore = faker.number.int({ min: 45, max: 100 });
        const score = Math.min(maxScore, Math.round((baseScore / 100) * maxScore));
        const percentage = Math.round((score / maxScore) * 100);
        const grade = calculateGrade(percentage);

        results.push({
          schoolId,
          studentId,
          classId: assignment.classId,
          assignmentId: assignment.id,
          subjectId: subjectId || undefined,
          score,
          maxScore,
          percentage,
          grade,
          feedback: getFeedback(percentage),
          gradedAt: faker.date.recent({ days: 30 }),
        });
      }
    }
  }

  // Create results for exams
  for (const exam of exams) {
    if (!exam.classId) continue;
    const classStudents = classStudentMap.get(exam.classId) || [];

    for (const studentId of classStudents) {
      // 95% attendance for exams
      if (Math.random() < 0.95) {
        const maxScore = Number(exam.totalMarks) || 100;
        // Exam scores tend to be slightly lower and more spread
        const baseScore = faker.number.int({ min: 40, max: 100 });
        const score = Math.min(maxScore, Math.round((baseScore / 100) * maxScore));
        const percentage = Math.round((score / maxScore) * 100);
        const grade = calculateGrade(percentage);

        results.push({
          schoolId,
          studentId,
          classId: exam.classId,
          examId: exam.id,
          subjectId: exam.subjectId || undefined,
          score,
          maxScore,
          percentage,
          grade,
          feedback: getFeedback(percentage),
          gradedAt: faker.date.recent({ days: 60 }),
        });
      }
    }
  }

  // Create some standalone grades (not linked to assignment or exam)
  // For classes that might not have assignments yet
  for (const classObj of classes.slice(0, 20)) {
    const classStudents = classStudentMap.get(classObj.id) || [];
    const subject = faker.helpers.arrayElement(subjects);

    // Create 2-3 standalone grades per class
    const numGrades = faker.number.int({ min: 2, max: 3 });
    const assignmentType = faker.helpers.arrayElement(ASSIGNMENT_TYPES);

    for (const studentId of classStudents.slice(0, Math.min(10, classStudents.length))) {
      for (let i = 0; i < numGrades; i++) {
        const maxScore = assignmentType.maxScore;
        const baseScore = faker.number.int({ min: 50, max: 100 });
        const score = Math.round((baseScore / 100) * maxScore);
        const percentage = Math.round((score / maxScore) * 100);
        const grade = calculateGrade(percentage);

        results.push({
          schoolId,
          studentId,
          classId: classObj.id,
          subjectId: subject.id,
          score,
          maxScore,
          percentage,
          grade,
          title: `${assignmentType.titleAr} | ${assignmentType.titleEn} ${i + 1}`,
          feedback: getFeedback(percentage),
          gradedAt: faker.date.recent({ days: 45 }),
        });
      }
    }
  }

  // Batch insert results
  if (results.length > 0) {
    await prisma.result.createMany({
      data: results.map(r => ({
        schoolId: r.schoolId,
        studentId: r.studentId,
        classId: r.classId,
        assignmentId: r.assignmentId,
        examId: r.examId,
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
    });
  }

  // Calculate statistics
  const gradeDistribution = results.reduce((acc, r) => {
    acc[r.grade] = (acc[r.grade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgPercentage = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length)
    : 0;

  const aGrades = (gradeDistribution['A'] || 0) + (gradeDistribution['A+'] || 0) + (gradeDistribution['A-'] || 0);
  const bGrades = (gradeDistribution['B'] || 0) + (gradeDistribution['B+'] || 0) + (gradeDistribution['B-'] || 0);
  const cGrades = (gradeDistribution['C'] || 0) + (gradeDistribution['C+'] || 0) + (gradeDistribution['C-'] || 0);
  const dGrades = (gradeDistribution['D'] || 0) + (gradeDistribution['D+'] || 0);
  const fGrades = gradeDistribution['F'] || 0;

  console.log(`   ✅ Created: ${results.length} academic results`);
  console.log(`      - From assignments: ${results.filter(r => r.assignmentId).length}`);
  console.log(`      - From exams: ${results.filter(r => r.examId).length}`);
  console.log(`      - Standalone grades: ${results.filter(r => r.title).length}`);
  console.log(`      - Average percentage: ${avgPercentage}%`);
  console.log(`      - Grade distribution: A: ${aGrades}, B: ${bGrades}, C: ${cGrades}, D: ${dGrades}, F: ${fGrades}\n`);
}
