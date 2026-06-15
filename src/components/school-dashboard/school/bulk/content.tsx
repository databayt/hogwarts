"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { Suspense, useCallback, useRef, useState } from "react"
import {
  AlertCircle,
  BookOpen,
  Box,
  Building,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  FileText,
  GraduationCap,
  KeyRound,
  Layers,
  Loader2,
  Shield,
  Target,
  UserCheck,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
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
import { bulkParseAndValidate, bulkSmartImport } from "./actions"

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

// ---------- People Import (one-click upload cards) ----------

type ImportType = "students" | "teachers" | "staff" | "guardians"

interface ImportResult {
  imported: number
  failed: number
  skipped: number
  errors: Array<{ row: number; error: string; details?: string }>
  credentials?: Array<{
    row: number
    name: string
    username: string
    email: string | null
    role: string
    password: string
  }>
}

interface SectionState {
  uploading: boolean
  importing: boolean
  result: ImportResult | null
  error: string | null
}

const initialSectionState: SectionState = {
  uploading: false,
  importing: false,
  result: null,
  error: null,
}

const ACCEPTED_FORMATS = ".csv,.xlsx,.xls,.json,.docx"

interface DropZoneConfig {
  type: ImportType
  icon: React.ComponentType<{ className?: string }>
  label: string
  templateContent: string
  templateFilename: string
}

const STUDENT_TEMPLATE =
  "name,email,studentId,yearLevel,guardianName,guardianEmail,guardianPhone,dateOfBirth,gender\nJohn Doe,john@example.com,STD001,Grade 10,Jane Doe,jane@example.com,+1234567890,2008-05-15,male\nSarah Smith,,STD002,Grade 9,Mike Smith,mike@example.com,+0987654321,2009-03-22,female"

const TEACHER_TEMPLATE =
  'name,email,employeeId,department,phoneNumber,subjects,qualification\nDr. Alice Johnson,alice@school.edu,TCH001,Mathematics,+1234567890,"Algebra,Calculus",PhD in Mathematics\nMr. Bob Wilson,bob@school.edu,TCH002,Science,+0987654321,Physics,MSc in Physics'

const STAFF_TEMPLATE =
  "firstName,lastName,emailAddress,employeeId,position,department,phoneNumber,gender,employmentType\nAhmed,Hassan,ahmed@school.edu,STF001,Accountant,Finance,+1234567890,male,FULL_TIME\nFatima,Ali,fatima@school.edu,STF002,Librarian,Library,+0987654321,female,PART_TIME"

const GUARDIAN_TEMPLATE =
  "firstName,lastName,emailAddress,phoneNumber,guardianType,studentId\nMohammed,Ahmed,mohammed@example.com,+1234567890,father,STD001\nSara,Hassan,sara@example.com,+0987654321,mother,STD002"

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

// Escape a CSV cell (quote + double inner quotes; guard against formula
// injection by prefixing leading =,+,-,@).
function csvCell(value: string): string {
  const v = value ?? ""
  const guarded = /^[=+\-@]/.test(v) ? `'${v}` : v
  return `"${guarded.replace(/"/g, '""')}"`
}

// Build + download the minted-credentials sheet so the admin can distribute
// logins (passwords are crypto-random + single-use, so this is the only place
// to read them).
function downloadCredentials(
  credentials: NonNullable<ImportResult["credentials"]>,
  type: ImportType
) {
  const header = ["name", "username", "email", "role", "password"]
  const lines = [
    header.join(","),
    ...credentials.map((c) =>
      [c.name, c.username, c.email ?? "", c.role, c.password]
        .map((cell) => csvCell(String(cell)))
        .join(",")
    ),
  ]
  downloadTemplate(lines.join("\n"), `${type}-logins.csv`)
}

// One-click upload card. Click anywhere → file picker; drag a file onto it →
// same. Status (busy / success / failure) shows as a small icon next to the
// download-template button so the layout never grows a second row.
function UploadCard({
  config,
  state,
  t,
  onUpload,
}: {
  config: DropZoneConfig
  state: SectionState
  t: Record<string, string>
  onUpload: (file: File) => void
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const Icon = config.icon
  const busy = state.uploading || state.importing
  const succeeded = !!state.result && !state.error && !state.importing
  const failed = !!state.error || (state.result?.failed ?? 0) > 0

  const openPicker = () => {
    if (busy) return
    inputRef.current?.click()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && !busy) onUpload(file)
  }

  const description = state.error
    ? state.error
    : state.result
      ? `${state.result.imported} ${state.importing ? t.importing : t.imported}${
          state.result.failed > 0 ? ` · ${state.result.failed} ${t.failed}` : ""
        }`
      : (t[`${config.type}Desc`] ?? "")

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openPicker}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openPicker()}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={cn(
        "hover:bg-muted/50 focus-visible:ring-ring relative cursor-pointer space-y-2 rounded-lg border p-4 transition-colors focus-visible:ring-2 focus-visible:outline-none",
        busy && "pointer-events-none opacity-60",
        succeeded && "border-green-500/40",
        failed && "border-red-300/60"
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className="text-muted-foreground h-5 w-5" />
      </div>
      <p className="text-sm font-medium">{config.label}</p>
      <p className="text-muted-foreground line-clamp-2 text-xs">
        {description}
      </p>

      {/* Status / template controls — absolute so they don't add a second row */}
      <div className="absolute end-2 top-2 flex items-center gap-1">
        {busy && (
          <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
        )}
        {!busy && succeeded && (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        )}
        {!busy && failed && <AlertCircle className="h-4 w-4 text-red-600" />}
        {!busy && !!state.result?.credentials?.length && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              downloadCredentials(state.result!.credentials!, config.type)
            }}
            className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
            title={t.downloadCredentials ?? "Download logins"}
            aria-label={t.downloadCredentials ?? "Download logins"}
          >
            <KeyRound className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            downloadTemplate(config.templateContent, config.templateFilename)
          }}
          className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
          title={t.downloadTemplate}
          aria-label={t.downloadTemplate}
        >
          <Download className="h-4 w-4" />
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_FORMATS}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onUpload(file)
          e.target.value = ""
        }}
      />
    </div>
  )
}

