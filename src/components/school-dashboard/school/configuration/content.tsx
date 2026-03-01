// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  AlertCircle,
  Building,
  Calendar,
  CheckCircle2,
  School,
  Users,
} from "lucide-react"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { ConfigSectionCard } from "./config-section-card"
import { CONFIG_SECTIONS } from "./config-sections"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function ConfigurationContent({
  dictionary,
  lang,
}: Props) {
  const { schoolId } = await getTenantContext()
  const d = dictionary?.school?.schoolAdmin?.configSections as
    | Record<string, unknown>
    | undefined

  let schoolInfo: {
    name: string
    logoUrl: string | null
    address: string | null
    city: string | null
    planType: string
    isActive: boolean
    tuitionFee: unknown
  } | null = null

  let brandingInfo: { primaryColor: string | null } | null = null
  let academicYearsCount = 0
  let termsCount = 0
  let yearLevelsCount = 0
  let departmentsCount = 0
  let classroomsCount = 0
  let scoreRangesCount = 0

  if (schoolId) {
    try {
      ;[
        schoolInfo,
        brandingInfo,
        academicYearsCount,
        termsCount,
        yearLevelsCount,
        departmentsCount,
        classroomsCount,
        scoreRangesCount,
      ] = await Promise.all([
        db.school
          .findUnique({
            where: { id: schoolId },
            select: {
              name: true,
              logoUrl: true,
              address: true,
              city: true,
              planType: true,
              isActive: true,
              tuitionFee: true,
            },
          })
          .catch(() => null),
        db.schoolBranding
          .findUnique({
            where: { schoolId },
            select: { primaryColor: true },
          })
          .catch(() => null),
        db.schoolYear.count({ where: { schoolId } }).catch(() => 0),
        db.term.count({ where: { schoolId } }).catch(() => 0),
        db.yearLevel.count({ where: { schoolId } }).catch(() => 0),
        db.department.count({ where: { schoolId } }).catch(() => 0),
        db.classroom.count({ where: { schoolId } }).catch(() => 0),
        db.scoreRange.count({ where: { schoolId } }).catch(() => 0),
      ])
    } catch (error) {
      console.error("Error fetching configuration data:", error)
    }
  }

  // Section status map
  const sectionStatus: Record<string, "configured" | "incomplete" | "notSet"> =
    {
      identity: schoolInfo?.name ? "configured" : "notSet",
      location: schoolInfo?.city ? "configured" : "notSet",
      branding:
        brandingInfo?.primaryColor || schoolInfo?.logoUrl
          ? "configured"
          : "notSet",
      plan: schoolInfo?.isActive ? "configured" : "notSet",
      capacity: classroomsCount > 0 ? "configured" : "notSet",
      pricing: schoolInfo?.tuitionFee != null ? "configured" : "notSet",
      academic: academicYearsCount > 0 ? "configured" : "notSet",
    }

  // Setup progress
  const setupSteps = [
    { name: "School Profile", completed: !!schoolInfo?.name },
    { name: "Location", completed: !!schoolInfo?.address },
    { name: "Plan Setup", completed: !!schoolInfo?.planType },
    { name: "Academic Year", completed: academicYearsCount > 0 },
    { name: "Year Levels", completed: yearLevelsCount > 0 },
    { name: "Departments", completed: departmentsCount > 0 },
    { name: "Grading System", completed: scoreRangesCount > 0 },
  ]
  const completedSteps = setupSteps.filter((s) => s.completed).length
  const setupProgress = Math.round((completedSteps / setupSteps.length) * 100)

  const t = (key: string, fallback: string) => {
    return (d?.[key] as string) ?? fallback
  }

  const sectionT = (sectionKey: string, field: string, fallback: string) => {
    const section = d?.[sectionKey] as Record<string, string> | undefined
    return section?.[field] ?? fallback
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("schoolProfile", "School Profile")}
            </CardTitle>
            <School className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schoolInfo?.name
                ? t("configured", "Configured")
                : t("notSet", "Not Set")}
            </div>
            <p className="text-muted-foreground text-xs">
              {schoolInfo?.name ||
                sectionT(
                  "identity",
                  "description",
                  "Name, contact, type, and system details"
                )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("academicYears", "Academic Years")}
            </CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{academicYearsCount}</div>
            <p className="text-muted-foreground text-xs">
              {termsCount} {t("termsConfigured", "terms configured")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("departments", "Departments")}
            </CardTitle>
            <Building className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departmentsCount}</div>
            <p className="text-muted-foreground text-xs">
              {t("academicDepartments", "Academic departments")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("classrooms", "Classrooms")}
            </CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classroomsCount}</div>
            <p className="text-muted-foreground text-xs">
              {yearLevelsCount} {t("yearLevels", "year levels")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Setup Progress */}
      {setupProgress < 100 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <AlertCircle className="text-primary h-4 w-4" />
                {t("completeSetup", "Complete Your School Setup")}
              </CardTitle>
              <Badge variant="secondary">
                {completedSteps}/{setupSteps.length} {t("steps", "Steps")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={setupProgress} className="h-2" />
            <div className="flex flex-wrap gap-2">
              {setupSteps.map((step, index) => (
                <Badge
                  key={index}
                  variant={step.completed ? "default" : "outline"}
                  className="gap-1"
                >
                  {step.completed ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  {step.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Sections Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CONFIG_SECTIONS.map((section) => (
          <ConfigSectionCard
            key={section.key}
            section={section}
            title={sectionT(section.key, "title", section.key)}
            description={sectionT(section.key, "description", "")}
            status={sectionStatus[section.key] || "notSet"}
            statusLabel={t(
              sectionStatus[section.key] || "notSet",
              sectionStatus[section.key] || "Not Set"
            )}
            lang={lang}
          />
        ))}
      </div>
    </div>
  )
}
