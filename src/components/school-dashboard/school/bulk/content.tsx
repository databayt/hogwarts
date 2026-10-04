"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useCallback, useRef, useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  Download,
  GraduationCap,
  KeyRound,
  Loader2,
  Shield,
  Upload,
  UserCheck,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  downloadCredentialsCsv,
  ImportResultPanel,
  type ImportResultData,
} from "@/components/file/import/result-panel"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { bulkParseAndValidate, bulkSmartImport } from "./actions"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

type ImportType = "students" | "teachers" | "staff" | "guardians"

// Shared with the onboarding import — see `file/import/result-panel.tsx`.
type ImportResult = ImportResultData

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

interface UploadConfig {
  type: ImportType
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  templateContent: string
  templateFilename: string
}

const STUDENT_TEMPLATE =
  "name,email,phone,studentId,yearLevel,guardianName,guardianEmail,guardianPhone,dateOfBirth,gender\nJohn Doe,john@example.com,+249911111111,STD001,Grade 10,Jane Doe,jane@example.com,+1234567890,2008-05-15,male\nSarah Smith,,,STD002,Grade 9,Mike Smith,mike@example.com,+0987654321,2009-03-22,female"

const TEACHER_TEMPLATE =
  'name,email,employeeId,department,phoneNumber,subjects,qualification\nDr. Alice Johnson,alice@school.edu,TCH001,Mathematics,+1234567890,"Algebra,Calculus",PhD in Mathematics\nMr. Bob Wilson,bob@school.edu,TCH002,Science,+0987654321,Physics,MSc in Physics'

const STAFF_TEMPLATE =
  "firstName,lastName,emailAddress,employeeId,position,department,phoneNumber,gender,employmentType\nAhmed,Hassan,ahmed@school.edu,STF001,Accountant,Finance,+1234567890,male,FULL_TIME\nFatima,Ali,fatima@school.edu,STF002,Librarian,Library,+0987654321,female,PART_TIME"

const GUARDIAN_TEMPLATE =
  "firstName,lastName,emailAddress,phoneNumber,guardianType,studentId\nMohammed,Ahmed,mohammed@example.com,+1234567890,father,STD001\nSara,Hassan,sara@example.com,+0987654321,mother,STD002"

function downloadTemplate(content: string, filename: string) {
  // BOM so Excel opens the file as UTF-8 (Arabic names stay readable).
  const blob = new Blob(["﻿" + content], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// One upload card per person type. Click (or drop a file on) the body to
// import; the footer carries the template download and, once an import has
// minted accounts, the logins download.
function UploadCard({
  config,
  state,
  t,
  onUpload,
}: {
  config: UploadConfig
  state: SectionState
  t: Record<string, string>
  onUpload: (file: File) => void
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [dragging, setDragging] = useState(false)
  const Icon = config.icon
  const busy = state.uploading || state.importing
  const failed = !!state.error || (state.result?.failed ?? 0) > 0
  const succeeded = !!state.result && !busy && !failed

  const openPicker = () => {
    if (!busy) inputRef.current?.click()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && !busy) onUpload(file)
  }

  const status = state.error
    ? state.error
    : busy
      ? t.importing
      : state.result
        ? `${state.result.imported} ${t.imported}${
            state.result.skipped > 0
              ? ` · ${state.result.skipped} ${t.skipped}`
              : ""
          }${state.result.failed > 0 ? ` · ${state.result.failed} ${t.failed}` : ""}`
        : null

  return (
    <div
      className={cn(
        "bg-card flex flex-col rounded-xl border transition-colors",
        dragging && "border-primary bg-primary/5",
        succeeded && "border-green-500/40",
        failed && "border-destructive/40"
      )}
    >
      <div
        role="button"
        tabIndex={0}
        aria-busy={busy}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            openPicker()
          }
        }}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        className={cn(
          "hover:bg-muted/40 focus-visible:ring-ring flex flex-1 cursor-pointer flex-col gap-3 rounded-t-xl p-4 transition-colors focus-visible:ring-2 focus-visible:outline-none",
          busy && "cursor-wait"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
            <Icon className="text-foreground h-5 w-5" />
          </div>
          {busy ? (
            <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
          ) : failed ? (
            <AlertCircle className="text-destructive h-5 w-5" />
          ) : succeeded ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <Upload className="text-muted-foreground h-5 w-5" />
          )}
        </div>
        <div className="space-y-1">
          <h3 className="font-medium">{config.label}</h3>
          <p
            className={cn(
              "text-muted-foreground line-clamp-2 text-sm",
              state.error && "text-destructive"
            )}
          >
            {status ?? config.description}
          </p>
        </div>
        <p className="text-muted-foreground mt-auto text-xs">{t.dropHint}</p>
      </div>

      <div className="flex items-center justify-between gap-1 border-t px-2 py-1.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground h-8 gap-1.5 px-2"
          onClick={() =>
            downloadTemplate(config.templateContent, config.templateFilename)
          }
        >
          <Download className="h-4 w-4" />
          {t.template}
        </Button>
        {!busy && !!state.result?.credentials?.length && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2"
            onClick={() =>
              downloadCredentialsCsv(state.result!.credentials!, config.type)
            }
          >
            <KeyRound className="h-4 w-4" />
            {t.logins}
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_FORMATS}
        className="sr-only"
        tabIndex={-1}
        aria-label={config.label}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onUpload(file)
          e.target.value = ""
        }}
      />
    </div>
  )
}

