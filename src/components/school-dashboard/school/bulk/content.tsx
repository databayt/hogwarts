"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Suspense, useState } from "react"
import {
  BookOpen,
  Box,
  Building,
  Calendar,
  ClipboardList,
  Clock,
  FileText,
  GraduationCap,
  Layers,
  Shield,
  Target,
  UserCheck,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ModalProvider } from "@/components/atom/modal/context"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { ScoreRangeTable } from "../academic/grading/table"
import { YearLevelTable } from "../academic/level/table"
import { PeriodTable } from "../academic/period/table"
import { TermTable } from "../academic/term/table"
import { SchoolYearTable } from "../academic/year/table"
import { PeopleTab } from "./tabs/people-tab"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

interface BulkCardItem {
  id: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  placeholder?: boolean
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

function BulkCard({
  item,
  isActive,
  onClick,
}: {
  item: BulkCardItem
  isActive: boolean
  onClick: () => void
}) {
  const Icon = item.icon
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={`hover:bg-muted/50 w-60 shrink-0 cursor-pointer space-y-2 rounded-lg border p-4 transition-colors ${
        isActive ? "border-primary bg-muted/30" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon className="text-muted-foreground h-5 w-5" />
        {item.placeholder && (
          <Badge variant="secondary" className="text-[10px]">
            Soon
          </Badge>
        )}
      </div>
      <p className="text-sm font-medium">{item.title}</p>
      <p className="text-muted-foreground text-xs">{item.description}</p>
    </div>
  )
}

function ScrollRow({
  items,
  activeId,
  onSelect,
}: {
  items: BulkCardItem[]
  activeId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1">
      {items.map((item) => (
        <BulkCard
          key={item.id}
          item={item}
          isActive={activeId === item.id}
          onClick={() => !item.placeholder && onSelect(item.id)}
        />
      ))}
    </div>
  )
}

export default function BulkContent({ dictionary, lang }: Props) {
  const isArabic = lang === "ar"
  const [activeAcademic, setActiveAcademic] = useState("years")
  const [activePeople, setActivePeople] = useState("students")

  const academicCards: BulkCardItem[] = [
    {
      id: "years",
      icon: Calendar,
      title: isArabic ? "السنوات الدراسية" : "Academic Years",
      description: isArabic
        ? "إنشاء وإدارة السنوات الدراسية"
        : "Create and manage school years",
    },
    {
      id: "terms",
      icon: Layers,
      title: isArabic ? "الفصول الدراسية" : "Terms",
      description: isArabic
        ? "تحديد فصول السنة الدراسية"
        : "Define terms within the academic year",
    },
    {
      id: "periods",
      icon: Clock,
      title: isArabic ? "الحصص" : "Periods",
      description: isArabic
        ? "إعداد جدول الحصص اليومية"
        : "Configure daily class periods",
    },
    {
      id: "levels",
      icon: GraduationCap,
      title: isArabic ? "المراحل الدراسية" : "Year Levels",
      description: isArabic
        ? "تعريف المراحل والصفوف الدراسية"
        : "Define grades and year levels",
    },
    {
      id: "grading",
      icon: Target,
      title: isArabic ? "نظام الدرجات" : "Grading Scale",
      description: isArabic
        ? "إعداد نظام التقييم والدرجات"
        : "Configure grading and score ranges",
    },
  ]

  const structureCards: BulkCardItem[] = [
    {
      id: "departments",
      icon: Building,
      title: isArabic ? "الأقسام" : "Departments",
      description: isArabic
        ? "إدارة أقسام المدرسة"
        : "Manage school departments",
      placeholder: true,
    },
    {
      id: "classrooms",
      icon: Box,
      title: isArabic ? "الفصول" : "Classrooms",
      description: isArabic
        ? "إدارة الفصول الدراسية"
        : "Manage classroom assignments",
      placeholder: true,
    },
  ]

  const peopleCards: BulkCardItem[] = [
    {
      id: "students",
      icon: GraduationCap,
      title: isArabic ? "الطلاب" : "Students",
      description: isArabic
        ? "استيراد بيانات الطلاب"
        : "Import student records",
    },
    {
      id: "teachers",
      icon: UserCheck,
      title: isArabic ? "المعلمين" : "Teachers",
      description: isArabic
        ? "استيراد بيانات المعلمين"
        : "Import teacher records",
    },
    {
      id: "staff",
      icon: Users,
      title: isArabic ? "الموظفين" : "Staff",
      description: isArabic
        ? "استيراد بيانات الموظفين"
        : "Import staff records",
    },
    {
      id: "guardians",
      icon: Shield,
      title: isArabic ? "أولياء الأمور" : "Guardians",
      description: isArabic
        ? "استيراد بيانات أولياء الأمور"
        : "Import guardian records",
    },
  ]

  const placeholderSections = [
    {
      title: isArabic ? "الحضور" : "Attendance",
      cards: [
        {
          id: "attendance",
          icon: ClipboardList,
          title: isArabic ? "استيراد الحضور" : "Attendance Import",
          description: isArabic
            ? "استيراد سجلات الحضور"
            : "Import attendance records",
          placeholder: true,
        },
      ] satisfies BulkCardItem[],
    },
    {
      title: isArabic ? "الجدول" : "Timetable",
      cards: [
        {
          id: "timetable",
          icon: Clock,
          title: isArabic ? "استيراد الجدول" : "Timetable Import",
          description: isArabic
            ? "استيراد جدول الحصص"
            : "Import timetable schedule",
          placeholder: true,
        },
      ] satisfies BulkCardItem[],
    },
    {
      title: isArabic ? "الامتحانات" : "Exams",
      cards: [
        {
          id: "exams",
          icon: FileText,
          title: isArabic ? "استيراد الدرجات" : "Exam Scores Import",
          description: isArabic
            ? "استيراد درجات الامتحانات"
            : "Import exam score records",
          placeholder: true,
        },
      ] satisfies BulkCardItem[],
    },
    {
      title: isArabic ? "المواد" : "Materials",
      cards: [
        {
          id: "materials",
          icon: BookOpen,
          title: isArabic ? "استيراد المواد" : "Materials Import",
          description: isArabic
            ? "استيراد المواد التعليمية"
            : "Import educational materials",
          placeholder: true,
        },
      ] satisfies BulkCardItem[],
    },
  ]

  return (
    <div className="space-y-10">
      {/* Academic */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          {isArabic ? "أكاديمي" : "Academic"}
        </h2>
        <ScrollRow
          items={academicCards}
          activeId={activeAcademic}
          onSelect={setActiveAcademic}
        />
        <div className="pt-2">
          <ModalProvider>
            <Suspense fallback={<TableSkeleton />}>
              {activeAcademic === "years" && (
                <SchoolYearTable initialData={[]} total={0} lang={lang} />
              )}
              {activeAcademic === "terms" && (
                <TermTable initialData={[]} total={0} lang={lang} />
              )}
              {activeAcademic === "periods" && (
                <PeriodTable initialData={[]} total={0} lang={lang} />
              )}
              {activeAcademic === "levels" && (
                <YearLevelTable initialData={[]} total={0} lang={lang} />
              )}
              {activeAcademic === "grading" && (
                <ScoreRangeTable initialData={[]} total={0} lang={lang} />
              )}
            </Suspense>
          </ModalProvider>
        </div>
      </section>

      {/* Structure */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          {isArabic ? "الهيكل" : "Structure"}
        </h2>
        <ScrollRow items={structureCards} activeId={null} onSelect={() => {}} />
      </section>

      {/* People */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          {isArabic ? "الأشخاص" : "People"}
        </h2>
        <ScrollRow
          items={peopleCards}
          activeId={activePeople}
          onSelect={setActivePeople}
        />
        <div className="pt-2">
          <PeopleTab
            dictionary={dictionary}
            lang={lang}
            activeCard={activePeople}
          />
        </div>
      </section>

      {/* Placeholder sections */}
      {placeholderSections.map((section) => (
        <section key={section.title} className="space-y-3">
          <h2 className="text-lg font-semibold">{section.title}</h2>
          <ScrollRow
            items={section.cards}
            activeId={null}
            onSelect={() => {}}
          />
        </section>
      ))}
    </div>
  )
}
