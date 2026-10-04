// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import "server-only"

import { db } from "@/lib/db"
import { extractGradeNumber } from "@/lib/grade-utils"

import type { ColumnMapping, ImportType } from "../fields"
import type { Table } from "../read-file"
import * as n from "./normalize"
import type {
  GuardianRec,
  ImportOptions,
  Issue,
  PlannedRow,
  PlanResult,
  StaffRec,
  StudentRec,
  TeacherRec,
} from "./types"

/**
 * Table + mapping → one decision per row, without writing anything. The
 * preview shows exactly this, and the run executes exactly this, so what the
 * admin approved is what happens.
 */

type Cells = Record<string, string | undefined>

function cellsOf(mapping: ColumnMapping, row: string[]): Cells {
  const out: Cells = {}
  for (const [key, idx] of Object.entries(mapping))
    out[key] = idx == null ? undefined : row[idx]
  return out
}

function splitName(c: Cells): { first: string; last: string } | null {
  const full = n.text(c.name)
  if (full) {
    const parts = full.split(" ")
    return { first: parts[0], last: parts.slice(1).join(" ") }
  }
  const first = n.text(c.firstName)
  if (!first) return null
  return { first, last: n.text(c.lastName) ?? "" }
}

/** Words without the Arabic article, so "الرياضيات" meets "رياضيات". */
function looseKey(value: string): string {
  return n
    .nameKey(value)
    .split(" ")
    .map((w) => w.replace(/^ال(?=..)/, ""))
    .join(" ")
}

class RowPlan {
  issues: Issue[] = []
  constructor(public row: number) {}
  error(code: string, params?: Issue["params"]) {
    this.issues.push({ row: this.row, code, level: "error", params })
  }
  warn(code: string, params?: Issue["params"]) {
    this.issues.push({ row: this.row, code, level: "warning", params })
  }
  get failed() {
    return this.issues.some((i) => i.level === "error")
  }
}

/** Read an optional value: drop it with a warning when it can't be read. */
function optional<T>(
  p: RowPlan,
  value: T | null | undefined,
  code: string,
  raw: string | undefined
): T | undefined {
  if (value === null) {
    p.warn(code, { value: n.text(raw) ?? "" })
    return undefined
  }
  return value
}

/** First-seen row per key, for duplicate-in-file detection. */
class SeenKeys {
  private seen = new Map<string, number>()
  check(p: RowPlan, key: string | undefined, label: string): boolean {
    if (!key) return true
    const first = this.seen.get(key)
    if (first != null) {
      p.error("DUPLICATE_IN_FILE", { first, value: label })
      return false
    }
    this.seen.set(key, p.row)
    return true
  }
}

function diff<T extends Record<string, unknown>>(
  current: T,
  next: Partial<T>
): { patch: Partial<T>; before: Partial<T> } {
  const patch: Partial<T> = {}
  const before: Partial<T> = {}
  for (const [k, v] of Object.entries(next) as Array<[keyof T, T[keyof T]]>) {
    if (v === undefined) continue
    const cur = current[k]
    const same =
      cur instanceof Date && typeof v === "string"
        ? cur.toISOString().slice(0, 10) === v
        : cur === v
    if (!same) {
      patch[k] = v
      before[k] = (cur instanceof Date ? cur.toISOString() : cur) as T[keyof T]
    }
  }
  return { patch, before }
}

// ---------------------------------------------------------------------------
// Shared lookups
// ---------------------------------------------------------------------------

async function loadDepartments(schoolId: string) {
  const rows = await db.department.findMany({
    where: { schoolId },
    select: { id: true, departmentName: true },
  })
  return new Map(rows.map((d) => [looseKey(d.departmentName), d.id]))
}

/** Emails of every account in the school → user id. */
async function loadUserEmails(schoolId: string) {
  const users = await db.user.findMany({
    where: { schoolId, email: { not: null } },
    select: { id: true, email: true },
  })
  return new Map(users.map((u) => [u.email!.toLowerCase(), u.id]))
}

