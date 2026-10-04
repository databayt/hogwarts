"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useCallback, useRef, useState } from "react"
import {
  Download,
  GraduationCap,
  Shield,
  Upload,
  UserCheck,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { IMPORT_TYPES, TEMPLATES, type ImportType } from "./fields"
import { ImportHistory } from "./history"
import { ImportDialog } from "./import-dialog"
import type { BulkText } from "./text"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

const ACCEPTED_FORMATS = ".csv,.xlsx,.xls,.json,.docx,.txt"

const ICONS: Record<ImportType, React.ComponentType<{ className?: string }>> = {
  students: GraduationCap,
  teachers: UserCheck,
  staff: Users,
  guardians: Shield,
}

function downloadTemplate(type: ImportType) {
  // BOM so Excel opens the Arabic example rows as UTF-8.
  const blob = new Blob(["﻿" + TEMPLATES[type]], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${type}-template.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function UploadCard({
  type,
  t,
  onFile,
}: {
  type: ImportType
  t: BulkText
  onFile: (file: File) => void
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [dragging, setDragging] = useState(false)
  const Icon = ICONS[type]
  const open = () => inputRef.current?.click()

  return (
    <div
      className={cn(
        "bg-card flex flex-col rounded-xl border transition-colors",
        dragging && "border-primary bg-primary/5"
      )}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={open}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            open()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          const file = e.dataTransfer.files?.[0]
          if (file) onFile(file)
        }}
        className="hover:bg-muted/40 focus-visible:ring-ring flex flex-1 cursor-pointer flex-col gap-3 rounded-t-xl p-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
            <Icon className="text-foreground h-5 w-5" />
          </div>
          <Upload className="text-muted-foreground h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h3 className="font-medium">{t[type]}</h3>
          <p className="text-muted-foreground text-sm">{t[`${type}Desc`]}</p>
        </div>
        <p className="text-muted-foreground mt-auto text-xs">{t.dropHint}</p>
      </div>

      <div className="flex items-center border-t px-2 py-1.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground h-8 gap-1.5 px-2"
          onClick={() => downloadTemplate(type)}
        >
          <Download className="h-4 w-4" />
          {t.template}
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_FORMATS}
        className="sr-only"
        tabIndex={-1}
        aria-label={t[type]}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
          e.target.value = ""
        }}
      />
    </div>
  )
}

export default function BulkContent({ dictionary, lang }: Props) {
  const t = dictionary.school.bulk
  const [active, setActive] = useState<{ type: ImportType; file: File } | null>(
    null
  )
  const [refreshKey, setRefreshKey] = useState(0)
  const refreshHistory = useCallback(() => setRefreshKey((k) => k + 1), [])

  return (
    <div className="space-y-10">
      <section className="space-y-6">
        <div className="max-w-2xl space-y-1">
          <h2 className="text-lg font-semibold">{t.title}</h2>
          <p className="text-muted-foreground text-sm">{t.description}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {IMPORT_TYPES.map((type) => (
            <UploadCard
              key={type}
              type={type}
              t={t}
              onFile={(file) => setActive({ type, file })}
            />
          ))}
        </div>
      </section>

      <ImportHistory t={t} lang={lang} refreshKey={refreshKey} />

      {active && (
        <ImportDialog
          key={`${active.type}:${active.file.name}:${active.file.lastModified}`}
          type={active.type}
          file={active.file}
          t={t}
          lang={lang}
          onClose={() => {
            setActive(null)
            refreshHistory()
          }}
          onStarted={refreshHistory}
        />
      )}
    </div>
  )
}
