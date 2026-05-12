// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { db } from "@/lib/db"

import type {
  Role,
  SpotlightGroupKind,
  SpotlightResult,
  SpotlightResultGroup,
} from "../types"
import {
  announcementWhere,
  applicationWhere,
  bookWhere,
  buildEntityKindList,
  classroomWhere,
  classWhere,
  driverWhere,
  eventWhere,
  guardianWhere,
  invoiceWhere,
  paymentWhere,
  routeWhere,
  studentWhere,
  subjectWhere,
  teacherWhere,
  vehicleWhere,
  type PredicateCtx,
} from "./rbac-predicates"

const ALL_KINDS: SpotlightGroupKind[] = [
  "student",
  "teacher",
  "guardian",
  "class",
  "classroom",
  "subject",
  "vehicle",
  "driver",
  "route",
  "application",
  "payment",
  "invoice",
  "book",
  "announcement",
  "event",
]

interface GlobalSearchOpts {
  schoolId: string
  userId: string
  role: Role
  query: string
  locale?: "en" | "ar"
  kinds?: readonly SpotlightGroupKind[]
  perKindLimit: number
}

/**
 * Phase 2 implementation: parallel `findMany` per kind. Each kind that
 * passes the RBAC gate runs an independent query bounded by `perKindLimit`,
 * then results are projected into the kind-agnostic `SpotlightResult` shape.
 *
 * Phase 3 will replace this with a single Postgres UNION ALL backed by
 * `pg_trgm` GIN indexes for similarity ranking. Public API is identical so
 * the swap is transparent to callers.
 */
export async function globalSearch(
  opts: GlobalSearchOpts
): Promise<SpotlightResultGroup[]> {
  const allowed = buildEntityKindList(opts.role, opts.kinds ?? ALL_KINDS)
  if (allowed.length === 0) return []

  const ctx: PredicateCtx = {
    schoolId: opts.schoolId,
    userId: opts.userId,
    role: opts.role,
    search: opts.query.trim(),
  }

  const groups = await Promise.all(
    allowed.map<Promise<SpotlightResultGroup | null>>(async (kind) => {
      const results = await searchKind(kind, ctx, opts.perKindLimit)
      if (results.length === 0) return null
      return { kind, results }
    })
  )

  return groups.filter((g): g is SpotlightResultGroup => g !== null)
}

/**
 * Per-kind dispatch. Each branch builds the kind's where clause, runs a
 * narrow `findMany`, and projects rows into `SpotlightResult`.
 */
