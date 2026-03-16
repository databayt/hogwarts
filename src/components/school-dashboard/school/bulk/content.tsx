"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Suspense, useRef, useState } from "react"
import {
  AlertCircle,
  BookOpen,
  Box,
  Building,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock,
  Download,
  FileText,
  GraduationCap,
  Layers,
  Loader2,
  Shield,
  Target,
  UserCheck,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ModalProvider } from "@/components/atom/modal/context"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { ScoreRangeTable } from "../academic/grading/table"
import { YearLevelTable } from "../academic/level/table"
import { PeriodTable } from "../academic/period/table"
import { TermTable } from "../academic/term/table"
import { SchoolYearTable } from "../academic/year/table"
import {
  bulkImportGuardians,
  bulkImportStaff,
  bulkImportStudents,
  bulkImportTeachers,
} from "./actions"

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

interface ImportResult {
  imported: number
  failed: number
  errors: Array<{ row: number; error: string; details?: string }>
  warnings?: Array<{ row: number; warning: string }>
}

interface PeopleCardConfig {
  id: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  templateContent: string
  templateFilename: string
  importAction: (
    formData: FormData
  ) => Promise<{ success: boolean; data?: ImportResult; error?: string }>
}

interface CardImportState {
  uploading: boolean
  result: ImportResult | null
  error: string | null
  showErrors: boolean
}

const STUDENT_TEMPLATE =
  "name,email,studentId,yearLevel,guardianName,guardianEmail,guardianPhone,dateOfBirth,gender\nJohn Doe,john@example.com,STD001,Grade 10,Jane Doe,jane@example.com,+1234567890,2008-05-15,male\nSarah Smith,,STD002,Grade 9,Mike Smith,mike@example.com,+0987654321,2009-03-22,female"

const TEACHER_TEMPLATE =
  'name,email,employeeId,department,phoneNumber,subjects,qualification\nDr. Alice Johnson,alice@school.edu,TCH001,Mathematics,+1234567890,"Algebra,Calculus",PhD in Mathematics\nMr. Bob Wilson,bob@school.edu,TCH002,Science,+0987654321,Physics,MSc in Physics'

const STAFF_TEMPLATE =
  "givenName,surname,emailAddress,employeeId,position,department,phoneNumber,gender,employmentType\nAhmed,Hassan,ahmed@school.edu,STF001,Accountant,Finance,+1234567890,male,FULL_TIME\nFatima,Ali,fatima@school.edu,STF002,Librarian,Library,+0987654321,female,PART_TIME"

const GUARDIAN_TEMPLATE =
  "givenName,surname,emailAddress,phoneNumber,guardianType,studentId\nMohammed,Ahmed,mohammed@example.com,+1234567890,father,STD001\nSara,Hassan,sara@example.com,+0987654321,mother,STD002"

