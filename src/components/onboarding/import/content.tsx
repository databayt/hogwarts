"use client"

import React, { useCallback, useRef, useState } from "react"
import { AlertCircle, CheckCircle2, Info, Loader2, Upload } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useHostValidation } from "@/components/onboarding/host-validation-context"

import { parseAndValidate, smartImport } from "./actions"

interface ImportResult {
  imported: number
  failed: number
  skipped: number
  errors: Array<{ row: number; error: string; details?: string }>
}

type ImportType = "students" | "teachers"

interface SectionState {
  uploading: boolean
  result: ImportResult | null
  error: string | null
  importing: boolean
}

const initialState: SectionState = {
  uploading: false,
  result: null,
  error: null,
  importing: false,
}

const ACCEPTED_FORMATS = ".csv,.xlsx,.xls,.json"

interface Props {
  dictionary?: any
}

export default function ImportContent({ dictionary }: Props) {
  const dict = dictionary?.onboarding || {}
  const { enableNext } = useHostValidation()
  const [students, setStudents] = useState<SectionState>(initialState)
  const [teachers, setTeachers] = useState<SectionState>(initialState)
  const studentInputRef = useRef<HTMLInputElement>(null)
  const teacherInputRef = useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    enableNext()
  }, [enableNext])

  const handleUpload = useCallback(async (file: File, type: ImportType) => {
    const setState = type === "students" ? setStudents : setTeachers
    setState({ uploading: true, result: null, error: null, importing: false })

    try {
      // Phase 1: Fast parse + validate (<500ms)
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", type)

      const preview = await parseAndValidate(formData)

      // Show optimistic result immediately
      setState({
        uploading: false,
        result: {
          imported: preview.validRows,
          failed: preview.invalidRows.length,
          skipped: 0,
          errors: preview.invalidRows,
        },
        error: null,
        importing: true,
      })

      // Phase 2: Background batch import (non-blocking)
      const importData = new FormData()
      importData.append("csvContent", preview.csvContent)
      importData.append("type", type)

      smartImport(importData)
        .then((result) => {
          setState((prev) => ({ ...prev, result, importing: false }))
        })
        .catch((err) => {
          setState((prev) => ({
            ...prev,
            error: err instanceof Error ? err.message : dict.importFailed,
            importing: false,
          }))
        })
    } catch (err) {
      setState({
        uploading: false,
        result: null,
        error: err instanceof Error ? err.message : dict.importFailed,
        importing: false,
      })
    }
  }, [])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, type: ImportType) => {
      const file = e.target.files?.[0]
      if (file) handleUpload(file, type)
      e.target.value = ""
    },
    [handleUpload]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent, type: ImportType) => {
      e.preventDefault()
      const file = e.dataTransfer.files?.[0]
      if (file) handleUpload(file, type)
    },
    [handleUpload]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-20">
        {/* Left side */}
        <div className="space-y-3 sm:space-y-4">
          <h1 className="text-3xl font-bold">{dict.importData}</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {dict.importDescription}
          </p>
          <ExpectedFieldsDialog dict={dict} />
        </div>

        {/* Right side */}
        <div className="space-y-6 lg:justify-self-end">
          <DropZone
            type="students"
            label={dict.students}
            state={students}
            dict={dict}
            inputRef={studentInputRef}
            onFileChange={(e) => handleFileChange(e, "students")}
            onDrop={(e) => handleDrop(e, "students")}
            onDragOver={handleDragOver}
            onBrowse={() => studentInputRef.current?.click()}
          />

          <DropZone
            type="teachers"
            label={dict.teachers}
            state={teachers}
            dict={dict}
            inputRef={teacherInputRef}
            onFileChange={(e) => handleFileChange(e, "teachers")}
            onDrop={(e) => handleDrop(e, "teachers")}
            onDragOver={handleDragOver}
            onBrowse={() => teacherInputRef.current?.click()}
          />
        </div>
      </div>
    </div>
  )
}

