"use client"

import Link from "next/link"
import {
  AlertTriangle,
  BookOpen,
  Building,
  ExternalLink,
  GraduationCap,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { Locale } from "@/components/internationalization/config"

interface Props {
  schoolId: string
  initialData: {
    studentCount: number
    teacherCount: number
    classroomCount: number
    departmentCount: number
  }
  limits: {
    maxStudents: number
    maxTeachers: number
  }
  lang: Locale
}

export function CapacitySection({
  schoolId,
  initialData,
  limits,
  lang,
}: Props) {
  // Calculate usage percentages
  const studentUsage =
    limits.maxStudents > 0
      ? Math.round((initialData.studentCount / limits.maxStudents) * 100)
      : 0
  const teacherUsage =
    limits.maxTeachers > 0
      ? Math.round((initialData.teacherCount / limits.maxTeachers) * 100)
      : 0

  const getUsageColor = (usage: number) => {
    if (usage > 90) return "text-destructive"
    if (usage > 75) return "text-yellow-500"
    return "text-green-500"
  }

  const getProgressColor = (usage: number) => {
    if (usage > 90) return "[&>div]:bg-destructive"
    if (usage > 75) return "[&>div]:bg-yellow-500"
    return ""
  }

  const stats = [
    {
      label: "Students",
      value: initialData.studentCount,
      limit: limits.maxStudents,
      usage: studentUsage,
      icon: GraduationCap,
      href: `/${lang}/students`,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Teachers",
      value: initialData.teacherCount,
      limit: limits.maxTeachers,
      usage: teacherUsage,
      icon: Users,
      href: `/${lang}/teachers`,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Classrooms",
      value: initialData.classroomCount,
      limit: null, // No limit for classrooms
      usage: null,
      icon: Building,
      href: `/${lang}/school/bulk`,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      label: "Departments",
      value: initialData.departmentCount,
      limit: null, // No limit for departments
      usage: null,
      icon: BookOpen,
      href: `/${lang}/school/bulk`,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ]

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group hover:bg-muted/50 flex flex-col rounded-lg border p-4 transition-colors"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`rounded-md p-2 ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <span className="font-medium">{stat.label}</span>
              </div>
              <ExternalLink className="text-muted-foreground h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold">
                  {stat.value.toLocaleString()}
                </p>
                {stat.limit !== null && (
                  <p className="text-muted-foreground text-xs">
                    of {stat.limit.toLocaleString()} max
                  </p>
                )}
              </div>

              {stat.usage !== null && (
                <div className="flex items-center gap-1">
                  <TrendingUp
                    className={`h-4 w-4 ${getUsageColor(stat.usage)}`}
                  />
                  <span
                    className={`text-sm font-medium ${getUsageColor(stat.usage)}`}
                  >
                    {stat.usage}%
                  </span>
                </div>
              )}
            </div>

            {/* Progress bar for items with limits */}
            {stat.usage !== null && (
              <div className="mt-3 space-y-1">
                <Progress
                  value={Math.min(stat.usage, 100)}
                  className={`h-1.5 ${getProgressColor(stat.usage)}`}
                />
                {stat.usage > 90 && (
                  <div className="text-destructive flex items-center gap-1 text-xs">
                    <AlertTriangle className="h-3 w-3" />
                    Approaching limit - consider upgrading
                  </div>
                )}
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Usage Summary */}
      {(studentUsage > 75 || teacherUsage > 75) && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-500" />
            <div>
              <h4 className="font-medium text-yellow-700 dark:text-yellow-400">
                Capacity Alert
              </h4>
              <p className="text-muted-foreground text-sm">
                {studentUsage > 75 && `Students at ${studentUsage}% capacity. `}
                {teacherUsage > 75 && `Teachers at ${teacherUsage}% capacity. `}
                Consider increasing your plan limits or managing your capacity.
              </p>
              <Button variant="outline" size="sm" className="mt-2" asChild>
                <Link href={`/${lang}/school/subscription`}>Upgrade Plan</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 pt-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/${lang}/school/bulk`}>
            <Plus className="mr-1 h-4 w-4" />
            Bulk Import
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/${lang}/students/new`}>
            <GraduationCap className="mr-1 h-4 w-4" />
            Add Student
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/${lang}/teachers/new`}>
            <Users className="mr-1 h-4 w-4" />
            Add Teacher
          </Link>
        </Button>
      </div>
    </div>
  )
}
