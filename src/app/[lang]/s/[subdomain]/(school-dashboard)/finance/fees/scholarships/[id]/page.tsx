// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { formatCurrency } from "@/lib/i18n-format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { FinanceAccessDenied } from "@/components/school-dashboard/finance/access-denied"
import { ScholarshipForm } from "@/components/school-dashboard/finance/fees/scholarship-form"
import { resolveFinanceAccess } from "@/components/school-dashboard/finance/guard"

export const metadata = { title: "Scholarship Details" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
  searchParams: Promise<{ edit?: string }>
}

export default async function ScholarshipDetailPage({
  params,
  searchParams,
}: Props) {
  const { lang, id } = await params
  const { edit } = await searchParams
  const dictionary = await getDictionary(lang)
  const d = dictionary?.finance?.scholarshipForm
  const { schoolId, can } = await resolveFinanceAccess("fees", ["view"])

  if (!schoolId) notFound()

  if (!can.view) {
    return <FinanceAccessDenied dictionary={dictionary} module="fees" />
  }

  const [scholarship, schoolForCurrency] = await Promise.all([
    db.scholarship.findFirst({
      where: { id, schoolId },
      include: {
        _count: { select: { applications: true, feeAssignments: true } },
      },
    }),
    db.school.findUnique({
      where: { id: schoolId },
      select: { currency: true },
    }),
  ])

  if (!scholarship) notFound()

  const currency = schoolForCurrency?.currency ?? "USD"

  const isEdit = edit === "true"

  const formData = {
    id: scholarship.id,
    name: scholarship.name,
    description: scholarship.description,
    coverageType: scholarship.coverageType,
    coverageAmount: Number(scholarship.coverageAmount),
    academicYear: scholarship.academicYear,
    startDate: scholarship.startDate.toISOString(),
    endDate: scholarship.endDate.toISOString(),
    maxBeneficiaries: scholarship.maxBeneficiaries,
    minPercentage: scholarship.minPercentage
      ? Number(scholarship.minPercentage)
      : null,
    maxFamilyIncome: scholarship.maxFamilyIncome
      ? Number(scholarship.maxFamilyIncome)
      : null,
    isActive: scholarship.isActive,
  }

  if (isEdit) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              {d?.editScholarship ?? "Edit Scholarship"}
            </h1>
            <p className="text-muted-foreground">{scholarship.name}</p>
          </div>
          <Button variant="outline" asChild>
            <Link href={`/${lang}/finance/fees/scholarships/${id}`}>
              {d?.cancel ?? "Cancel"}
            </Link>
          </Button>
        </div>
        <ScholarshipForm lang={lang} initialData={formData} />
      </div>
    )
  }

  const COVERAGE_TYPE_COLORS: Record<string, string> = {
    FULL: "bg-green-500/10 text-green-500",
    PERCENTAGE: "bg-blue-500/10 text-blue-500",
    FIXED_AMOUNT: "bg-purple-500/10 text-purple-500",
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{scholarship.name}</h1>
          <p className="text-muted-foreground">
            {scholarship.description ||
              (d?.scholarshipDetails ?? "Scholarship Details")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/${lang}/finance/fees/scholarships/${id}?edit=true`}>
              {d?.edit ?? "Edit"}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/${lang}/finance/fees/scholarships`}>
              {d?.back ?? "Back"}
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">
              {d?.coverageType ?? "Coverage Type"}
            </p>
            <Badge
              variant="outline"
              className={`mt-1 ${COVERAGE_TYPE_COLORS[scholarship.coverageType] ?? ""}`}
            >
              {scholarship.coverageType === "FULL"
                ? (d?.coverageTypeFull ?? "Full")
                : scholarship.coverageType === "PERCENTAGE"
                  ? (d?.coverageTypePercentage ?? "Percentage")
                  : (d?.coverageTypeFixed ?? "Fixed Amount")}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">
              {d?.coverageAmount ?? "Coverage Amount"}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {scholarship.coverageType === "PERCENTAGE"
                ? `${Number(scholarship.coverageAmount)}%`
                : formatCurrency(
                    Number(scholarship.coverageAmount),
                    lang,
                    currency
                  )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">
              {d?.beneficiaries ?? "Beneficiaries"}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {scholarship.currentBeneficiaries}
              {scholarship.maxBeneficiaries !== null &&
                ` / ${scholarship.maxBeneficiaries}`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">
              {d?.applications ?? "Applications"}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {scholarship._count.applications}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detail Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              {d?.scholarshipDetails ?? "Scholarship Details"}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {d?.academicYear ?? "Academic Year"}
              </span>
              <span>{scholarship.academicYear}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {d?.startDate ?? "Start Date"}
              </span>
              <span className="tabular-nums">
                {scholarship.startDate.toLocaleDateString(
                  lang === "ar" ? "ar-SA" : "en-US"
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {d?.endDate ?? "End Date"}
              </span>
              <span className="tabular-nums">
                {scholarship.endDate.toLocaleDateString(
                  lang === "ar" ? "ar-SA" : "en-US"
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {d?.status ?? "Status"}
              </span>
              <Badge
                variant="outline"
                className={
                  scholarship.isActive
                    ? "bg-green-500/10 text-green-500"
                    : "bg-red-500/10 text-red-500"
                }
              >
                {scholarship.isActive
                  ? (d?.active ?? "Active")
                  : (d?.inactive ?? "Inactive")}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {d?.eligibilityCriteria ?? "Eligibility Criteria"}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {d?.minAcademicPercentage ?? "Min Academic Percentage"}
              </span>
              <span className="tabular-nums">
                {scholarship.minPercentage
                  ? `${Number(scholarship.minPercentage)}%`
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {d?.maxFamilyIncome ?? "Max Family Income"}
              </span>
              <span className="tabular-nums">
                {scholarship.maxFamilyIncome
                  ? formatCurrency(
                      Number(scholarship.maxFamilyIncome),
                      lang,
                      currency
                    )
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {d?.feeAssignmentsUsing ?? "Fee Assignments Using"}
              </span>
              <span className="tabular-nums">
                {scholarship._count.feeAssignments}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
