/**
 * Fees Seed Module
 * Creates fee structures, assignments, and payments
 */

import { FeeStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import type { SeedPrisma, StudentRef, ClassRef } from "./types";

export async function seedFees(
  prisma: SeedPrisma,
  schoolId: string,
  classes: ClassRef[],
  students: StudentRef[]
): Promise<void> {
  console.log("💰 Creating fee structures and payments...");

  const academicYear = "2025-2026";

  const feeStructures = [
    { name: "Grade 10-12 Annual Fee", tuition: 20000, admission: 3000, registration: 800, exam: 1500, library: 500, lab: 1200, sports: 600, total: 27600 },
    { name: "Grade 7-9 Annual Fee", tuition: 15000, admission: 2500, registration: 600, exam: 1200, library: 400, lab: 800, sports: 500, total: 21000 },
    { name: "Grade 1-6 Annual Fee", tuition: 12000, admission: 2000, registration: 500, exam: 1000, library: 300, lab: 500, sports: 400, total: 16700 },
    { name: "KG Annual Fee", tuition: 10000, admission: 1500, registration: 400, exam: 500, library: 200, lab: 0, sports: 300, total: 12900 },
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
