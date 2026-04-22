import { db } from "@/lib/db"

type PrismaLike = Pick<typeof db, "student" | "academicGrade" | "schoolYear">

interface GenerateArgs {
  schoolId: string
  academicGradeId?: string | null
  schoolYearStart?: Date | null
  tx?: PrismaLike
}

const PREFIX_LENGTH = 5 // YY + G + GG
const SEQUENCE_LENGTH = 4

function padTwo(n: number): string {
  return n.toString().padStart(2, "0").slice(-2)
}

function padFour(n: number): string {
  return n.toString().padStart(SEQUENCE_LENGTH, "0")
}

async function resolveYearTwoDigits(
  client: PrismaLike,
  schoolId: string,
  schoolYearStart?: Date | null
): Promise<string> {
  if (schoolYearStart) {
    return padTwo(schoolYearStart.getFullYear() % 100)
  }

  const latest = await client.schoolYear.findFirst({
    where: { schoolId },
    orderBy: { startDate: "desc" },
    select: { startDate: true },
  })

  if (latest?.startDate) {
    return padTwo(latest.startDate.getFullYear() % 100)
  }

  return padTwo(new Date().getFullYear() % 100)
}

async function resolveGradeTwoDigits(
  client: PrismaLike,
  academicGradeId?: string | null
): Promise<string> {
  if (!academicGradeId) return "00"

  const grade = await client.academicGrade.findUnique({
    where: { id: academicGradeId },
    select: { gradeNumber: true },
  })

  if (grade?.gradeNumber == null) return "00"
  return padTwo(grade.gradeNumber)
}

/**
 * Per-school student username code in compact 9-char shape: YYGGGNNNN
 *
 * Layout: `${YY}G${GG}${NNNN}` — always 9 chars
 *   YY    last 2 digits of academic year start (e.g. "26" for 2026-2027)
 *   G     literal separator
 *   GG    AcademicGrade.gradeNumber zero-padded to 2 digits (00 = unassigned)
 *   NNNN  per-(school, year, grade) sequence zero-padded to 4 digits
 *
 * Examples: "26G010001" "26G100042" "27G120007"
 *
 * Uniqueness comes from Student.@@unique([schoolId, studentId]) — the generator
 * probes the latest existing code for this prefix and increments. Pass a tx
 * client when called inside a $transaction to share the snapshot.
 *
 * Mirrors generateUniqueInvoiceNumber in finance/invoice/actions.ts.
 */
export async function generateStudentUsername(
  args: GenerateArgs
): Promise<string> {
  const client = (args.tx ?? db) as PrismaLike

  const [yy, gg] = await Promise.all([
    resolveYearTwoDigits(client, args.schoolId, args.schoolYearStart),
    resolveGradeTwoDigits(client, args.academicGradeId),
  ])

  const prefix = `${yy}G${gg}`

  const latest = await client.student.findFirst({
    where: {
      schoolId: args.schoolId,
      studentId: { startsWith: prefix },
    },
    orderBy: { studentId: "desc" },
    select: { studentId: true },
  })

  let nextSeq = 1
  if (latest?.studentId && latest.studentId.length >= prefix.length) {
    const tail = latest.studentId.slice(prefix.length)
    const parsed = parseInt(tail, 10)
    if (Number.isFinite(parsed) && parsed >= 0) {
      nextSeq = parsed + 1
    }
  }

  return `${prefix}${padFour(nextSeq)}`
}

export const STUDENT_USERNAME_PREFIX_LENGTH = PREFIX_LENGTH