function DropZone({
  type,
  label,
  state,
  inputRef,
  onFileChange,
  onDrop,
  onDragOver,
  onBrowse,
  dict,
}: {
  type: ImportType
  label: string
  state: SectionState
  inputRef: React.RefObject<HTMLInputElement | null>
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDrop: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onBrowse: () => void
  dict: any
}) {
  const hasResult = state.result || state.error

  return (
    <div className="w-full max-w-[400px]">
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
        {/* Upload area */}
        {state.uploading ? (
          <div className="flex h-[140px] items-center justify-center">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
          </div>
        ) : hasResult ? (
          <div className="flex min-h-[140px] flex-col items-center justify-center space-y-2 p-4">
            {/* Results */}
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
                    {state.importing
                      ? dict.importingStatus
                      : dict.importedSuccessfullyCount}
                  </div>
                )}
                {state.result.skipped > 0 && (
                  <div className="text-muted-foreground flex items-center gap-2">
                    <Info className="h-4 w-4 shrink-0" />
                    {state.result.skipped} {dict.skippedAlreadyExist}
                  </div>
                )}
                {state.result.failed > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {state.result.failed} {dict.failed}
                    </div>
                    <div className="max-h-[80px] overflow-y-auto rounded border p-2 text-xs">
                      {state.result.errors.map((err, i) => (
                        <div key={i} className="text-muted-foreground py-0.5">
                          {dict.row} {err.row}: {err.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {state.error && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {state.error}
              </div>
            )}

            {/* Re-upload link */}
            {!state.importing && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={onBrowse}
                  className="text-muted-foreground hover:text-foreground mt-1 text-xs underline underline-offset-2"
                >
                  {dict.uploadAnotherFile}
                </button>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_FORMATS}
              onChange={onFileChange}
              className="sr-only"
            />
          </div>
        ) : (
          <div
            className="flex h-[140px] cursor-pointer flex-col items-center justify-center gap-2"
            onDrop={onDrop}
            onDragOver={onDragOver}
            onClick={onBrowse}
          >
            <Upload className="text-muted-foreground h-5 w-5" />
            <p className="text-sm">
              {dict.dropFile} <span className="font-semibold">{label}</span>{" "}
              {dict.fileOrBrowse}
            </p>
            <p className="text-muted-foreground/60 text-xs">
              {dict.csvExcelJson}
            </p>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_FORMATS}
              onChange={onFileChange}
              className="sr-only"
            />
          </div>
        )}
      </div>
    </div>
  )
}

function ExpectedFieldsDialog({ dict }: { dict: any }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm underline-offset-4 hover:underline">
          <Info className="h-4 w-4" />
          {dict.seeExpectedFields}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{dict.expectedFields}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 text-sm">
          <div>
            <h4 className="mb-2 font-medium">{dict.students}</h4>
            <div className="space-y-1">
              <FieldRow name="name" required requiredLabel={dict.required} />
              <FieldRow
                name="studentId"
                required
                requiredLabel={dict.required}
              />
              <FieldRow name="email" />
              <FieldRow name="middleName" />
              <FieldRow name="section" />
              <FieldRow name="yearLevel" />
              <FieldRow name="enrollmentDate" />
              <FieldRow name="status" />
              <FieldRow name="guardianName" />
              <FieldRow name="guardianEmail" />
              <FieldRow name="guardianPhone" />
              <FieldRow name="dateOfBirth" />
              <FieldRow name="gender" />
            </div>
          </div>

          <div>
            <h4 className="mb-2 font-medium">{dict.teachers}</h4>
            <div className="space-y-1">
              <FieldRow name="name" required requiredLabel={dict.required} />
              <FieldRow name="email" required requiredLabel={dict.required} />
              <FieldRow
                name="employeeId"
                required
                requiredLabel={dict.required}
              />
              <FieldRow name="department" />
              <FieldRow name="phoneNumber" />
              <FieldRow name="subjects" />
              <FieldRow name="qualification" />
            </div>
          </div>

          <p className="text-muted-foreground text-xs">
            {dict.missingFieldsNote}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function FieldRow({
  name,
  required,
  requiredLabel,
}: {
  name: string
  required?: boolean
  requiredLabel?: string
}) {
  return (
    <div className="text-muted-foreground flex items-center gap-2">
      <code className="bg-muted rounded px-1.5 py-0.5 text-xs">{name}</code>
      {required && (
        <span className="text-xs text-red-500">* {requiredLabel}</span>
      )}
    </div>
  )
}
