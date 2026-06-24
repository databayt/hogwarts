"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { DocumentTemplate, DocumentTemplateCategory } from "@prisma/client"
import { Download, FileText, Loader2, Plus, Star, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useLocale } from "@/components/internationalization/use-locale"

import { deleteDocumentTemplate, setDefaultTemplate } from "./actions"
import { generateDocument } from "./generate"
import { UploadTemplateDialog } from "./upload-template-dialog"

/** Categories with a data resolver wired (can generate). */
const SECTIONS: {
  category: DocumentTemplateCategory
  label: { en: string; ar: string }
  idHint: { en: string; ar: string }
}[] = [
  {
    category: "CERTIFICATE",
    label: { en: "Certificates", ar: "الشهادات" },
    idHint: { en: "Certificate ID", ar: "معرّف الشهادة" },
  },
  {
    category: "EXAM_PAPER",
    label: { en: "Exam papers", ar: "أوراق الاختبارات" },
    idHint: { en: "Generated-exam ID", ar: "معرّف الاختبار المُولّد" },
  },
]

const L = {
  upload: { en: "Upload template", ar: "رفع قالب" },
  none: { en: "No templates yet.", ar: "لا توجد قوالب بعد." },
  fields: { en: "fields", ar: "حقول" },
  setDefault: { en: "Set default", ar: "تعيين افتراضي" },
  default: { en: "Default", ar: "افتراضي" },
  generate: { en: "Generate", ar: "إنشاء" },
} as const

function downloadBase64(filename: string, base64: string, mime: string) {
  const bytes = atob(base64)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  const url = URL.createObjectURL(new Blob([arr], { type: mime }))
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function DocumentsManager({
  templates,
}: {
  templates: DocumentTemplate[]
}) {
  const { locale } = useLocale()
  const lang = locale === "ar" ? "ar" : "en"
  const router = useRouter()
  const [uploadFor, setUploadFor] = useState<DocumentTemplateCategory | null>(
    null
  )
  const [isPending, startTransition] = useTransition()
  const [genId, setGenId] = useState<Record<string, string>>({})
  const [genBusy, setGenBusy] = useState<string | null>(null)
  const [genError, setGenError] = useState<string | null>(null)

  const handleSetDefault = (id: string) =>
    startTransition(async () => {
      await setDefaultTemplate(id)
      router.refresh()
    })

  const handleDelete = (id: string) =>
    startTransition(async () => {
      await deleteDocumentTemplate(id)
      router.refresh()
    })

  const handleGenerate = async (templateId: string) => {
    const entityId = (genId[templateId] || "").trim()
    if (!entityId) return
    setGenBusy(templateId)
    setGenError(null)
    const res = await generateDocument(templateId, entityId)
    setGenBusy(null)
    if (res.success && res.data) {
      downloadBase64(res.data.filename, res.data.base64, res.data.mime)
    } else {
      setGenError(res.error ?? "Failed to generate")
    }
  }

  return (
    <div className="space-y-8">
      {SECTIONS.map((section) => {
        const rows = templates.filter((t) => t.category === section.category)
        return (
          <section key={section.category} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{section.label[lang]}</h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setUploadFor(section.category)}
              >
                <Plus className="me-1 size-4" />
                {L.upload[lang]}
              </Button>
            </div>

            {rows.length === 0 ? (
              <p className="text-muted-foreground text-sm">{L.none[lang]}</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {rows.map((tpl) => (
                  <Card key={tpl.id}>
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <FileText className="text-muted-foreground size-4 shrink-0" />
                          <span className="truncate font-medium">
                            {tpl.name}
                          </span>
                        </div>
                        {tpl.isDefault && (
                          <Badge
                            variant="secondary"
                            className="shrink-0 text-xs"
                          >
                            {L.default[lang]}
                          </Badge>
                        )}
                      </div>

                      <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        <span>
                          {tpl.mergeFields.length} {L.fields[lang]}
                        </span>
                        {!tpl.isDefault && (
                          <button
                            className="hover:text-foreground inline-flex items-center gap-1"
                            onClick={() => handleSetDefault(tpl.id)}
                            disabled={isPending}
                          >
                            <Star className="size-3" />
                            {L.setDefault[lang]}
                          </button>
                        )}
                        <button
                          className="hover:text-destructive ms-auto inline-flex items-center"
                          onClick={() => handleDelete(tpl.id)}
                          disabled={isPending}
                          aria-label="delete"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Input
                          value={genId[tpl.id] || ""}
                          onChange={(e) =>
                            setGenId((s) => ({
                              ...s,
                              [tpl.id]: e.target.value,
                            }))
                          }
                          placeholder={section.idHint[lang]}
                          className="h-8 text-xs"
                        />
                        <Button
                          size="sm"
                          className="shrink-0"
                          onClick={() => handleGenerate(tpl.id)}
                          disabled={genBusy === tpl.id}
                        >
                          {genBusy === tpl.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Download className="size-4" />
                          )}
                          {L.generate[lang]}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )
      })}

      {genError && <p className="text-sm text-red-600">{genError}</p>}

      {uploadFor && (
        <UploadTemplateDialog
          category={uploadFor}
          open={!!uploadFor}
          onOpenChange={(o) => !o && setUploadFor(null)}
        />
      )}
    </div>
  )
}
