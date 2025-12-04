/**
 * Reports Seed Module - Bilingual (AR/EN)
 * Creates report cards with grades - Sudanese K-12 School
 *
 * Features:
 * - Bilingual teacher comments (Arabic/English)
 * - Sudanese grading scale (A-F)
 * - GPA calculation (4.0 scale)
 * - Subject-specific feedback
 */

import { faker } from "@faker-js/faker";
import type { SeedPrisma, StudentRef, SubjectRef } from "./types";

// Bilingual teacher comments based on performance
const TEACHER_COMMENTS = {
  excellent: [
    { en: "Outstanding performance! A role model for other students.", ar: "أداء متميز! قدوة للطلاب الآخرين." },
    { en: "Excellent work ethic and academic achievement. Keep it up!", ar: "أخلاق عمل ممتازة وتحصيل أكاديمي. استمر!" },
    { en: "Demonstrates exceptional understanding and dedication.", ar: "يُظهر فهماً استثنائياً وتفانياً في العمل." },
    { en: "A pleasure to teach. Shows genuine love for learning.", ar: "طالب نموذجي. يُظهر حباً حقيقياً للتعلم." },
    { en: "Consistently exceeds expectations. Very impressive!", ar: "يتجاوز التوقعات باستمرار. مثير للإعجاب!" },
  ],
  good: [
    { en: "Good performance. Keep striving for excellence.", ar: "أداء جيد. استمر في السعي نحو التميز." },
    { en: "Shows consistent effort and improvement.", ar: "يُظهر جهداً مستمراً وتحسناً ملحوظاً." },
    { en: "Solid understanding of concepts. Well done!", ar: "فهم قوي للمفاهيم. أحسنت!" },
    { en: "A hardworking student with good potential.", ar: "طالب مجتهد ذو إمكانيات جيدة." },
    { en: "Making good progress. Encourage continued effort.", ar: "يحرز تقدماً جيداً. نشجع استمرار الجهد." },
  ],
  average: [
    { en: "Satisfactory performance. More focus needed.", ar: "أداء مرضٍ. يحتاج إلى مزيد من التركيز." },
    { en: "Average work. Can achieve more with effort.", ar: "عمل متوسط. يمكن تحقيق المزيد بالجهد." },
    { en: "Shows potential but needs more consistent effort.", ar: "يُظهر إمكانيات لكن يحتاج جهداً أكثر انتظاماً." },
    { en: "Basic understanding achieved. Encourage extra study.", ar: "تم تحقيق فهم أساسي. نشجع الدراسة الإضافية." },
    { en: "Needs to participate more actively in class.", ar: "يحتاج إلى المشاركة بشكل أكثر فعالية في الفصل." },
  ],
  needsImprovement: [
    { en: "Needs significant improvement. Extra support recommended.", ar: "يحتاج تحسناً كبيراً. يُنصح بالدعم الإضافي." },
    { en: "Struggling with material. Please arrange tutoring.", ar: "يواجه صعوبة في المادة. يرجى ترتيب دروس خصوصية." },
    { en: "Requires more attention to homework and studies.", ar: "يحتاج المزيد من الاهتمام بالواجبات والدراسة." },
    { en: "Below expectations. Parent meeting recommended.", ar: "أقل من المتوقع. يُنصح بعقد اجتماع مع ولي الأمر." },
    { en: "Must improve attendance and class participation.", ar: "يجب تحسين الحضور والمشاركة في الفصل." },
  ],
};

// Bilingual subject-specific comments
const SUBJECT_COMMENTS = {
  excellent: [
    { en: "Exceptional understanding of subject material.", ar: "فهم استثنائي لمادة الدراسة." },
    { en: "Outstanding work. A top performer in this subject.", ar: "عمل متميز. من أفضل الطلاب في هذه المادة." },
    { en: "Shows deep knowledge and analytical skills.", ar: "يُظهر معرفة عميقة ومهارات تحليلية." },
  ],
  good: [
    { en: "Good grasp of subject concepts.", ar: "إدراك جيد لمفاهيم المادة." },
    { en: "Solid performance. Keep up the good work!", ar: "أداء قوي. استمر في العمل الجيد!" },
    { en: "Making steady progress in this subject.", ar: "يحرز تقدماً ثابتاً في هذه المادة." },
  ],
  average: [
    { en: "Basic understanding achieved.", ar: "تم تحقيق فهم أساسي." },
    { en: "Needs more practice with this subject.", ar: "يحتاج المزيد من الممارسة في هذه المادة." },
    { en: "Satisfactory but can improve with effort.", ar: "مرضٍ لكن يمكن التحسن بالجهد." },
  ],
  needsImprovement: [
    { en: "Struggling with subject material.", ar: "يواجه صعوبة في مادة الدراسة." },
    { en: "Requires additional support in this subject.", ar: "يحتاج دعماً إضافياً في هذه المادة." },
    { en: "Must improve understanding of core concepts.", ar: "يجب تحسين فهم المفاهيم الأساسية." },
  ],
};

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

export async function seedReports(
  prisma: SeedPrisma,
  schoolId: string,
  termId: string,
  students: StudentRef[],
  subjects: SubjectRef[]
): Promise<void> {
  console.log("📊 Creating report cards (Bilingual AR/EN)...");

  let reportCount = 0;
  let gradeCount = 0;

  for (let i = 0; i < Math.min(50, students.length); i++) {
    const student = students[i];

    const subjectGrades = subjects.slice(0, 5).map((subject) => {
      const score = faker.number.int({ min: 60, max: 98 });
      const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : "D";
      return { subjectId: subject.id, score, grade };
    });

    const avgScore = subjectGrades.reduce((sum, g) => sum + g.score, 0) / subjectGrades.length;
    const overallGrade = avgScore >= 90 ? "A" : avgScore >= 80 ? "B" : avgScore >= 70 ? "C" : "D";
    const gpa = avgScore >= 90 ? "3.70" : avgScore >= 80 ? "3.00" : avgScore >= 70 ? "2.30" : "2.00";

    const reportCard = await prisma.reportCard.create({
      data: {
        schoolId,
        studentId: student.id,
        termId,
        overallGrade,
        overallGPA: gpa,
        rank: i + 1,
        totalStudents: students.length,
        daysPresent: faker.number.int({ min: 80, max: 95 }),
        daysAbsent: faker.number.int({ min: 0, max: 5 }),
        daysLate: faker.number.int({ min: 0, max: 3 }),
        teacherComments: getTeacherComment(avgScore),
        isPublished: i < 30,
        publishedAt: i < 30 ? new Date() : null,
      },
    });
    reportCount++;

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
  }

  console.log(`   ✅ Created: ${reportCount} report cards`);
  console.log(`   ✅ Created: ${gradeCount} subject grades with bilingual comments\n`);
}
