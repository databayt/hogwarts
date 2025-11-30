/**
 * Reports Seed Module
 * Creates report cards with grades
 */

import { faker } from "@faker-js/faker";
import type { SeedPrisma, StudentRef, SubjectRef } from "./types";

export async function seedReports(
  prisma: SeedPrisma,
  schoolId: string,
  termId: string,
  students: StudentRef[],
  subjects: SubjectRef[]
): Promise<void> {
  console.log("📊 Creating report cards...");

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
        teacherComments: "Good performance. Keep up the excellent work!",
        isPublished: i < 30,
        publishedAt: i < 30 ? new Date() : null,
      },
    });

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
          comments: "Good progress",
        },
      });
    }
  }

  console.log(`   ✅ Created: 50 report cards with grades\n`);
}
