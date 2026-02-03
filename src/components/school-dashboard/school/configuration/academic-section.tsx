"use client"

import Link from "next/link"
import {
  BookOpen,
  Calendar,
  Clock,
  GraduationCap,
  Plus,
  Settings,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { Locale } from "@/components/internationalization/config"

interface Props {
  schoolId: string
  currentAcademicYear: {
    id: string
    yearName: string
    startDate: Date
    endDate: Date
    terms: Array<{
      id: string
      termNumber: number
      startDate: Date
      endDate: Date
    }>
  } | null
  stats: {
    academicYears: number
    terms: number
    yearLevels: number
    scoreRanges: number
  }
  lang: Locale
}

export function AcademicSection({
  schoolId,
  currentAcademicYear,
  stats,
  lang,
}: Props) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="space-y-4">
      {/* Current Academic Year */}
      {currentAcademicYear ? (
        <div className="bg-muted/30 rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-500" />
              <div>
                <h4 className="font-medium">{currentAcademicYear.yearName}</h4>
                <p className="text-muted-foreground text-xs">
                  {formatDate(currentAcademicYear.startDate)} -{" "}
                  {formatDate(currentAcademicYear.endDate)}
                </p>
              </div>
            </div>
            <Badge variant="default">Current Year</Badge>
          </div>

          {/* Terms */}
          {currentAcademicYear.terms.length > 0 && (
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium">Terms</p>
              <div className="flex flex-wrap gap-2">
                {currentAcademicYear.terms.map((term) => (
                  <Badge key={term.id} variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    Term {term.termNumber}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-muted/20 rounded-lg border border-dashed p-4 text-center">
          <Calendar className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
          <p className="text-sm font-medium">No Academic Year Set</p>
          <p className="text-muted-foreground mb-3 text-xs">
            Create an academic year to start organizing your school calendar
          </p>
          <Button size="sm" asChild>
            <Link href={`/${lang}/school/bulk`}>
              <Plus className="mr-1 h-4 w-4" />
              Create Academic Year
            </Link>
          </Button>
        </div>
      )}

      <Separator />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Link
          href={`/${lang}/school/bulk`}
          className="hover:bg-muted/50 group flex items-center gap-2 rounded-lg border p-3 transition-colors"
        >
          <Calendar className="h-4 w-4 text-green-500" />
          <div className="flex-1">
            <p className="text-lg font-bold">{stats.academicYears}</p>
            <p className="text-muted-foreground text-xs">Academic Years</p>
          </div>
        </Link>

        <Link
          href={`/${lang}/school/bulk`}
          className="hover:bg-muted/50 group flex items-center gap-2 rounded-lg border p-3 transition-colors"
        >
          <Clock className="h-4 w-4 text-blue-500" />
          <div className="flex-1">
            <p className="text-lg font-bold">{stats.terms}</p>
            <p className="text-muted-foreground text-xs">Terms</p>
          </div>
        </Link>

        <Link
          href={`/${lang}/school/bulk`}
          className="hover:bg-muted/50 group flex items-center gap-2 rounded-lg border p-3 transition-colors"
        >
          <BookOpen className="h-4 w-4 text-orange-500" />
          <div className="flex-1">
            <p className="text-lg font-bold">{stats.yearLevels}</p>
            <p className="text-muted-foreground text-xs">Year Levels</p>
          </div>
        </Link>

        <Link
          href={`/${lang}/school/bulk`}
          className="hover:bg-muted/50 group flex items-center gap-2 rounded-lg border p-3 transition-colors"
        >
          <GraduationCap className="h-4 w-4 text-purple-500" />
          <div className="flex-1">
            <p className="text-lg font-bold">{stats.scoreRanges}</p>
            <p className="text-muted-foreground text-xs">Grade Scales</p>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/${lang}/school/bulk`}>
            <Settings className="mr-1 h-4 w-4" />
            Manage Academic Structure
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/${lang}/school/bulk`}>
            <GraduationCap className="mr-1 h-4 w-4" />
            Configure Grading
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/${lang}/timetable/settings`}>
            <Clock className="mr-1 h-4 w-4" />
            Timetable Settings
          </Link>
        </Button>
      </div>
    </div>
  )
}