async function searchKind(
  kind: SpotlightGroupKind,
  c: PredicateCtx,
  take: number
): Promise<SpotlightResult[]> {
  switch (kind) {
    case "student": {
      const where = studentWhere(c)
      if (!where) return []
      const rows = await db.student.findMany({
        where,
        take,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          studentId: true,
          grNumber: true,
          email: true,
          lang: true,
          academicGrade: { select: { name: true } },
        },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      })
      return rows.map<SpotlightResult>((r) => ({
        kind: "student",
        id: r.id,
        label: joinName(r.firstName, r.lastName),
        secondaryLabel: r.studentId ?? r.grNumber ?? r.email ?? undefined,
        href: `/students/${r.id}`,
        breadcrumb: r.academicGrade?.name ? [r.academicGrade.name] : undefined,
        lang: normalizeLang(r.lang),
      }))
    }

    case "teacher": {
      const where = teacherWhere(c)
      if (!where) return []
      const rows = await db.teacher.findMany({
        where,
        take,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeId: true,
          emailAddress: true,
          lang: true,
        },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      })
      return rows.map<SpotlightResult>((r) => ({
        kind: "teacher",
        id: r.id,
        label: joinName(r.firstName, r.lastName),
        secondaryLabel: r.employeeId ?? r.emailAddress ?? undefined,
        href: `/teachers/${r.id}`,
        lang: normalizeLang(r.lang),
      }))
    }

    case "guardian": {
      const where = guardianWhere(c)
      if (!where) return []
      const rows = await db.guardian.findMany({
        where,
        take,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          emailAddress: true,
          lang: true,
        },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      })
      return rows.map<SpotlightResult>((r) => ({
        kind: "guardian",
        id: r.id,
        label: joinName(r.firstName, r.lastName),
        secondaryLabel: r.emailAddress ?? undefined,
        href: `/parents/${r.id}`,
        lang: normalizeLang(r.lang),
      }))
    }

    case "class": {
      const where = classWhere(c)
      if (!where) return []
      const rows = await db.class.findMany({
        where,
        take,
        select: {
          id: true,
          name: true,
          courseCode: true,
          lang: true,
          subject: { select: { name: true } },
        },
        orderBy: { name: "asc" },
      })
      return rows.map<SpotlightResult>((r) => ({
        kind: "class",
        id: r.id,
        label: r.name,
        secondaryLabel: r.courseCode ?? undefined,
        href: `/classes/${r.id}`,
        breadcrumb: r.subject?.name ? [r.subject.name] : undefined,
        lang: normalizeLang(r.lang),
      }))
    }

    case "classroom": {
      const where = classroomWhere(c)
      if (!where) return []
      const rows = await db.classroom.findMany({
        where,
        take,
        select: { id: true, roomName: true, lang: true },
        orderBy: { roomName: "asc" },
      })
      return rows.map<SpotlightResult>((r) => ({
        kind: "classroom",
        id: r.id,
        label: r.roomName,
        href: `/classrooms/${r.id}`,
        lang: normalizeLang(r.lang),
      }))
    }

    case "subject": {
      const where = subjectWhere(c)
      if (!where) return []
      const rows = await db.subject.findMany({
        where,
        take,
        select: {
          id: true,
          name: true,
          slug: true,
          department: true,
          lang: true,
        },
        orderBy: { name: "asc" },
      })
      return rows.map<SpotlightResult>((r) => ({
        kind: "subject",
        id: r.id,
        label: r.name,
        secondaryLabel: r.department,
        href: `/subjects/${r.slug}`,
        lang: normalizeLang(r.lang),
      }))
    }

    case "announcement": {
      const where = announcementWhere(c)
      if (!where) return []
      const rows = await db.announcement.findMany({
        where,
        take,
        select: { id: true, title: true, lang: true },
        orderBy: { publishedAt: "desc" },
      })
      return rows.map<SpotlightResult>((r) => ({
        kind: "announcement",
        id: r.id,
        label: r.title ?? "—",
        href: `/announcements/${r.id}`,
        lang: normalizeLang(r.lang),
      }))
    }

    case "event": {
      const where = eventWhere(c)
      if (!where) return []
      const rows = await db.event.findMany({
        where,
        take,
        select: {
          id: true,
          title: true,
          location: true,
          lang: true,
        },
        orderBy: { eventDate: "desc" },
      })
      return rows.map<SpotlightResult>((r) => ({
        kind: "event",
        id: r.id,
        label: r.title,
        secondaryLabel: r.location ?? undefined,
        href: `/events/${r.id}`,
        lang: normalizeLang(r.lang),
      }))
    }

    case "book": {
      const where = bookWhere(c)
      if (!where) return []
      const rows = await db.schoolBook.findMany({
        where,
        take,
        select: {
          id: true,
          title: true,
          author: true,
          isbn: true,
        },
        orderBy: { title: "asc" },
      })
      return rows.map<SpotlightResult>((r) => ({
        kind: "book",
        id: r.id,
        label: r.title,
        secondaryLabel: r.author,
        href: `/library/books/${r.id}`,
      }))
    }

    case "vehicle": {
      const where = vehicleWhere(c)
      if (!where) return []
      const rows = await db.vehicle.findMany({
        where,
        take,
        select: {
          id: true,
          plateNumber: true,
          make: true,
          model: true,
        },
        orderBy: { plateNumber: "asc" },
      })
      return rows.map<SpotlightResult>((r) => ({
        kind: "vehicle",
        id: r.id,
        label: r.plateNumber,
        secondaryLabel:
          [r.make, r.model].filter(Boolean).join(" ") || undefined,
        href: `/transportation/vehicles/${r.id}`,
      }))
    }

    case "driver": {
      const where = driverWhere(c)
      if (!where) return []
      const rows = await db.driver.findMany({
        where,
        take,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          licenseNumber: true,
        },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      })
      return rows.map<SpotlightResult>((r) => ({
        kind: "driver",
        id: r.id,
        label: joinName(r.firstName, r.lastName),
        secondaryLabel: r.licenseNumber ?? undefined,
        href: `/transportation/drivers/${r.id}`,
      }))
    }

    case "route": {
      const where = routeWhere(c)
      if (!where) return []
      const rows = await db.route.findMany({
        where,
        take,
        select: {
          id: true,
          name: true,
          code: true,
          originName: true,
          destinationName: true,
        },
        orderBy: { name: "asc" },
      })
      return rows.map<SpotlightResult>((r) => ({
        kind: "route",
        id: r.id,
        label: r.name,
        secondaryLabel: r.code ?? undefined,
        href: `/transportation/routes/${r.id}`,
        breadcrumb:
          r.originName && r.destinationName
            ? [`${r.originName} → ${r.destinationName}`]
            : undefined,
      }))
    }

    case "application": {
      const where = applicationWhere(c)
      if (!where) return []
      const rows = await db.application.findMany({
        where,
        take,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          applicationNumber: true,
          email: true,
        },
        orderBy: { createdAt: "desc" },
      })
      return rows.map<SpotlightResult>((r) => ({
        kind: "application",
        id: r.id,
        label: joinName(r.firstName, r.lastName),
        secondaryLabel: r.applicationNumber ?? r.email ?? undefined,
        href: `/admission/applications/${r.id}`,
      }))
    }

    case "payment": {
      const where = paymentWhere(c)
      if (!where) return []
      const rows = await db.payment.findMany({
        where,
        take,
        select: {
          id: true,
          paymentNumber: true,
          receiptNumber: true,
          amount: true,
        },
        orderBy: { createdAt: "desc" },
      })
      return rows.map<SpotlightResult>((r) => ({
        kind: "payment",
        id: r.id,
        label: r.paymentNumber,
        secondaryLabel:
          r.receiptNumber ?? (r.amount ? r.amount.toString() : undefined),
        href: `/finance/fees/payments/${r.id}`,
        breadcrumb: ["Finance", "Payments"],
      }))
    }

    case "invoice": {
      const where = invoiceWhere(c)
      if (!where) return []
      const rows = await db.userInvoice.findMany({
        where,
        take,
        select: { id: true, invoice_no: true },
        orderBy: { createdAt: "desc" },
      })
      return rows.map<SpotlightResult>((r) => ({
        kind: "invoice",
        id: r.id,
        label: r.invoice_no,
        href: `/finance/invoice/view/${r.id}`,
        breadcrumb: ["Finance", "Invoices"],
      }))
    }
  }
}

/**
 * Format a stored name in the language-neutral "first last" order. Empty
 * pieces are dropped so a single-name student doesn't render as " ".
 */
function joinName(first: string | null, last: string | null): string {
  return (
    [first ?? "", last ?? ""]
      .map((s) => s.trim())
      .filter(Boolean)
      .join(" ")
      .trim() || "—"
  )
}

/** Coerce a stored `lang` string into the SpotlightResult.lang union. */
function normalizeLang(lang?: string | null): "en" | "ar" | undefined {
  if (lang === "en" || lang === "ar") return lang
  return undefined
}
