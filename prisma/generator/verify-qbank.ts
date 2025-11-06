import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifyQuestionBank() {
  const schools = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM schools WHERE domain = 'demo' LIMIT 1
  `;

  if (!schools || schools.length === 0) {
    console.log("❌ Demo school not found");
    return;
  }

  const schoolId = schools[0].id;

  // Get total count
  const total = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM question_bank WHERE "schoolId" = ${schoolId}
  `;

  // Get breakdown by subject
  const bySubject = await prisma.$queryRaw<Array<{ subject: string; count: bigint }>>`
    SELECT s."subjectName" as subject, COUNT(*) as count
    FROM question_bank qb
    JOIN subjects s ON qb."subjectId" = s.id
    WHERE qb."schoolId" = ${schoolId}
    GROUP BY s."subjectName"
    ORDER BY COUNT(*) DESC
  `;

  // Get breakdown by difficulty
  const byDifficulty = await prisma.$queryRaw<Array<{ difficulty: string; count: bigint }>>`
    SELECT difficulty, COUNT(*) as count
    FROM question_bank
    WHERE "schoolId" = ${schoolId}
    GROUP BY difficulty
    ORDER BY count DESC
  `;

  // Get breakdown by question type
  const byType = await prisma.$queryRaw<Array<{ type: string; count: bigint }>>`
    SELECT "questionType" as type, COUNT(*) as count
    FROM question_bank
    WHERE "schoolId" = ${schoolId}
    GROUP BY "questionType"
    ORDER BY count DESC
  `;

  console.log("\n📊 Question Bank Statistics for Demo School");
  console.log("=".repeat(50));
  console.log(`\n✅ Total Questions: ${Number(total[0].count)}\n`);

  console.log("📚 By Subject:");
  bySubject.forEach(row => {
    console.log(`   - ${row.subject}: ${Number(row.count)} questions`);
  });

  console.log("\n🎯 By Difficulty:");
  byDifficulty.forEach(row => {
    console.log(`   - ${row.difficulty}: ${Number(row.count)} questions`);
  });

  console.log("\n📝 By Question Type:");
  byType.forEach(row => {
    console.log(`   - ${row.type}: ${Number(row.count)} questions`);
  });

  console.log("\n🔗 View online: https://demo.databayt.org/en/exams/qbank\n");
}

verifyQuestionBank()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
