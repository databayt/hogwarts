"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Users, GraduationCap, Building, BookOpen, Plus, ExternalLink } from "lucide-react"
import type { Locale } from "@/components/internationalization/config"

interface Props {
  schoolId: string
  initialData: {
    studentCount: number
    teacherCount: number
    classroomCount: number
    departmentCount: number
  }
  lang: Locale
}

export function CapacitySection({ schoolId, initialData, lang }: Props) {
  const stats = [
    {
      label: "Students",
      value: initialData.studentCount,
      icon: GraduationCap,
      href: `/${lang}/students`,
      color: "text-blue-500",
    },
    {
      label: "Teachers",
      value: initialData.teacherCount,
      icon: Users,
      href: `/${lang}/teachers`,
      color: "text-green-500",
    },
    {
      label: "Classrooms",
      value: initialData.classroomCount,
      icon: Building,
      href: `/${lang}/admin/configuration/classrooms`,
      color: "text-orange-500",
    },
    {
      label: "Departments",
      value: initialData.departmentCount,
      icon: BookOpen,
      href: `/${lang}/admin/configuration/departments`,
      color: "text-purple-500",
    },
  ]

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
          >
            <div className={`p-2 rounded-md bg-muted ${stat.color}`}>
              <stat.icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 pt-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/${lang}/admin/configuration/departments/new`}>
            <Plus className="h-4 w-4 mr-1" />
            Add Department
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/${lang}/admin/configuration/classrooms/new`}>
            <Plus className="h-4 w-4 mr-1" />
            Add Classroom
          </Link>
        </Button>
      </div>
    </div>
  )
}
