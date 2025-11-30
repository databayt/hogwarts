/**
 * Exams Seed Module
 * Creates exams, results, and grade boundaries
 */

import { ExamType, ExamStatus } from "@prisma/client";
import { faker } from "@faker-js/faker";
import type { SeedPrisma, StudentRef, SubjectRef, ClassRef } from "./types";

export async function seedExams(
  prisma: SeedPrisma,
  schoolId: string,
  classes: ClassRef[],
  subjects: SubjectRef[],
  students: StudentRef[]
): Promise<void> {
  console.log("📝 Creating exams and results...");

  const examSubjects = subjects.filter(s =>
    ["Mathematics", "Arabic Language", "English Language", "Physics", "Chemistry"].includes(s.subjectName)
  );

  const exams: { id: string; subjectName: string; status: ExamStatus }[] = [];

  for (const subject of examSubjects) {
    // Midterm exam (completed)
    const midterm = await prisma.exam.create({
      data: {
        schoolId,
        title: `${subject.subjectName} Mid-Term Exam`,
        description: `Mid-term examination for ${subject.subjectName}`,
        classId: classes[0].id,
        subjectId: subject.id,
        examDate: new Date("2025-11-15T00:00:00Z"),
        startTime: "09:00",
        endTime: "11:00",
        duration: 120,
        totalMarks: 100,
        passingMarks: 50,
        examType: ExamType.MIDTERM,
        status: ExamStatus.COMPLETED,
      },
    });
    exams.push({ id: midterm.id, subjectName: subject.subjectName, status: ExamStatus.COMPLETED });

    // Final exam (scheduled)
    const final = await prisma.exam.create({
      data: {
        schoolId,
        title: `${subject.subjectName} Final Exam`,
        description: `Final examination for ${subject.subjectName}`,
        classId: classes[0].id,
        subjectId: subject.id,
        examDate: new Date("2026-01-15T00:00:00Z"),
        startTime: "09:00",
        endTime: "12:00",
        duration: 180,
        totalMarks: 100,
        passingMarks: 50,
        examType: ExamType.FINAL,
        status: ExamStatus.SCHEDULED,
      },
    });
    exams.push({ id: final.id, subjectName: subject.subjectName, status: ExamStatus.SCHEDULED });
  }

  // Create results for completed exams
  const completedExams = exams.filter(e => e.status === ExamStatus.COMPLETED);

  for (const exam of completedExams) {
    for (let i = 0; i < Math.min(50, students.length); i++) {
      const marks = faker.number.int({ min: 40, max: 98 });
      const grade = marks >= 90 ? "A" : marks >= 80 ? "B" : marks >= 70 ? "C" : marks >= 60 ? "D" : "F";

      await prisma.examResult.create({
        data: {
          schoolId,
          examId: exam.id,
          studentId: students[i].id,
          marksObtained: marks,
          totalMarks: 100,
          percentage: marks,
          grade,
          isAbsent: false,
        },
      });
    }
  }

  // Grade boundaries
  await prisma.gradeBoundary.createMany({
    data: [
      { schoolId, grade: "A+", minScore: "95.00", maxScore: "100.00", gpaValue: "4.00" },
      { schoolId, grade: "A", minScore: "90.00", maxScore: "94.99", gpaValue: "3.70" },
      { schoolId, grade: "B+", minScore: "85.00", maxScore: "89.99", gpaValue: "3.30" },
      { schoolId, grade: "B", minScore: "80.00", maxScore: "84.99", gpaValue: "3.00" },
      { schoolId, grade: "C+", minScore: "75.00", maxScore: "79.99", gpaValue: "2.70" },
      { schoolId, grade: "C", minScore: "70.00", maxScore: "74.99", gpaValue: "2.30" },
      { schoolId, grade: "D", minScore: "60.00", maxScore: "69.99", gpaValue: "2.00" },
      { schoolId, grade: "F", minScore: "0.00", maxScore: "59.99", gpaValue: "0.00" },
    ],
    skipDuplicates: true,
  });

  console.log(`   ✅ Created: ${exams.length} exams with results\n`);
}
