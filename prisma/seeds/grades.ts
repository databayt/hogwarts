/**
 * Grades Seed Module
 * Creates academic results (Result model) for the grades module
 * Populates data for K-12 students with various assignments and exams
 */

import { faker } from "@faker-js/faker";
import type { SeedPrisma, ClassRef, StudentRef, SubjectRef, TeacherRef } from "./types";

// Grade calculation helper
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

// Assignment types for variety
const ASSIGNMENT_TYPES = [
  { title: "Homework Assignment", maxScore: 20 },
  { title: "Weekly Quiz", maxScore: 25 },
  { title: "Project Submission", maxScore: 50 },
  { title: "Lab Report", maxScore: 30 },
  { title: "Essay Assignment", maxScore: 40 },
  { title: "Oral Presentation", maxScore: 25 },
  { title: "Group Project", maxScore: 50 },
  { title: "Research Paper", maxScore: 100 },
  { title: "Practical Test", maxScore: 50 },
  { title: "Class Participation", maxScore: 10 },
];

// Feedback templates
const FEEDBACK_TEMPLATES = {
  excellent: [
    "Outstanding work! Keep it up!",
    "Excellent performance. Shows deep understanding.",
    "Impressive work. Very well done!",
    "Exceptional effort and understanding demonstrated.",
    "Superb work. You've exceeded expectations.",
  ],
  good: [
    "Good work. Keep improving!",
    "Well done. A few areas to strengthen.",
    "Solid performance. Continue this effort.",
    "Good understanding shown. Keep practicing.",
    "Nice work! Some room for improvement.",
  ],
  average: [
    "Satisfactory work. More practice needed.",
    "Average performance. Focus on weak areas.",
    "Acceptable work. Try to be more thorough.",
    "Basic understanding shown. Keep working hard.",
    "Decent effort. Review the material again.",
  ],
  needsImprovement: [
    "Needs improvement. Please seek help if needed.",
    "More effort required. Consider extra practice.",
    "Below expectations. Let's discuss how to improve.",
    "Struggling with concepts. Extra support recommended.",
    "Requires more attention. Don't hesitate to ask for help.",
  ],
};

function getFeedback(percentage: number): string {
  if (percentage >= 85) {
    return faker.helpers.arrayElement(FEEDBACK_TEMPLATES.excellent);
  } else if (percentage >= 70) {
    return faker.helpers.arrayElement(FEEDBACK_TEMPLATES.good);
  } else if (percentage >= 55) {
    return faker.helpers.arrayElement(FEEDBACK_TEMPLATES.average);
  } else {
    return faker.helpers.arrayElement(FEEDBACK_TEMPLATES.needsImprovement);
  }
}

export async function seedGrades(
  prisma: SeedPrisma,
  schoolId: string,
  classes: ClassRef[],
  subjects: SubjectRef[],
  students: StudentRef[],
  teachers: TeacherRef[]
): Promise<void> {
  console.log("📝 Creating academic results (grades)...");

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
          title: `${assignmentType.title} ${i + 1}`,
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
