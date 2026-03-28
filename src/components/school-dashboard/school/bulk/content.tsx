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
  Info,
  Layers,
  Loader2,
  Shield,
  Target,
  Upload,
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

// ---------- People Import (Onboarding-style DropZone) ----------

type ImportType = "students" | "teachers" | "staff" | "guardians"

interface ImportResult {
  imported: number
  failed: number
  skipped: number
  errors: Array<{ row: number; error: string; details?: string }>
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

function DropZone({
  config,
  state,
  inputRef,
  t,
  onUpload,
  onBrowse,
}: {
  config: DropZoneConfig
  state: SectionState
  inputRef: (el: HTMLInputElement | null) => void
  t: Record<string, string>
  onUpload: (file: File) => void
  onBrowse: () => void
}) {
  const hasResult = state.result || state.error
  const Icon = config.icon

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files?.[0]
      if (file) onUpload(file)
    },
    [onUpload]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  return (
    <div className="relative">
      <div
        className={`min-h-[140px] rounded-lg border-2 border-dashed transition-colors ${
          state.error
            ? "border-red-300"
            : state.result
              ? state.importing
                ? "border-orange-300"
                : "border-muted-foreground/30"
              : "border-muted-foreground/30 hover:border-muted-foreground/50"
        }`}
      >
        {state.uploading ? (
          <div className="flex h-[140px] items-center justify-center">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
          </div>
        ) : hasResult ? (
          <div className="flex min-h-[140px] flex-col items-center justify-center space-y-2 p-4">
            {state.result && (
              <div className="space-y-2 text-sm">
                {state.result.imported > 0 && (
                  <div
                    className={`flex items-center justify-center gap-2 ${state.importing ? "text-orange-600" : "text-green-700 dark:text-green-400"}`}
                  >
                    {state.importing ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    )}
                    {state.result.imported}{" "}
                    {state.importing ? t.importing : t.imported}
                  </div>
                )}
                {state.result.skipped > 0 && (
                  <div className="text-muted-foreground flex items-center gap-2">
                    <Info className="h-4 w-4 shrink-0" />
                    {state.result.skipped}{" "}
                    {t.skipped || "skipped (already exist)"}
                  </div>
                )}
                {state.result.failed > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {state.result.failed} {t.failed}
                    </div>
                    <div className="max-h-[80px] overflow-y-auto rounded border p-2 text-xs">
                      {state.result.errors.map((err, i) => (
                        <div key={i} className="text-muted-foreground py-0.5">
                          {t.row} {err.row}: {err.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {state.error && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {state.error}
              </div>
            )}

            {!state.importing && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={onBrowse}
                  className="text-muted-foreground hover:text-foreground mt-1 text-xs underline underline-offset-2"
                >
                  {t.uploadAnother}
                </button>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_FORMATS}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onUpload(file)
                e.target.value = ""
              }}
              className="sr-only"
            />
          </div>
        ) : (
          <div
            className="flex h-[140px] cursor-pointer flex-col items-center justify-center gap-2"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={onBrowse}
          >
            <div className="flex items-center gap-2">
              <Icon className="text-muted-foreground h-5 w-5" />
              <Upload className="text-muted-foreground h-4 w-4" />
            </div>
            <p className="text-sm">
              {t.dropFile} <span className="font-semibold">{config.label}</span>{" "}
              {t.fileSuffix}
            </p>
            <p className="text-muted-foreground/60 text-xs">CSV, Excel, JSON</p>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_FORMATS}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onUpload(file)
                e.target.value = ""
              }}
              className="sr-only"
            />
          </div>
        )}
      </div>

      {/* Download template button */}
      {!hasResult && !state.uploading && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            downloadTemplate(config.templateContent, config.templateFilename)
          }}
          className="text-muted-foreground hover:text-foreground absolute end-2 top-2 rounded p-1 transition-colors"
          title={t.downloadTemplate}
        >
          <Download className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

// ---------- Main Component ----------

export default function BulkContent({ dictionary, lang }: Props) {
  const t = ((dictionary?.school as Record<string, unknown>)?.bulk ??
    {}) as Record<string, string>
  const [activeAcademic, setActiveAcademic] = useState("years")

  // People import state (onboarding two-phase pattern)
  const [sectionStates, setSectionStates] = useState<
    Record<ImportType, SectionState>
  >({
    students: initialSectionState,
    teachers: initialSectionState,
    staff: initialSectionState,
    guardians: initialSectionState,
  })
  const inputRefs = useRef<Record<ImportType, HTMLInputElement | null>>({
    students: null,
    teachers: null,
    staff: null,
    guardians: null,
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
      {/* People (DropZone-based import) */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t.people || "People"}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {dropZoneConfigs.map((config) => (
            <DropZone
              key={config.type}
              config={config}
              state={sectionStates[config.type]}
              inputRef={(el) => {
                inputRefs.current[config.type] = el
              }}
              t={t}
              onUpload={(file) => handleUpload(file, config.type)}
              onBrowse={() => inputRefs.current[config.type]?.click()}
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
