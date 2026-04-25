import { db } from "@/lib/db"

type PrismaLike = Pick<typeof db, "student" | "academicGrade" | "schoolYear">

interface GenerateArgs {
  schoolId: string
  academicGradeId?: string | null
  schoolYearStart?: Date | null
  tx?: PrismaLike
}

const PREFIX_LENGTH = 4 // YY + GG
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
 * Per-school student username code in compact 8-char shape: YYGGNNNN
 *
 * Layout: `${YY}${GG}${NNNN}` — always 8 digits
 *   YY    last 2 digits of academic year start (e.g. "26" for 2026-2027)
 *   GG    AcademicGrade.gradeNumber zero-padded to 2 digits (00 = unassigned)
 *   NNNN  per-(school, year, grade) sequence zero-padded to 4 digits
 *
 * Examples: "26010001" "26100042" "27120007"
 *
 * Uniqueness comes from Student.@@unique([schoolId, studentId]) — the generator
 * probes the latest existing code for this prefix and increments. Legacy codes
 * had a `G` separator (`YYGGGNNNN`, 9 chars); both shapes coexist. The probe
 * consults both formats to keep the sequence counter monotonic.
 */
export async function generateStudentUsername(
  args: GenerateArgs
): Promise<string> {
  const client = (args.tx ?? db) as PrismaLike

  const [yy, gg] = await Promise.all([
    resolveYearTwoDigits(client, args.schoolId, args.schoolYearStart),
    resolveGradeTwoDigits(client, args.academicGradeId),
  ])

  const newPrefix = `${yy}${gg}`
  const legacyPrefix = `${yy}G${gg}`

  const [newLatest, legacyLatest] = await Promise.all([
    client.student.findFirst({
      where: { schoolId: args.schoolId, studentId: { startsWith: newPrefix } },
      orderBy: { studentId: "desc" },
      select: { studentId: true },
    }),
    client.student.findFirst({
      where: {
        schoolId: args.schoolId,
        studentId: { startsWith: legacyPrefix },
      },
      orderBy: { studentId: "desc" },
      select: { studentId: true },
    }),
  ])

  const parseTail = (id: string | null | undefined, prefix: string): number => {
    if (!id || id.length < prefix.length) return 0
    const parsed = parseInt(id.slice(prefix.length), 10)
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
  }

  const newSeq = parseTail(newLatest?.studentId, newPrefix)
  const legacySeq = parseTail(legacyLatest?.studentId, legacyPrefix)
  const nextSeq = Math.max(newSeq, legacySeq) + 1

  return `${newPrefix}${padFour(nextSeq)}`
}

export const STUDENT_USERNAME_PREFIX_LENGTH = PREFIX_LENGTH
