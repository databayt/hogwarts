'use client'

import { Suspense } from 'react'
import type { Locale } from '@/components/internationalization/config'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, GraduationCap, Target, Layers } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { ModalProvider } from '@/components/atom/modal/context'

// Import table components
import { SchoolYearTable } from '../../academic/year/table'
import { TermTable } from '../../academic/term/table'
import { PeriodTable } from '../../academic/period/table'
import { YearLevelTable } from '../../academic/level/table'
import { ScoreRangeTable } from '../../academic/grading/table'

// Import types
import type { SchoolYearRow } from '../../academic/year/types'
import type { TermRow } from '../../academic/term/types'
import type { PeriodRow } from '../../academic/period/types'
import type { YearLevelRow } from '../../academic/level/types'
import type { ScoreRangeRow } from '../../academic/grading/types'

interface Props {
  dictionary: Dictionary
  lang: Locale
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

export function AcademicTab({
  dictionary,
  lang,
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
}: Props) {
  const isArabic = lang === 'ar'

  const t = {
    academicSetup: isArabic ? 'الإعداد الأكاديمي' : 'Academic Setup',
    academicSetupDescription: isArabic
      ? 'إدارة السنوات الدراسية والفصول والحصص والمراحل ونظام الدرجات'
      : 'Manage academic years, terms, periods, year levels, and grading scale',
    years: isArabic ? 'السنوات الدراسية' : 'Academic Years',
    yearsDescription: isArabic ? 'إنشاء وإدارة السنوات الدراسية' : 'Create and manage school years',
    terms: isArabic ? 'الفصول الدراسية' : 'Terms',
    termsDescription: isArabic ? 'تحديد فصول السنة الدراسية' : 'Define terms within the academic year',
    periods: isArabic ? 'الحصص' : 'Periods',
    periodsDescription: isArabic ? 'إعداد جدول الحصص اليومية' : 'Configure daily class periods',
    levels: isArabic ? 'المراحل الدراسية' : 'Year Levels',
    levelsDescription: isArabic ? 'تعريف المراحل والصفوف الدراسية' : 'Define grades and year levels',
    grading: isArabic ? 'نظام الدرجات' : 'Grading Scale',
    gradingDescription: isArabic ? 'إعداد نظام التقييم والدرجات' : 'Configure grading and score ranges',
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
                <p className="text-sm text-muted-foreground">{t.yearsDescription}</p>
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
                <p className="text-sm text-muted-foreground">{t.termsDescription}</p>
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
                <p className="text-sm text-muted-foreground">{t.periodsDescription}</p>
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
                <p className="text-sm text-muted-foreground">{t.levelsDescription}</p>
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
                <p className="text-sm text-muted-foreground">{t.gradingDescription}</p>
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
