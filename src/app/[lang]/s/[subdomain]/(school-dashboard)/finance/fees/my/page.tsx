// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { MyFees } from "@/components/school-dashboard/finance/fees/my-fees"

export const metadata = { title: "My Fees" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function MyFeesPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const session = await auth()
  const { schoolId } = await getTenantContext()

  if (!session?.user?.id || !schoolId) notFound()

  const role = session.user.role

  // Resolve student IDs based on role
  let studentIds: string[] = []
  let studentNameMap: Record<string, string> = {}

  if (role === "STUDENT") {
    const student = await db.student.findFirst({
      where: { userId: session.user.id, schoolId },
      select: { id: true, firstName: true, lastName: true },
    })
    if (!student) notFound()
    studentIds = [student.id]
    studentNameMap[student.id] = [student.firstName, student.lastName]
      .filter(Boolean)
      .join(" ")
  } else if (role === "GUARDIAN") {
    const guardian = await db.guardian.findFirst({
      where: { userId: session.user.id, schoolId },
      select: {
        studentGuardians: {
          select: {
            student: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    })
    if (!guardian?.studentGuardians?.length) notFound()
    studentIds = guardian.studentGuardians.map((sg) => sg.student.id)
    for (const sg of guardian.studentGuardians) {
      studentNameMap[sg.student.id] = [
        sg.student.firstName,
        sg.student.lastName,
      ]
        .filter(Boolean)
        .join(" ")
    }
  } else {
    // Admin/Accountant/etc — redirect to full fees page
    redirect(`/${lang}/finance/fees`)
  }

  // Fetch fee assignments for resolved students
  const assignments = await db.feeAssignment.findMany({
    where: { schoolId, studentId: { in: studentIds } },
    include: {
      feeStructure: { select: { name: true } },
      student: { select: { id: true, firstName: true, lastName: true } },
      payments: {
        where: { status: "SUCCESS" },
        select: {
          id: true,
          paymentNumber: true,
          receiptNumber: true,
          amount: true,
          paymentDate: true,
          paymentMethod: true,
          status: true,
        },
        orderBy: { paymentDate: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Group by student for guardian view
  if (role === "GUARDIAN" && studentIds.length > 1) {
    // Show all children's fees together
    const allAssignments = assignments.map((a) => ({
      id: a.id,
      feeStructureName: `${studentNameMap[a.studentId] || ""} — ${a.feeStructure?.name || "-"}`,
      academicYear: a.academicYear,
      finalAmount: Number(a.finalAmount),
      totalDiscount: Number(a.totalDiscount),
      paidAmount: a.payments.reduce((sum, p) => sum + Number(p.amount), 0),
      status: a.status,
      payments: a.payments.map((p) => ({
        id: p.id,
        paymentNumber: p.paymentNumber,
        receiptNumber: p.receiptNumber,
        amount: Number(p.amount),
        paymentDate: p.paymentDate.toISOString(),
        paymentMethod: p.paymentMethod,
        status: p.status,
      })),
    }))

    const childNames = Object.values(studentNameMap).join(", ")

    return (
      <MyFees
        studentName={childNames}
        assignments={allAssignments}
        lang={lang}
      />
    )
  }

  // Single student view
  const studentName = studentNameMap[studentIds[0]] || "Student"
  const data = assignments.map((a) => ({
    id: a.id,
    feeStructureName: a.feeStructure?.name || "-",
    academicYear: a.academicYear,
    finalAmount: Number(a.finalAmount),
    totalDiscount: Number(a.totalDiscount),
    paidAmount: a.payments.reduce((sum, p) => sum + Number(p.amount), 0),
    status: a.status,
    payments: a.payments.map((p) => ({
      id: p.id,
      paymentNumber: p.paymentNumber,
      receiptNumber: p.receiptNumber,
      amount: Number(p.amount),
      paymentDate: p.paymentDate.toISOString(),
      paymentMethod: p.paymentMethod,
      status: p.status,
    })),
  }))

  return <MyFees studentName={studentName} assignments={data} lang={lang} />
}