export default function BulkContent({ dictionary, lang }: Props) {
  const t = ((dictionary?.school as Record<string, unknown>)?.bulk ??
    {}) as Record<string, string>

  const [sectionStates, setSectionStates] = useState<
    Record<ImportType, SectionState>
  >({
    students: initialSectionState,
    teachers: initialSectionState,
    staff: initialSectionState,
    guardians: initialSectionState,
  })

  const configs: UploadConfig[] = [
    {
      type: "students",
      icon: GraduationCap,
      label: t.students,
      description: t.studentsDesc,
      templateContent: STUDENT_TEMPLATE,
      templateFilename: "students-template.csv",
    },
    {
      type: "teachers",
      icon: UserCheck,
      label: t.teachers,
      description: t.teachersDesc,
      templateContent: TEACHER_TEMPLATE,
      templateFilename: "teachers-template.csv",
    },
    {
      type: "staff",
      icon: Users,
      label: t.staff,
      description: t.staffDesc,
      templateContent: STAFF_TEMPLATE,
      templateFilename: "staff-template.csv",
    },
    {
      type: "guardians",
      icon: Shield,
      label: t.guardians,
      description: t.guardiansDesc,
      templateContent: GUARDIAN_TEMPLATE,
      templateFilename: "guardians-template.csv",
    },
  ]

  // Off by default: a bulk import has always been silent, and a trial run
  // must never mail hundreds of real families by accident. When on, the
  // notifications are queued and drained by the email cron (50 per 15 min),
  // so a large file spreads over hours rather than bursting.
  const [notifyFamilies, setNotifyFamilies] = useState(false)

  const handleUpload = useCallback(
    async (file: File, type: ImportType) => {
      const setState = (updater: (prev: SectionState) => SectionState) => {
        setSectionStates((prev) => ({ ...prev, [type]: updater(prev[type]) }))
      }

      setState(() => ({
        uploading: true,
        importing: false,
        result: null,
        error: null,
      }))

      try {
        // Phase 1: fast parse + validate (no DB writes)
        const formData = new FormData()
        formData.append("file", file)
        formData.append("type", type)
        const preview = await bulkParseAndValidate(formData)

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

        // Phase 2: the DB import
        const importData = new FormData()
        importData.append("csvContent", preview.csvContent)
        importData.append("type", type)
        importData.append("notifyFamilies", String(notifyFamilies))
        const result = await bulkSmartImport(importData)
        setState((prev) => ({ ...prev, result, importing: false }))
      } catch (err) {
        setState(() => ({
          uploading: false,
          importing: false,
          result: null,
          error: err instanceof Error ? err.message : t.importFailed,
        }))
      }
    },
    [notifyFamilies, t.importFailed]
  )

  const withResults = configs.filter((c) => sectionStates[c.type].result)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{t.title}</h2>
          <p className="text-muted-foreground text-sm">{t.description}</p>
        </div>
        {/*
          Off by default. Imported students and their guardians hear nothing
          unless an admin deliberately asks — credentials still come back in
          the result for the admin to hand out either way.
        */}
        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm">
          <Switch
            checked={notifyFamilies}
            onCheckedChange={setNotifyFamilies}
          />
          {t.notifyFamilies}
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {configs.map((config) => (
          <UploadCard
            key={config.type}
            config={config}
            state={sectionStates[config.type]}
            t={t}
            onUpload={(file) => handleUpload(file, config.type)}
          />
        ))}
      </div>

      {/* Per-type details — row errors, warnings (why `imported` is lower
          than the row count), parent access codes and the logins download. */}
      {withResults.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {withResults.map((config) => (
            <div
              key={`${config.type}-result`}
              className="space-y-3 rounded-xl border p-4"
            >
              <h3 className="font-medium">{config.label}</h3>
              <ImportResultPanel
                result={sectionStates[config.type].result!}
                isImporting={sectionStates[config.type].importing}
                entityLabel={config.type}
                lang={lang}
                t={{
                  importing: t.importing,
                  imported: t.imported,
                  skipped: t.skipped,
                  failed: t.failed,
                  row: t.row,
                  warnings: t.warnings,
                  accessCodes: t.accessCodes,
                  expires: t.expires,
                  downloadLogins: t.downloadLogins,
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
