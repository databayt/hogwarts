"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import type { DocumentTemplateCategory } from "@prisma/client"
import { AlertTriangle, Check, Loader2, Upload } from "lucide-react"

import { ACTION_ERRORS } from "@/lib/action-errors"
import { actionErrorMessage } from "@/lib/resolve-action-error"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUpload } from "@/components/file/upload/use-upload"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"

import { createDocumentTemplate, type CreatedTemplate } from "./actions"
import { STARTER_CATEGORIES } from "./config"
import { FIELD_VOCAB } from "./field-vocab"
import { StarterButton } from "./starter-button"

const DOCX_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

interface Props {
  category: DocumentTemplateCategory
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UploadTemplateDialog({ category, open, onOpenChange }: Props) {
  const { locale } = useLocale()
  const lang = locale === "ar" ? "ar" : "en"
  const { dictionary } = useDictionary()
  const d = dictionary?.school?.documents?.dialog
  const router = useRouter()
  const [name, setName] = useState("")
  const [stored, setStored] = useState<CreatedTemplate | null>(null)
  // Set when the file was REFUSED because its tags do not compile. `tags` names
  // the ones to fix, and is empty for errors that name no single tag.
  const [rejected, setRejected] = useState<{ tags: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { upload, isUploading } = useUpload({
    category: "document",
    folder: `documents/templates/${category.toLowerCase()}`,
    access: "public",
    allowedTypes: [DOCX_TYPE],
    maxSize: 10 * 1024 * 1024,
    onError: (e) => setError(e),
    onSuccess: async (result) => {
      setSaving(true)
      setError(null)
      const res = await createDocumentTemplate({
        category,
        name: name.trim() || result.originalName,
        fileUrl: result.url,
      })
      setSaving(false)
      if (res.success && res.data) {
        setStored(res.data)
        router.refresh()
        return
      }
      // A template whose tags do not compile is refused rather than stored, and
      // gets its own screen — it is the one failure a school MUST act on.
      if (res.error === ACTION_ERRORS.TEMPLATE_INVALID) {
        setRejected({ tags: res.details ?? "" })
        return
      }
      setError(
        actionErrorMessage(
          res.error,
          dictionary,
          d?.saveFailed ?? "Could not save the template."
        )
      )
    },
  })

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setStored(null)
    setRejected(null)
    void upload(file)
  }

  const busy = isUploading || saving
  const vocab = FIELD_VOCAB[category] ?? []
  const hasStarter = STARTER_CATEGORIES.includes(category)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{d?.title}</DialogTitle>
          <DialogDescription>{d?.desc}</DialogDescription>
        </DialogHeader>

        {rejected ? (
          // Refused, not stored: this file cannot fill at all. Naming the
          // offending tag is the difference between a fixable Word edit and a
          // school re-uploading the same broken file.
          <div className="space-y-3">
            <div className="border-destructive/40 bg-destructive/5 space-y-2 rounded-lg border p-3">
              <p className="text-destructive flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="size-4" />
                {d?.brokenTitle}
              </p>
              <p className="text-muted-foreground text-xs">{d?.brokenBody}</p>
              {rejected.tags && (
                <p className="text-muted-foreground text-xs">
                  {d?.brokenTags}{" "}
                  <code dir="ltr" className="inline-block font-medium">
                    {rejected.tags}
                  </code>
                </p>
              )}
              {hasStarter && (
                <StarterButton category={category} variant="outline" />
              )}
            </div>
            <Button onClick={() => onOpenChange(false)} className="w-full">
              {d?.done}
            </Button>
          </div>
        ) : stored ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
              <Check className="size-4" />
              {d?.uploaded}
            </div>

            {stored.mergeFields.length > 0 ? (
              <div>
                <p className="text-muted-foreground mb-1 text-xs">
                  {d?.detected}
                </p>
                <div className="flex flex-wrap gap-1">
                  {stored.mergeFields.map((f) => {
                    // A tag this category has no data for compiles fine and
                    // fills BLANK — the badge is the only place that shows it.
                    const unknown = stored.unknownFields.includes(f)
                    return (
                      <Badge
                        key={f}
                        variant={unknown ? "outline" : "secondary"}
                        dir="ltr"
                        className="gap-1 text-xs"
                        title={unknown ? d?.unknownTag : d?.knownTag}
                      >
                        {unknown && (
                          <AlertTriangle className="size-2.5 text-amber-600" />
                        )}
                        {f}
                      </Badge>
                    )
                  })}
                </div>
                {stored.unknownFields.length > 0 && (
                  <p className="mt-2 text-xs text-amber-600">
                    {d?.unknownBody}
                  </p>
                )}
              </div>
            ) : (
              // A template with no tags is stored happily and then fills as a
              // blank copy of itself — the failure is invisible until a school
              // prints it, so say so here and hand over a working file.
              <div className="border-destructive/40 bg-destructive/5 space-y-2 rounded-lg border p-3">
                <p className="text-destructive flex items-center gap-2 text-sm font-medium">
                  <AlertTriangle className="size-4" />
                  {d?.noTagsTitle}
                </p>
                <p className="text-muted-foreground text-xs">
                  {d?.noTagsBody}{" "}
                  {/* dir=ltr: braces are bidi-NEUTRAL, so inside Arabic prose
                      `{{examTitle}}` reorders and a school types back what it
                      saw — the exact failure this dialog is here to prevent. */}
                  <code dir="ltr" className="inline-block">
                    {"{{examTitle}}"}
                  </code>
                </p>
                {hasStarter && (
                  <StarterButton category={category} variant="outline" />
                )}
              </div>
            )}

            {stored.singleBraceMarkers.length > 0 && (
              // Compiles, so nothing above complains — but under `{{ }}`
              // delimiters these are plain text: they PRINT into the paper and
              // their body is dropped. Silent until a school hands it out.
              <div className="space-y-2 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
                <p className="flex items-center gap-2 text-sm font-medium text-amber-600">
                  <AlertTriangle className="size-4" />
                  {d?.singleBraceTitle}
                </p>
                <p className="text-muted-foreground text-xs">
                  {d?.singleBraceBody}{" "}
                  <code dir="ltr" className="inline-block">
                    {"{{#questions}} … {{/questions}}"}
                  </code>
                </p>
                <div className="flex flex-wrap gap-1">
                  {stored.singleBraceMarkers.map((m) => (
                    <Badge
                      key={m}
                      variant="outline"
                      dir="ltr"
                      className="text-[10px]"
                    >
                      {m}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={() => onOpenChange(false)} className="w-full">
              {d?.done}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tpl-name">{d?.name}</Label>
              <Input
                id="tpl-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={d?.namePlaceholder}
                disabled={busy}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tpl-file">{d?.pickFile}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="tpl-file"
                  type="file"
                  accept=".docx"
                  onChange={onFile}
                  disabled={busy}
                />
                {busy && (
                  <Loader2 className="text-muted-foreground size-4 animate-spin" />
                )}
              </div>
            </div>

            {hasStarter && (
              <div className="bg-muted/40 flex items-center justify-between gap-3 rounded-lg border p-3">
                <p className="text-muted-foreground text-xs">
                  {d?.starterHint}
                </p>
                <StarterButton category={category} variant="outline" />
              </div>
            )}

            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground mb-2 text-xs font-medium">
                <Upload className="me-1 inline size-3" />
                {d?.available}
              </p>
              <div className="flex flex-wrap gap-1">
                {vocab.map((f) => (
                  <Badge
                    key={f.tag}
                    variant="outline"
                    // dir=ltr: a tag is code. Under RTL the neutral `#` migrates
                    // across the braces and `{{#sections}}` READS as
                    // `{{sections#}}` — a school types what it sees, and that
                    // tag silently never matches.
                    dir="ltr"
                    className="inline-block text-[10px]"
                    title={lang === "ar" ? f.labelAr : f.labelEn}
                  >
                    {f.loop ? `{{#${f.tag}}}` : `{{${f.tag}}}`}
                  </Badge>
                ))}
              </div>
              <p className="text-muted-foreground mt-2 text-[11px]">
                {d?.loopHint}{" "}
                <code dir="ltr" className="inline-block">
                  {"{{#questions}} … {{/questions}}"}
                </code>
              </p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
