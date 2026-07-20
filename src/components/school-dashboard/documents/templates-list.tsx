"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { DocumentTemplate, DocumentTemplateCategory } from "@prisma/client"
import {
  Download,
  FileText,
  Loader2,
  Plus,
  Star,
  Trash2,
  Wand2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { deleteDocumentTemplate, setDefaultTemplate } from "./actions"
import { downloadBase64 } from "./download"
import { generateDocument } from "./generate"
import { UploadTemplateDialog } from "./upload-template-dialog"
import { UseExamTemplateDialog } from "./use-exam-template-dialog"

/** Categories with a data resolver wired (can generate). */
export const RESOLVABLE_SECTIONS: DocumentTemplateCategory[] = [
  "CERTIFICATE",
  "EXAM_PAPER",
  "REPORT_CARD",
]

export function DocumentsManager({
  templates,
  categories = RESOLVABLE_SECTIONS,
}: {
  templates: DocumentTemplate[]
  /** Which category sections to render. Lets /exams and /grades each show their own. */
  categories?: DocumentTemplateCategory[]
}) {
  const { dictionary } = useDictionary()
  const d = dictionary?.school?.documents
  // The dictionary only names the categories that have a resolver wired.
  const sections = d?.sections as Record<string, string | undefined> | undefined
  const idHints = d?.idHint as Record<string, string | undefined> | undefined
  const router = useRouter()
  const [uploadFor, setUploadFor] = useState<DocumentTemplateCategory | null>(
    null
  )
  const [useTemplate, setUseTemplate] = useState<DocumentTemplate | null>(null)
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
      setGenError(res.error ?? d?.generateFailed ?? "Could not generate.")
    }
  }

  return (
    <div className="space-y-8">
      {categories.map((category) => {
        const rows = templates.filter((t) => t.category === category)
        return (
          <section key={category} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {sections?.[category] ?? category}
              </h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setUploadFor(category)}
              >
                <Plus className="me-1 size-4" />
                {d?.upload}
              </Button>
            </div>

            {rows.length === 0 ? (
              <p className="text-muted-foreground text-sm">{d?.none}</p>
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
                            {d?.default}
                          </Badge>
                        )}
                      </div>

                      <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        <span>
                          {tpl.mergeFields.length} {d?.fields}
                        </span>
                        {!tpl.isDefault && (
                          <button
                            className="hover:text-foreground inline-flex items-center gap-1"
                            onClick={() => handleSetDefault(tpl.id)}
                            disabled={isPending}
                          >
                            <Star className="size-3" />
                            {d?.setDefault}
                          </button>
                        )}
                        <button
                          className="hover:text-destructive ms-auto inline-flex items-center"
                          onClick={() => handleDelete(tpl.id)}
                          disabled={isPending}
                          aria-label={d?.delete}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>

                      {category === "EXAM_PAPER" ? (
                        // Exam papers get the guided flow: pick an existing exam
                        // or build one from a blueprint, then fill this template.
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => setUseTemplate(tpl)}
                        >
                          <Wand2 className="size-4" />
                          {d?.use}
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Input
                            value={genId[tpl.id] || ""}
                            onChange={(e) =>
                              setGenId((s) => ({
                                ...s,
                                [tpl.id]: e.target.value,
                              }))
                            }
                            placeholder={idHints?.[category]}
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
                            {d?.generate}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )
      })}

      {genError && <p className="text-destructive text-sm">{genError}</p>}

      {uploadFor && (
        <UploadTemplateDialog
          category={uploadFor}
          open={!!uploadFor}
          onOpenChange={(o) => !o && setUploadFor(null)}
        />
      )}

      {useTemplate && (
        <UseExamTemplateDialog
          template={useTemplate}
          open={!!useTemplate}
          onOpenChange={(o) => !o && setUseTemplate(null)}
        />
      )}
    </div>
  )
}
