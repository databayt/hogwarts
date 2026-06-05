"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import Link from "next/link"
import { ArrowLeft, FileUp, Sparkles } from "lucide-react"
import Papa from "papaparse"
import { toast } from "sonner"

import { extractMultipleLeads } from "@/lib/text-extraction"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { createOperatorLead } from "./actions"

type ParsedLead = {
  name: string
  email?: string
  phone?: string
  company?: string
  title?: string
  country?: string
  source?: string
}

interface Props {
  dictionary?: Dictionary["sales"]
  lang: Locale
}

const ALLOWED_COUNTRY = /^[A-Z]{2}$/

/**
 * Parse CSV content. Recognised headers (case-insensitive, trimmed):
 *   name, email, phone, company, title, country, source
 * Anything else is ignored. Rows missing `name` are skipped.
 */
function parseCsv(csvText: string): ParsedLead[] {
  const { data, errors } = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  })
  if (errors.length) {
    console.warn("[sales import] CSV parse warnings:", errors)
  }
  const rows: ParsedLead[] = []
  for (const row of data) {
    const name = (row.name ?? "").trim()
    if (!name) continue
    const country = (row.country ?? "").trim().toUpperCase()
    rows.push({
      name,
      email: row.email?.trim() || undefined,
      phone: row.phone?.trim() || undefined,
      company: row.company?.trim() || undefined,
      title: row.title?.trim() || undefined,
      country: ALLOWED_COUNTRY.test(country) ? country : undefined,
      source: row.source?.trim() || undefined,
    })
  }
  return rows
}

export function ImportLeadsContent({ dictionary, lang }: Props) {
  const i = dictionary?.import
  const t = {
    back: dictionary?.detail?.back ?? "Back to leads",
    title: i?.title ?? "Import Leads",
    description:
      i?.description ??
      "Paste text or upload a CSV. We extract name, email, phone, company, country.",
    textImport: i?.textImport ?? "Text Import",
    placeholder:
      i?.placeholder ??
      "Paste your text data here...\nExample: John Doe - CEO - john@example.com",
    importLeads: i?.importLeads ?? "Import Leads",
    processing: i?.processing ?? "Processing...",
    detectedFields: i?.detectedFields ?? "Detected Fields",
    csvImport: "CSV Upload",
    csvHelp:
      "Headers: name (required), email, phone, company, title, country, source.",
    chooseFile: "Choose CSV file",
    imported: i?.imported ?? "Imported",
    newLeads: i?.newLeads ?? "new lead(s)",
    failed: i?.failed ?? "failed",
    noLeadsFound: i?.noPatterns ?? "No recognizable patterns found",
  }

  const [rawText, setRawText] = useState("")
  const [parsed, setParsed] = useState<ParsedLead[]>([])
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [pending, startTransition] = useTransition()

  // Run the regex-based extractor against the textarea and surface a preview.
  // We intentionally don't auto-import — the operator should eyeball the
  // table first because regex extraction is noisy on free-form input.
  const onExtractText = () => {
    if (!rawText.trim()) {
      toast.error(t.noLeadsFound)
      return
    }
    const leads = extractMultipleLeads(rawText)
    const cleaned: ParsedLead[] = []
    for (const l of leads) {
      const name = l.name?.trim()
      if (!name) continue
      cleaned.push({
        name,
        email: l.email,
        phone: l.phone,
        company: l.company,
        // ExtractedLead has no `title` field — that comes from CSV uploads only.
      })
    }
    if (cleaned.length === 0) {
      toast.error(t.noLeadsFound)
      setParsed([])
      return
    }
    setParsed(cleaned)
  }

  const onPickCsv = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? "")
      const rows = parseCsv(text)
      if (rows.length === 0) {
        toast.error(t.noLeadsFound)
        setParsed([])
        return
      }
      setParsed(rows)
    }
    reader.readAsText(file)
  }

  const onImport = () => {
    if (parsed.length === 0) return
    startTransition(async () => {
      let imported = 0
      let failed = 0
      for (let i = 0; i < parsed.length; i++) {
        const lead = parsed[i]
        setProgress({ current: i + 1, total: parsed.length })
        const res = await createOperatorLead({
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          title: lead.title,
          country: lead.country,
          // Source defaults to IMPORT so we can later filter "imported this
          // week" cleanly. Caller can override per row via CSV header.
          source: (lead.source ?? "IMPORT") as never,
          status: "NEW" as never,
          priority: "MEDIUM" as never,
          leadType: "SCHOOL" as never,
          score: 50,
          tags: [],
          verified: false,
        })
        if (res.success) imported++
        else failed++
      }
      toast.success(
        `${t.imported} ${imported} ${t.newLeads}, ${failed} ${t.failed}`
      )
      setParsed([])
      setRawText("")
      setProgress({ current: 0, total: 0 })
    })
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link href={`/${lang}/sales`}>
          <ArrowLeft className="me-2 h-4 w-4 rtl:rotate-180" />
          {t.back}
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-muted-foreground text-sm">{t.description}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" />
              {t.textImport}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              rows={10}
              value={rawText}
              placeholder={t.placeholder}
              onChange={(e) => setRawText(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={onExtractText}
              disabled={!rawText.trim() || pending}
            >
              {t.detectedFields}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileUp className="h-4 w-4" />
              {t.csvImport}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-xs">{t.csvHelp}</p>
            <div className="space-y-2">
              <Label htmlFor="csv-file">{t.chooseFile}</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) onPickCsv(file)
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {parsed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>
                {parsed.length} {parsed.length === 1 ? "lead" : "leads"}
              </span>
              <Button onClick={onImport} disabled={pending}>
                {pending ? t.processing : t.importLeads}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending && progress.total > 0 && (
              <Progress
                value={(progress.current / progress.total) * 100}
                aria-label={`${progress.current}/${progress.total}`}
              />
            )}
            <ul className="divide-y">
              {parsed.slice(0, 50).map((lead, idx) => (
                <li
                  key={`${lead.name}-${idx}`}
                  className="flex items-center justify-between gap-4 py-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{lead.name}</div>
                    <div className="text-muted-foreground truncate text-xs">
                      {[lead.title, lead.company, lead.email, lead.phone]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>
                  {lead.country && (
                    <Badge variant="outline" className="text-xs">
                      {lead.country}
                    </Badge>
                  )}
                </li>
              ))}
              {parsed.length > 50 && (
                <li className="text-muted-foreground py-2 text-xs">
                  +{parsed.length - 50} more
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