function resolveDepartment(
  p: RowPlan,
  raw: string | undefined,
  departments: Map<string, string>,
  options: ImportOptions
): { departmentId?: string; newDepartment?: string } {
  const name = n.text(raw)
  if (!name) return {}
  const id = departments.get(looseKey(name))
  if (id) return { departmentId: id }
  if (options.createMissing) {
    p.warn("DEPARTMENT_WILL_BE_CREATED", { value: name })
    return { newDepartment: name }
  }
  p.warn("DEPARTMENT_NOT_FOUND", { value: name })
  return {}
}

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------

async function planStudents(
  schoolId: string,
  table: Table,
  mapping: ColumnMapping,
  options: ImportOptions
): Promise<PlannedRow[]> {
  const [grades, sections, students, userEmails] = await Promise.all([
    db.academicGrade.findMany({
      where: { schoolId },
      select: { id: true, name: true, gradeNumber: true },
    }),
    db.section.findMany({
      where: { schoolId },
      select: { id: true, gradeId: true, name: true, letter: true },
    }),
    db.student.findMany({
      where: { schoolId },
      select: {
        id: true,
        userId: true,
        studentId: true,
        admissionNumber: true,
        email: true,
        firstName: true,
        lastName: true,
        middleName: true,
        dateOfBirth: true,
        gender: true,
        mobileNumber: true,
        academicGradeId: true,
        sectionId: true,
      },
    }),
    loadUserEmails(schoolId),
  ])

  const gradeByNumber = new Map(grades.map((g) => [g.gradeNumber, g]))
  const gradeByName = new Map(grades.map((g) => [n.nameKey(g.name), g]))
  const byCode = new Map<string, (typeof students)[number]>()
  const byEmail = new Map<string, (typeof students)[number]>()
  const byNameDob = new Map<string, (typeof students)[number]>()
  for (const s of students) {
    if (s.studentId) byCode.set(s.studentId, s)
    if (s.admissionNumber) byCode.set(s.admissionNumber, s)
    if (s.email) byEmail.set(s.email.toLowerCase(), s)
    byNameDob.set(
      `${n.nameKey(`${s.firstName} ${s.lastName}`)}|${s.dateOfBirth.toISOString().slice(0, 10)}`,
      s
    )
  }

  function findGrade(raw: string | undefined) {
    const v = n.text(raw)
    if (!v) return null
    const byName = gradeByName.get(n.nameKey(v))
    if (byName) return byName
    const num = extractGradeNumber(n.latinDigits(v))
    return num != null ? (gradeByNumber.get(num) ?? null) : null
  }

  /** "5-B", "Grade 5 B", "الصف الخامس - ب" → grade + section letter. */
  function splitGradeSection(raw: string) {
    const v = n.latinDigits(raw).trim()
    const m = v.match(/^(.*?)[\s\-–/]+([A-Ha-hأابجدهوزح]|[1-8])$/)
    if (!m) return null
    const grade = findGrade(m[1])
    const letter = n.letterIndex(m[2])
    return grade && letter != null ? { grade, letter } : null
  }

  const seen = new SeenKeys()
  const out: PlannedRow[] = []

  table.rows.forEach((cells, i) => {
    const p = new RowPlan(i + 2)
    const c = cellsOf(mapping, cells)
    const name = splitName(c)
    if (!name) {
      p.error("MISSING_NAME")
      out.push({ row: p.row, action: "error", name: "", issues: p.issues })
      return
    }
    const display = `${name.first} ${name.last}`.trim()

    const admissionNumber = n.text(c.studentId)
    const emailValue = n.email(c.email)
    if (emailValue === null)
      p.error("INVALID_EMAIL", { value: n.text(c.email) ?? "" })
    const dob = optional(
      p,
      n.date(c.dateOfBirth),
      "INVALID_DATE",
      c.dateOfBirth
    )
    const genderValue = optional(
      p,
      n.gender(c.gender),
      "INVALID_GENDER",
      c.gender
    )
    const phoneValue = optional(p, n.phone(c.phone), "INVALID_PHONE", c.phone)

    seen.check(
      p,
      admissionNumber && `id:${admissionNumber}`,
      admissionNumber ?? ""
    )
    seen.check(p, emailValue ?? undefined, emailValue ?? "")

    // Grade + section
    let grade = findGrade(c.yearLevel)
    let letter: number | null = null
    if (n.text(c.section)) {
      const combined = splitGradeSection(c.section!)
      if (combined) {
        grade ??= combined.grade
        letter = combined.letter
      } else {
        letter = n.letterIndex(c.section!)
        if (letter == null) {
          // A full section name ("Grade 5-A", "الصف الخامس - أ").
          const hit = sections.find(
            (s) => n.nameKey(s.name) === n.nameKey(c.section!)
          )
          if (hit) {
            grade ??= grades.find((g) => g.id === hit.gradeId) ?? null
            letter = n.letterIndex(hit.letter)
          }
        }
      }
    } else if (!grade && n.text(c.yearLevel)) {
      const combined = splitGradeSection(c.yearLevel!)
      if (combined) {
        grade = combined.grade
        letter = combined.letter
      }
    }
    if (!grade && n.text(c.yearLevel))
      p.warn("GRADE_NOT_FOUND", { value: n.text(c.yearLevel)! })

    let sectionId: string | undefined
    let newSection: StudentRec["newSection"]
    if (grade && letter != null) {
      const hit = sections.find(
        (s) => s.gradeId === grade!.id && n.letterIndex(s.letter) === letter
      )
      if (hit) sectionId = hit.id
      else if (options.createMissing) {
        newSection = { gradeId: grade.id, letter }
        p.warn("SECTION_WILL_BE_CREATED", {
          value: `${grade.name} - ${n.letterFor(letter, "ar")}`,
        })
      } else {
        p.warn("SECTION_NOT_FOUND", {
          value: `${grade.name} - ${n.letterFor(letter, "ar")}`,
        })
      }
    } else if (n.text(c.section) && grade && letter == null) {
      p.warn("SECTION_NOT_FOUND", { value: n.text(c.section)! })
    }

    // Guardians — one generic column set plus father / mother sets.
    const guardians: StudentRec["guardians"] = []
    const addGuardian = (
      relation: n.Relation,
      rawName?: string,
      rawPhone?: string,
      rawEmail?: string
    ) => {
      const gName = n.text(rawName)
      if (!gName) return
      const gEmail = n.email(rawEmail)
      if (gEmail === null)
        p.warn("INVALID_GUARDIAN_EMAIL", { value: n.text(rawEmail)! })
      const gPhone = n.phone(rawPhone)
      if (gPhone === null)
        p.warn("INVALID_GUARDIAN_PHONE", { value: n.text(rawPhone)! })
      if (!gEmail && !gPhone) p.warn("GUARDIAN_NO_CONTACT", { value: gName })
      const parts = gName.split(" ")
      guardians.push({
        relation,
        firstName: parts[0],
        lastName: parts.slice(1).join(" "),
        email: gEmail ?? undefined,
        phone: gPhone ?? undefined,
      })
    }
    addGuardian(
      n.relation(c.guardianRelation),
      c.guardianName,
      c.guardianPhone,
      c.guardianEmail
    )
    addGuardian("father", c.fatherName, c.fatherPhone, c.fatherEmail)
    addGuardian("mother", c.motherName, c.motherPhone, c.motherEmail)

    const rec: StudentRec = {
      kind: "students",
      firstName: name.first,
      lastName: name.last,
      middleName: n.text(c.middleName),
      admissionNumber,
      email: emailValue ?? undefined,
      phone: phoneValue,
      gender: genderValue,
      dateOfBirth: dob,
      gradeId: grade?.id,
      gradeLabel: n.text(c.yearLevel) ?? grade?.name,
      sectionId,
      newSection,
      guardians,
    }
    const summary = [
      grade?.name,
      letter != null ? n.letterFor(letter, "ar") : null,
    ]
      .filter(Boolean)
      .join(" - ")

    if (p.failed) {
      out.push({
        row: p.row,
        action: "error",
        name: display,
        summary,
        issues: p.issues,
      })
      return
    }

    // Existing student?
    const match =
      (admissionNumber && byCode.get(admissionNumber)) ||
      (emailValue && byEmail.get(emailValue)) ||
      (dob && byNameDob.get(`${n.nameKey(display)}|${dob}`)) ||
      null

    if (!match) {
      if (emailValue && userEmails.has(emailValue)) {
        p.error("EMAIL_IN_USE", { value: emailValue })
        out.push({
          row: p.row,
          action: "error",
          name: display,
          summary,
          issues: p.issues,
        })
        return
      }
      out.push({
        row: p.row,
        action: "create",
        name: display,
        summary,
        rec,
        issues: p.issues,
      })
      return
    }

    if (!options.updateExisting) {
      p.warn("ALREADY_EXISTS")
      out.push({
        row: p.row,
        action: "skip",
        name: display,
        summary,
        matchId: match.id,
        issues: p.issues,
      })
      return
    }

    const { patch, before } = diff(match as Record<string, unknown>, {
      firstName: rec.firstName,
      lastName: rec.lastName || undefined,
      middleName: rec.middleName,
      gender: rec.gender,
      dateOfBirth: rec.dateOfBirth,
      mobileNumber: rec.phone,
      academicGradeId: rec.gradeId,
      sectionId: rec.sectionId,
    })
    const changes = Object.keys(patch)
    if (rec.newSection) changes.push("sectionId")
    if (rec.guardians.length) changes.push("guardians")
    if (changes.length === 0) {
      p.warn("UNCHANGED")
      out.push({
        row: p.row,
        action: "skip",
        name: display,
        summary,
        matchId: match.id,
        issues: p.issues,
      })
      return
    }
    out.push({
      row: p.row,
      action: "update",
      name: display,
      summary,
      matchId: match.id,
      rec,
      patch,
      before,
      changes: [...new Set(changes)],
      issues: p.issues,
    })
  })

  return out
}