// ---------- Main Component ----------

export default function BulkContent({ dictionary, lang }: Props) {
  const t = ((dictionary?.school as Record<string, unknown>)?.bulk ??
    {}) as Record<string, string>
  const [activeAcademic, setActiveAcademic] = useState("years")

  // Per-entity import state for the People upload cards (two-phase pattern:
  // parse/validate then background DB write).
  const [sectionStates, setSectionStates] = useState<
    Record<ImportType, SectionState>
  >({
    students: initialSectionState,
    teachers: initialSectionState,
    staff: initialSectionState,
    guardians: initialSectionState,
  })

  const dropZoneConfigs: DropZoneConfig[] = [
    {
      type: "students",
      icon: GraduationCap,
      label: t.students || "Students",
      templateContent: STUDENT_TEMPLATE,
      templateFilename: "students-template.csv",
    },
    {
      type: "teachers",
      icon: UserCheck,
      label: t.teachers || "Teachers",
      templateContent: TEACHER_TEMPLATE,
      templateFilename: "teachers-template.csv",
    },
    {
      type: "staff",
      icon: Users,
      label: t.staff || "Staff",
      templateContent: STAFF_TEMPLATE,
      templateFilename: "staff-template.csv",
    },
    {
      type: "guardians",
      icon: Shield,
      label: t.guardians || "Guardians",
      templateContent: GUARDIAN_TEMPLATE,
      templateFilename: "guardians-template.csv",
    },
  ]

  const handleUpload = useCallback(async (file: File, type: ImportType) => {
    const setState = (updater: (prev: SectionState) => SectionState) => {
      setSectionStates((prev) => ({
        ...prev,
        [type]: updater(prev[type]),
      }))
    }

    setState(() => ({
      uploading: true,
      importing: false,
      result: null,
      error: null,
    }))

    try {
      // Phase 1: Fast parse + validate
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", type)

      const preview = await bulkParseAndValidate(formData)

      // Show optimistic result immediately
      setState(() => ({
        uploading: false,
        importing: true,
        result: {
          imported: preview.validRows,
          failed: preview.invalidRows.length,
          skipped: 0,
          errors: preview.invalidRows,
        },
        error: null,
      }))

      // Phase 2: Background DB import
      const importData = new FormData()
      importData.append("csvContent", preview.csvContent)
      importData.append("type", type)

      bulkSmartImport(importData)
        .then((result) => {
          setState((prev) => ({ ...prev, result, importing: false }))
        })
        .catch((err) => {
          setState((prev) => ({
            ...prev,
            error: err instanceof Error ? err.message : "Import failed",
            importing: false,
          }))
        })
    } catch (err) {
      setState(() => ({
        uploading: false,
        importing: false,
        result: null,
        error: err instanceof Error ? err.message : "Import failed",
      }))
    }
  }, [])

  const academicCards: BulkCardItem[] = [
    {
      id: "years",
      icon: Calendar,
      title: t.academicYears || "Academic Years",
      description: t.academicYearsDesc || "Create and manage school years",
    },
    {
      id: "terms",
      icon: Layers,
      title: t.terms || "Terms",
      description: t.termsDesc || "Define terms within the academic year",
    },
    {
      id: "periods",
      icon: Clock,
      title: t.periods || "Periods",
      description: t.periodsDesc || "Configure daily class periods",
    },
    {
      id: "levels",
      icon: GraduationCap,
      title: t.yearLevels || "Year Levels",
      description: t.yearLevelsDesc || "Define grades and year levels",
    },
    {
      id: "grading",
      icon: Target,
      title: t.gradingScale || "Grading Scale",
      description: t.gradingScaleDesc || "Configure grading and score ranges",
    },
  ]

  const structureCards: BulkCardItem[] = [
    {
      id: "departments",
      icon: Building,
      title: t.departments || "Departments",
      description: t.departmentsDesc || "Manage school departments",
      placeholder: true,
    },
    {
      id: "classrooms",
      icon: Box,
      title: t.classrooms || "Classrooms",
      description: t.classroomsDesc || "Manage classroom assignments",
      placeholder: true,
    },
  ]

  const placeholderSections = [
    {
      title: t.attendance || "Attendance",
      cards: [
        {
          id: "attendance",
          icon: ClipboardList,
          title: t.attendanceImport || "Attendance Import",
          description: t.attendanceImportDesc || "Import attendance records",
          placeholder: true,
        },
      ] satisfies BulkCardItem[],
    },
    {
      title: t.timetable || "Timetable",
      cards: [
        {
          id: "timetable",
          icon: Clock,
          title: t.timetableImport || "Timetable Import",
          description: t.timetableImportDesc || "Import timetable schedule",
          placeholder: true,
        },
      ] satisfies BulkCardItem[],
    },
    {
      title: t.exams || "Exams",
      cards: [
        {
          id: "exams",
          icon: FileText,
          title: t.examScoresImport || "Exam Scores Import",
          description: t.examScoresImportDesc || "Import exam score records",
          placeholder: true,
        },
      ] satisfies BulkCardItem[],
    },
    {
      title: t.materials || "Materials",
      cards: [
        {
          id: "materials",
          icon: BookOpen,
          title: t.materialsImport || "Materials Import",
          description: t.materialsImportDesc || "Import educational materials",
          placeholder: true,
        },
      ] satisfies BulkCardItem[],
    },
  ]

  return (
    <div className="space-y-10">
      {/* People — one row of click-to-upload cards. Each card opens its own
          file picker (or accepts a drop) and shows status inline; no second
          row. */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t.people || "People"}</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {dropZoneConfigs.map((config) => (
            <UploadCard
              key={config.type}
              config={config}
              state={sectionStates[config.type]}
              t={t}
              onUpload={(file) => handleUpload(file, config.type)}
            />
          ))}
        </div>
      </section>

      {/* Academic */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t.academic || "Academic"}</h2>
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
        <h2 className="text-lg font-semibold">{t.structure || "Structure"}</h2>
        <ScrollRow items={structureCards} activeId={null} onSelect={() => {}} />
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
