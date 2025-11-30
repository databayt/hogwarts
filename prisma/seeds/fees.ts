/**
 * Fees Seed Module
 * Creates fee structures, assignments, and payments
 * Currency: SDG (Sudanese Pound) - Comboni School
 */

import { FeeStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import type { SeedPrisma, StudentRef, ClassRef } from "./types";

export async function seedFees(
  prisma: SeedPrisma,
  schoolId: string,
  classes: ClassRef[],
  students: StudentRef[]
): Promise<void> {
  console.log("💰 Creating fee structures and payments (SDG - Sudanese Pound)...");

  const academicYear = "2025-2026";

  // Fee structures in SDG (Sudanese Pound)
  // Comboni School - Quality private education fees
  const feeStructures = [
    { name: "Secondary (Grade 10-12) Annual Fee | الرسوم السنوية للمرحلة الثانوية", tuition: 1200000, admission: 180000, registration: 48000, exam: 90000, library: 30000, lab: 72000, sports: 36000, total: 1656000 },
    { name: "Intermediate (Grade 7-9) Annual Fee | الرسوم السنوية للمرحلة المتوسطة", tuition: 900000, admission: 150000, registration: 36000, exam: 72000, library: 24000, lab: 48000, sports: 30000, total: 1260000 },
    { name: "Primary (Grade 1-6) Annual Fee | الرسوم السنوية للمرحلة الابتدائية", tuition: 720000, admission: 120000, registration: 30000, exam: 60000, library: 18000, lab: 30000, sports: 24000, total: 1002000 },
    { name: "Kindergarten (KG1-KG2) Annual Fee | الرسوم السنوية للروضة", tuition: 600000, admission: 90000, registration: 24000, exam: 30000, library: 12000, lab: 0, sports: 18000, total: 774000 },
  ];

  const createdStructures: { id: string; total: number }[] = [];
  for (const [index, fs] of feeStructures.entries()) {
    const structure = await prisma.feeStructure.create({
      data: {
        schoolId,
        name: `${fs.name} ${academicYear}`,
        academicYear,
        classId: classes[index % classes.length]?.id,
        tuitionFee: fs.tuition.toString(),
        admissionFee: fs.admission.toString(),
        registrationFee: fs.registration.toString(),
        examFee: fs.exam.toString(),
        libraryFee: fs.library.toString(),
        laboratoryFee: fs.lab.toString(),
        sportsFee: fs.sports.toString(),
        totalAmount: fs.total.toString(),
        installments: 3,
        isActive: true,
      },
    });
    createdStructures.push({ id: structure.id, total: fs.total });
  }

  let paymentCount = 0;
  for (let i = 0; i < Math.min(150, students.length); i++) {
    const student = students[i];
    const structure = createdStructures[i % createdStructures.length];
    const isPaid = i < 100;

    const feeAssignment = await prisma.feeAssignment.create({
      data: {
        schoolId,
        studentId: student.id,
        feeStructureId: structure.id,
        academicYear,
        finalAmount: structure.total.toString(),
        status: isPaid ? FeeStatus.PAID : i < 120 ? FeeStatus.PARTIAL : FeeStatus.PENDING,
      },
    });

    if (isPaid || i < 120) {
      const paymentAmount = isPaid ? structure.total : structure.total * 0.5;
      const paymentNumber = `PAY-2025-${String(paymentCount + 1).padStart(5, "0")}`;

      await prisma.payment.create({
        data: {
          schoolId,
          feeAssignmentId: feeAssignment.id,
          studentId: student.id,
          paymentNumber,
          amount: paymentAmount.toString(),
          paymentDate: new Date(),
          paymentMethod: i % 3 === 0 ? PaymentMethod.CASH : i % 3 === 1 ? PaymentMethod.BANK_TRANSFER : PaymentMethod.CHEQUE,
          receiptNumber: `RCP-2025-${String(paymentCount + 1).padStart(5, "0")}`,
          status: PaymentStatus.SUCCESS,
        },
      });

      paymentCount++;
    }
  }

  console.log(`   ✅ Created: ${createdStructures.length} fee structures, ${paymentCount} payments\n`);
}