// ---------------------------------------------------------------------------
// Teachers + staff (same shape: employee id / email / phone identify them)
// ---------------------------------------------------------------------------

async function planEmployees(
  type: "teachers" | "staff",
  schoolId: string,
  table: Table,
  mapping: ColumnMapping,
  options: ImportOptions
): Promise<PlannedRow[]> {
  const [people, departments, userEmails, subjects] = await Promise.all([
    type === "teachers"
      ? db.teacher.findMany({
          where: { schoolId },
          select: {
            id: true,
            userId: true,
            employeeId: true,
            emailAddress: true,
            firstName: true,
            lastName: true,
            gender: true,
            phoneNumbers: { select: { phoneNumber: true } },
            teacherDepartments: { select: { departmentId: true } },
            subjectExpertise: { select: { subjectId: true } },
          },
        })
      : db.staffMember
          .findMany({
            where: { schoolId },
            select: {
              id: true,
              userId: true,
              employeeId: true,
              emailAddress: true,
              firstName: true,
              lastName: true,
              gender: true,
              position: true,
              employmentType: true,
              phoneNumber: true,
              departmentId: true,
            },
          })
          .then((rows) =>
            rows.map((r) => ({
              ...r,
              phoneNumbers: r.phoneNumber
                ? [{ phoneNumber: r.phoneNumber }]
                : [],
              teacherDepartments: [] as Array<{ departmentId: string }>,
              subjectExpertise: [] as Array<{ subjectId: string }>,
            }))
          ),
    loadDepartments(schoolId),
    loadUserEmails(schoolId),
    type === "teachers"
      ? db.subjectSelection.findMany({
          where: { schoolId, isActive: true },
          select: {
            catalogSubjectId: true,
            customName: true,
            subject: { select: { name: true } },
          },
        })
      : Promise.resolve([]),
  ])

  const subjectByKey = new Map<string, string>()
  for (const s of subjects) {
    subjectByKey.set(looseKey(s.subject.name), s.catalogSubjectId)
    if (s.customName)
      subjectByKey.set(looseKey(s.customName), s.catalogSubjectId)
  }

  type Person = (typeof people)[number]
  const byEmployeeId = new Map<string, Person>()
  const byEmail = new Map<string, Person>()
  const byPhone = new Map<string, Person>()
  for (const t of people) {
    if (t.employeeId) byEmployeeId.set(t.employeeId.toLowerCase(), t)
    if (t.emailAddress) byEmail.set(t.emailAddress.toLowerCase(), t)
    for (const ph of t.phoneNumbers) byPhone.set(ph.phoneNumber, t)
  }

  const seen = new SeenKeys()
  const out: PlannedRow[] = []

  table.rows.forEach((cells, i) => {
    const p = new RowPlan(i + 2)
    const c = cellsOf(mapping, cells)
    const name = splitName(c)
    if (!name) {
      p.error("MISSING_NAME")
      out.push({ row: p.row, action: "error", name: "", issues: p.issues })
      return
    }
    const display = `${name.first} ${name.last}`.trim()
    const employeeId = n.text(c.employeeId)
    const emailValue = n.email(c.email)
    if (emailValue === null)
      p.error("INVALID_EMAIL", { value: n.text(c.email) ?? "" })
    const phoneValue = optional(p, n.phone(c.phone), "INVALID_PHONE", c.phone)
    const genderValue = optional(
      p,
      n.gender(c.gender),
      "INVALID_GENDER",
      c.gender
    )
    const dept = resolveDepartment(p, c.department, departments, options)

    seen.check(
      p,
      employeeId && `id:${employeeId.toLowerCase()}`,
      employeeId ?? ""
    )
    seen.check(p, emailValue ?? undefined, emailValue ?? "")

    const subjectIds: string[] = []
    if (type === "teachers") {
      for (const s of n.list(c.subjects)) {
        const id = subjectByKey.get(looseKey(s))
        if (id) subjectIds.push(id)
        else p.warn("SUBJECT_NOT_FOUND", { value: s })
      }
    }

    const employment =
      type === "staff"
        ? optional(
            p,
            n.employmentType(c.employmentType),
            "INVALID_EMPLOYMENT_TYPE",
            c.employmentType
          )
        : undefined

    const rec: TeacherRec | StaffRec =
      type === "teachers"
        ? {
            kind: "teachers",
            firstName: name.first,
            lastName: name.last,
            employeeId,
            email: emailValue ?? undefined,
            phone: phoneValue,
            gender: genderValue,
            ...dept,
            subjectIds: [...new Set(subjectIds)],
          }
        : {
            kind: "staff",
            firstName: name.first,
            lastName: name.last,
            employeeId,
            email: emailValue ?? undefined,
            phone: phoneValue,
            gender: genderValue,
            position: n.text(c.position),
            employmentType: employment,
            ...dept,
          }
    const summary =
      n.text(type === "staff" ? c.position : c.department) ?? undefined

    if (p.failed) {
      out.push({
        row: p.row,
        action: "error",
        name: display,
        summary,
        issues: p.issues,
      })
      return
    }

    const match =
      (employeeId && byEmployeeId.get(employeeId.toLowerCase())) ||
      (emailValue && byEmail.get(emailValue)) ||
      (phoneValue && byPhone.get(phoneValue)) ||
      null

    if (!match) {
      if (emailValue && userEmails.has(emailValue)) {
        p.error("EMAIL_IN_USE", { value: emailValue })
        out.push({
          row: p.row,
          action: "error",
          name: display,
          summary,
          issues: p.issues,
        })
        return
      }
      out.push({
        row: p.row,
        action: "create",
        name: display,
        summary,
        rec,
        issues: p.issues,
      })
      return
    }
    if (!options.updateExisting) {
      p.warn("ALREADY_EXISTS")
      out.push({
        row: p.row,
        action: "skip",
        name: display,
        summary,
        matchId: match.id,
        issues: p.issues,
      })
      return
    }

    const next: Record<string, unknown> = {
      firstName: rec.firstName,
      lastName: rec.lastName || undefined,
      gender: rec.gender,
      employeeId: match.employeeId ? undefined : rec.employeeId,
      emailAddress:
        match.emailAddress || !rec.email || userEmails.has(rec.email)
          ? undefined
          : rec.email,
    }
    if (rec.kind === "staff") {
      next.position = rec.position
      next.employmentType = rec.employmentType
      next.phoneNumber = rec.phone
      next.departmentId = rec.departmentId
    }
    const { patch, before } = diff(match as Record<string, unknown>, next)
    const changes = Object.keys(patch)
    if (
      rec.kind === "teachers" &&
      rec.phone &&
      !match.phoneNumbers.some((ph) => ph.phoneNumber === rec.phone)
    )
      changes.push("phone")
    if (
      rec.kind === "teachers" &&
      (rec.newDepartment ||
        (rec.departmentId &&
          !match.teacherDepartments.some(
            (d) => d.departmentId === rec.departmentId
          )))
    )
      changes.push("department")
    if (
      rec.kind === "teachers" &&
      rec.subjectIds.some(
        (id) => !match.subjectExpertise.some((e) => e.subjectId === id)
      )
    )
      changes.push("subjects")
    if (rec.kind === "staff" && rec.newDepartment) changes.push("departmentId")

    if (changes.length === 0) {
      p.warn("UNCHANGED")
      out.push({
        row: p.row,
        action: "skip",
        name: display,
        summary,
        matchId: match.id,
        issues: p.issues,
      })
      return
    }
    out.push({
      row: p.row,
      action: "update",
      name: display,
      summary,
      matchId: match.id,
      rec,
      patch,
      before,
      changes: [...new Set(changes)],
      issues: p.issues,
    })
  })

  return out
}