function downloadTemplate(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function ImportResultDisplay({
  cardId,
  state,
  isArabic,
  onToggleErrors,
  onReset,
}: {
  cardId: string
  state: CardImportState
  isArabic: boolean
  onToggleErrors: (id: string) => void
  onReset: (id: string) => void
}) {
  if (state.uploading) {
    return (
      <div className="flex items-center gap-2 rounded-md border p-3">
        <Loader2 className="h-4 w-4 animate-spin" />
        <p className="text-sm">
          {isArabic ? "جاري الاستيراد..." : "Importing..."}
        </p>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <p className="text-sm text-red-600">{state.error}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => onReset(cardId)}>
          {isArabic ? "حاول مرة أخرى" : "Try Again"}
        </Button>
      </div>
    )
  }

  if (!state.result) return null

  const { result } = state
  return (
    <div className="space-y-3">
      <div
        className={`flex items-center gap-2 rounded-md p-3 ${
          result.imported > 0
            ? "border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
            : "border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950"
        }`}
      >
        <CheckCircle2
          className={`h-4 w-4 shrink-0 ${
            result.imported > 0 ? "text-green-600" : "text-yellow-600"
          }`}
        />
        <p className="text-sm">
          {isArabic
            ? `تم استيراد ${result.imported} بنجاح، فشل ${result.failed}`
            : `${result.imported} imported successfully, ${result.failed} failed`}
        </p>
      </div>

      {result.warnings && result.warnings.length > 0 && (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900 dark:bg-yellow-950">
          <p className="mb-1 text-sm font-medium text-yellow-800 dark:text-yellow-200">
            {isArabic ? "تحذيرات" : "Warnings"}
          </p>
          {result.warnings.map((w, idx) => (
            <p
              key={idx}
              className="text-xs text-yellow-700 dark:text-yellow-300"
            >
              {isArabic ? `صف ${w.row}` : `Row ${w.row}`}: {w.warning}
            </p>
          ))}
        </div>
      )}

      {result.errors.length > 0 && (
        <div className="rounded-md border p-3">
          <button
            type="button"
            onClick={() => onToggleErrors(cardId)}
            className="flex w-full items-center justify-between text-sm font-medium"
          >
            <span>
              {isArabic
                ? `${result.errors.length} أخطاء`
                : `${result.errors.length} error${result.errors.length > 1 ? "s" : ""}`}
            </span>
            {state.showErrors ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {state.showErrors && (
            <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
              {result.errors.map((err, idx) => (
                <div
                  key={idx}
                  className="rounded bg-red-50 p-2 text-xs dark:bg-red-950"
                >
                  <span className="font-medium">
                    {isArabic ? `صف ${err.row}` : `Row ${err.row}`}:
                  </span>{" "}
                  {err.error}
                  {err.details && (
                    <p className="text-muted-foreground mt-1 whitespace-pre-wrap">
                      {err.details}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Button variant="outline" size="sm" onClick={() => onReset(cardId)}>
        {isArabic ? "استيراد ملف آخر" : "Import Another File"}
      </Button>
    </div>
  )
}

export default function BulkContent({ dictionary, lang }: Props) {
  const isArabic = lang === "ar"
  const [activeAcademic, setActiveAcademic] = useState("years")

  // People import state
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [importStates, setImportStates] = useState<
    Record<string, CardImportState>
  >({})
  const [activeImportCard, setActiveImportCard] = useState<string | null>(null)

  const peopleCardConfigs: PeopleCardConfig[] = [
    {
      id: "students",
      icon: GraduationCap,
      title: isArabic ? "الطلاب" : "Students",
      description: isArabic
        ? "استيراد بيانات الطلاب"
        : "Import student records",
      templateContent: STUDENT_TEMPLATE,
      templateFilename: "students-template.csv",
      importAction: bulkImportStudents,
    },
    {
      id: "teachers",
      icon: UserCheck,
      title: isArabic ? "المعلمين" : "Teachers",
      description: isArabic
        ? "استيراد بيانات المعلمين"
        : "Import teacher records",
      templateContent: TEACHER_TEMPLATE,
      templateFilename: "teachers-template.csv",
      importAction: bulkImportTeachers,
    },
    {
      id: "staff",
      icon: Users,
      title: isArabic ? "الموظفين" : "Staff",
      description: isArabic
        ? "استيراد بيانات الموظفين"
        : "Import staff records",
      templateContent: STAFF_TEMPLATE,
      templateFilename: "staff-template.csv",
      importAction: bulkImportStaff,
    },
    {
      id: "guardians",
      icon: Shield,
      title: isArabic ? "أولياء الأمور" : "Guardians",
      description: isArabic
        ? "استيراد بيانات أولياء الأمور"
        : "Import guardian records",
      templateContent: GUARDIAN_TEMPLATE,
      templateFilename: "guardians-template.csv",
      importAction: bulkImportGuardians,
    },
  ]

  async function handleFileSelect(card: PeopleCardConfig, file: File) {
    setActiveImportCard(card.id)
    setImportStates((prev) => ({
      ...prev,
      [card.id]: {
        uploading: true,
        result: null,
        error: null,
        showErrors: false,
      },
    }))

    try {
      const formData = new FormData()
      formData.append("file", file)
      const response = await card.importAction(formData)

      if (response.success && response.data) {
        setImportStates((prev) => ({
          ...prev,
          [card.id]: {
            uploading: false,
            result: response.data!,
            error: null,
            showErrors: false,
          },
        }))
      } else {
        setImportStates((prev) => ({
          ...prev,
          [card.id]: {
            uploading: false,
            result: null,
            error: response.error || "Import failed",
            showErrors: false,
          },
        }))
      }
    } catch (err) {
      setImportStates((prev) => ({
        ...prev,
        [card.id]: {
          uploading: false,
          result: null,
          error: err instanceof Error ? err.message : "Import failed",
          showErrors: false,
        },
      }))
    }
  }

  function handleReset(cardId: string) {
    setImportStates((prev) => {
      const next = { ...prev }
      delete next[cardId]
      return next
    })
    setActiveImportCard(null)
    const input = fileInputRefs.current[cardId]
    if (input) input.value = ""
  }

  function handleToggleErrors(cardId: string) {
    setImportStates((prev) => ({
      ...prev,
      [cardId]: {
        ...prev[cardId],
        showErrors: !prev[cardId]?.showErrors,
      },
    }))
  }

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
        <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1">
          {peopleCardConfigs.map((card) => {
            const Icon = card.icon
            const state = importStates[card.id]
            const isActive = activeImportCard === card.id
            const isUploading = state?.uploading
            return (
              <div key={card.id} className="relative w-60 shrink-0">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.json,.docx"
                  className="hidden"
                  ref={(el) => {
                    fileInputRefs.current[card.id] = el
                  }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileSelect(card, file)
                  }}
                />
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (!isUploading) fileInputRefs.current[card.id]?.click()
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isUploading)
                      fileInputRefs.current[card.id]?.click()
                  }}
                  className={`hover:bg-muted/50 w-full cursor-pointer space-y-2 rounded-lg border p-4 transition-colors ${
                    isActive ? "border-primary bg-muted/30" : ""
                  } ${isUploading ? "pointer-events-none opacity-60" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    {isUploading ? (
                      <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
                    ) : (
                      <Icon className="text-muted-foreground h-5 w-5" />
                    )}
                  </div>
                  <p className="text-sm font-medium">{card.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {card.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    downloadTemplate(
                      card.templateContent,
                      card.templateFilename
                    )
                  }}
                  className="text-muted-foreground hover:text-foreground absolute end-2 top-2 rounded p-1 transition-colors"
                  title={isArabic ? "تحميل القالب" : "Download Template"}
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>
        {activeImportCard && importStates[activeImportCard] && (
          <div className="pt-2">
            <ImportResultDisplay
              cardId={activeImportCard}
              state={importStates[activeImportCard]}
              isArabic={isArabic}
              onToggleErrors={handleToggleErrors}
              onReset={handleReset}
            />
          </div>
        )}
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
