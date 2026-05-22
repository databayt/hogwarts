// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { getAssignment } from "../actions/assignments"
import { TransportationEmptyState } from "../empty-state"

interface Props {
  assignmentId: string
  locale: Locale
  subdomain: string
  dictionary: Dictionary
}

function fmt(value: Date | string | null | undefined, locale: Locale) {
  if (!value) return "—"
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(typeof value === "string" ? new Date(value) : value)
}

export async function AssignmentDetailContent({
  assignmentId,
  locale,
  dictionary,
}: Props) {
  const result = await getAssignment(assignmentId)
  const t = dictionary.transportation

  if (!result.success || !("data" in result)) {
    return (
      <TransportationEmptyState
        title={t.errors.notFound}
        action={
          <Button asChild variant="outline">
            <Link href={`/${locale}/transportation/assignments`}>
              {t.nav.assignments}
            </Link>
          </Button>
        }
      />
    )
  }

  const a = result.data
  const studentName = `${a.student.firstName} ${a.student.lastName}`

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{studentName}</h2>
          <p className="text-muted-foreground text-sm">
            {t.assignments.statuses[
              a.status as keyof typeof t.assignments.statuses
            ] ?? a.status}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/${locale}/transportation/assignments`}>
            {t.nav.assignments}
          </Link>
        </Button>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.assignments.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label={t.assignments.fields.student} value={studentName} />
            <Row
              label={t.assignments.fields.route}
              value={
                a.route.code
                  ? `${a.route.name} (${a.route.code})`
                  : a.route.name
              }
            />
            <Row
              label={t.assignments.fields.stop}
              value={`${a.stop.name} (#${a.stop.stopOrder})`}
            />
            <Row
              label={t.assignments.fields.direction}
              value={
                t.routes.directions[
                  a.direction as keyof typeof t.routes.directions
                ] ?? a.direction
              }
            />
            <Row
              label={t.assignments.fields.status}
              value={
                t.assignments.statuses[
                  a.status as keyof typeof t.assignments.statuses
                ] ?? a.status
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t.assignments.fields.effectiveFrom}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row
              label={t.assignments.fields.effectiveFrom}
              value={fmt(a.effectiveFrom, locale)}
            />
            <Row
              label={t.assignments.fields.effectiveTo}
              value={fmt(a.effectiveTo, locale)}
            />
          </CardContent>
        </Card>
      </div>

      {a.notes ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t.assignments.fields.notes}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">
            {a.notes}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b py-1.5 last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  )
}