// ---------------------------------------------------------------------------
// Guardians
// ---------------------------------------------------------------------------

async function planGuardians(
  schoolId: string,
  table: Table,
  mapping: ColumnMapping,
  options: ImportOptions
): Promise<PlannedRow[]> {
  const [guardians, phones, students, userEmails] = await Promise.all([
    db.guardian.findMany({
      where: { schoolId },
      select: {
        id: true,
        userId: true,
        emailAddress: true,
        firstName: true,
        lastName: true,
        studentGuardians: { select: { studentId: true } },
      },
    }),
    db.guardianPhoneNumber.findMany({
      where: { schoolId },
      select: { guardianId: true, phoneNumber: true },
    }),
    db.student.findMany({
      where: { schoolId },
      select: {
        id: true,
        studentId: true,
        admissionNumber: true,
        firstName: true,
        lastName: true,
      },
    }),
    loadUserEmails(schoolId),
  ])

  const byId = new Map(guardians.map((g) => [g.id, g]))
  const byEmail = new Map<string, (typeof guardians)[number]>()
  for (const g of guardians)
    if (g.emailAddress) byEmail.set(g.emailAddress.toLowerCase(), g)
  const byPhone = new Map<string, (typeof guardians)[number]>()
  for (const ph of phones) {
    const g = byId.get(ph.guardianId)
    if (g) byPhone.set(ph.phoneNumber, g)
  }
  const studentName = new Map(
    students.map((s) => [s.id, `${s.firstName} ${s.lastName}`.trim()])
  )
  const studentByCode = new Map<string, string>()
  for (const s of students) {
    if (s.studentId) studentByCode.set(s.studentId, s.id)
    if (s.admissionNumber) studentByCode.set(s.admissionNumber, s.id)
  }

  const seen = new SeenKeys()
  const out: PlannedRow[] = []

  table.rows.forEach((cells, i) => {
    const p = new RowPlan(i + 2)
    const c = cellsOf(mapping, cells)
    const name = splitName(c)
    if (!name) {
      p.error("MISSING_NAME")
      out.push({ row: p.row, action: "error", name: "", issues: p.issues })
      return
    }
    const display = `${name.first} ${name.last}`.trim()
    const emailValue = n.email(c.email)
    if (emailValue === null)
      p.error("INVALID_EMAIL", { value: n.text(c.email) ?? "" })
    const phoneValue = optional(p, n.phone(c.phone), "INVALID_PHONE", c.phone)
    if (!emailValue && !phoneValue)
      p.warn("GUARDIAN_NO_CONTACT", { value: display })

    seen.check(p, emailValue ?? undefined, emailValue ?? "")

    const studentIds: string[] = []
    for (const code of n.list(c.studentId)) {
      const id = studentByCode.get(n.latinDigits(code))
      if (id) studentIds.push(id)
      else p.warn("STUDENT_NOT_FOUND", { value: code })
    }

    const rec: GuardianRec = {
      kind: "guardians",
      firstName: name.first,
      lastName: name.last,
      email: emailValue ?? undefined,
      phone: phoneValue,
      relation: n.relation(c.relation),
      studentIds,
    }
    const summary = studentIds.length
      ? studentIds.map((id) => studentName.get(id)).join("، ")
      : undefined

    if (p.failed) {
      out.push({ row: p.row, action: "error", name: display, issues: p.issues })
      return
    }

    const match =
      (emailValue && byEmail.get(emailValue)) ||
      (phoneValue && byPhone.get(phoneValue)) ||
      null
    if (!match) {
      if (emailValue && userEmails.has(emailValue)) {
        p.error("EMAIL_IN_USE", { value: emailValue })
        out.push({
          row: p.row,
          action: "error",
          name: display,
          issues: p.issues,
        })
        return
      }
      out.push({
        row: p.row,
        action: "create",
        name: display,
        summary,
        rec,
        issues: p.issues,
      })
      return
    }

    // Linking an existing parent to their children is what a guardians file
    // is for — do it even without "update existing"; only renames need it.
    const newLinks = studentIds.filter(
      (id) => !match.studentGuardians.some((sg) => sg.studentId === id)
    )
    const { patch, before } = options.updateExisting
      ? diff(match as Record<string, unknown>, {
          firstName: rec.firstName,
          lastName: rec.lastName || undefined,
        })
      : { patch: {}, before: {} }
    const changes = Object.keys(patch)
    if (newLinks.length) changes.push("students")
    if (
      options.updateExisting &&
      phoneValue &&
      byPhone.get(phoneValue) !== match
    )
      changes.push("phone")

    if (changes.length === 0) {
      p.warn(options.updateExisting ? "UNCHANGED" : "ALREADY_EXISTS")
      out.push({
        row: p.row,
        action: "skip",
        name: display,
        summary,
        matchId: match.id,
        issues: p.issues,
      })
      return
    }
    out.push({
      row: p.row,
      action: "update",
      name: display,
      summary,
      matchId: match.id,
      rec: {
        ...rec,
        studentIds: newLinks,
        phone: options.updateExisting ? rec.phone : undefined,
      },
      patch,
      before,
      changes,
      issues: p.issues,
    })
  })

  return out
}

// ---------------------------------------------------------------------------

export async function planImport(
  type: ImportType,
  schoolId: string,
  table: Table,
  mapping: ColumnMapping,
  options: ImportOptions
): Promise<PlanResult> {
  const rows =
    type === "students"
      ? await planStudents(schoolId, table, mapping, options)
      : type === "guardians"
        ? await planGuardians(schoolId, table, mapping, options)
        : await planEmployees(type, schoolId, table, mapping, options)

  const counts = { create: 0, update: 0, skip: 0, error: 0 }
  for (const r of rows) counts[r.action]++
  return { rows, counts }
}
