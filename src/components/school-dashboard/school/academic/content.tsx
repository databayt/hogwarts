"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Suspense } from "react"
import { Calendar, Clock, GraduationCap, Layers, Target } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ModalProvider } from "@/components/atom/modal/context"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { ScoreRangeTable } from "./grading/table"
import type { ScoreRangeRow } from "./grading/types"
import { YearLevelTable } from "./level/table"
import type { YearLevelRow } from "./level/types"
import { PeriodTable } from "./period/table"
import type { PeriodRow } from "./period/types"
import { TermTable } from "./term/table"
import type { TermRow } from "./term/types"
// Import table components
import { SchoolYearTable } from "./year/table"
// Import types
import type { SchoolYearRow } from "./year/types"

interface AcademicContentProps {
  lang: Locale
  dictionary: Dictionary
  initialYears?: SchoolYearRow[]
  totalYears?: number
  initialTerms?: TermRow[]
  totalTerms?: number
  initialPeriods?: PeriodRow[]
  totalPeriods?: number
  initialLevels?: YearLevelRow[]
  totalLevels?: number
  initialGrades?: ScoreRangeRow[]
  totalGrades?: number
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  )
}

export function AcademicContent({
  lang,
  dictionary,
  initialYears = [],
  totalYears = 0,
  initialTerms = [],
  totalTerms = 0,
  initialPeriods = [],
  totalPeriods = 0,
  initialLevels = [],
  totalLevels = 0,
  initialGrades = [],
  totalGrades = 0,
}: AcademicContentProps) {
  const c = dictionary?.school?.configuration?.academic

  const t = {
    academicSetup: c?.title ?? "Academic Setup",
    academicSetupDescription:
      c?.description ??
      "Manage academic years, terms, periods, year levels, and grading scale",
    years: c?.years ?? "Academic Years",
    yearsDescription: c?.yearsDescription ?? "Create and manage school years",
    terms: c?.terms ?? "Terms",
    termsDescription:
      c?.termsDescription ?? "Define terms within the academic year",
    periods: c?.periods ?? "Periods",
    periodsDescription:
      c?.periodsDescription ?? "Configure daily class periods",
    levels: c?.levels ?? "Year Levels",
    levelsDescription:
      c?.levelsDescription ?? "Define grades and year levels",
    grading: c?.grading ?? "Grading Scale",
    gradingDescription:
      c?.gradingDescription ?? "Configure grading and score ranges",
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {t.academicSetup}
        </CardTitle>
        <CardDescription>{t.academicSetupDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="years" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="years" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">{t.years}</span>
            </TabsTrigger>
            <TabsTrigger value="terms" className="flex items-center gap-1">
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">{t.terms}</span>
            </TabsTrigger>
            <TabsTrigger value="periods" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">{t.periods}</span>
            </TabsTrigger>
            <TabsTrigger value="levels" className="flex items-center gap-1">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">{t.levels}</span>
            </TabsTrigger>
            <TabsTrigger value="grading" className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">{t.grading}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="years" className="mt-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{t.years}</h3>
                <p className="text-muted-foreground text-sm">
                  {t.yearsDescription}
                </p>
              </div>
              <ModalProvider>
                <Suspense fallback={<TableSkeleton />}>
                  <SchoolYearTable
                    initialData={initialYears}
                    total={totalYears}
                    lang={lang}
                  />
                </Suspense>
              </ModalProvider>
            </div>
          </TabsContent>

          <TabsContent value="terms" className="mt-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{t.terms}</h3>
                <p className="text-muted-foreground text-sm">
                  {t.termsDescription}
                </p>
              </div>
              <ModalProvider>
                <Suspense fallback={<TableSkeleton />}>
                  <TermTable
                    initialData={initialTerms}
                    total={totalTerms}
                    lang={lang}
                  />
                </Suspense>
              </ModalProvider>
            </div>
          </TabsContent>

          <TabsContent value="periods" className="mt-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{t.periods}</h3>
                <p className="text-muted-foreground text-sm">
                  {t.periodsDescription}
                </p>
              </div>
              <ModalProvider>
                <Suspense fallback={<TableSkeleton />}>
                  <PeriodTable
                    initialData={initialPeriods}
                    total={totalPeriods}
                    lang={lang}
                  />
                </Suspense>
              </ModalProvider>
            </div>
          </TabsContent>

          <TabsContent value="levels" className="mt-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{t.levels}</h3>
                <p className="text-muted-foreground text-sm">
                  {t.levelsDescription}
                </p>
              </div>
              <ModalProvider>
                <Suspense fallback={<TableSkeleton />}>
                  <YearLevelTable
                    initialData={initialLevels}
                    total={totalLevels}
                    lang={lang}
                  />
                </Suspense>
              </ModalProvider>
            </div>
          </TabsContent>

          <TabsContent value="grading" className="mt-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{t.grading}</h3>
                <p className="text-muted-foreground text-sm">
                  {t.gradingDescription}
                </p>
              </div>
              <ModalProvider>
                <Suspense fallback={<TableSkeleton />}>
                  <ScoreRangeTable
                    initialData={initialGrades}
                    total={totalGrades}
                    lang={lang}
                  />
                </Suspense>
              </ModalProvider>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
