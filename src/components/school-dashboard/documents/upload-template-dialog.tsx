"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import type { DocumentTemplateCategory } from "@prisma/client"
import { Check, Loader2, Upload } from "lucide-react"

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
import { useLocale } from "@/components/internationalization/use-locale"

import { createDocumentTemplate } from "./actions"
import { FIELD_VOCAB } from "./field-vocab"

const DOCX_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

const L = {
  title: { en: "Upload a .docx template", ar: "رفع قالب .docx" },
  desc: {
    en: "Your Word template with {{tags}} — we fill it with school data.",
    ar: "قالب Word الخاص بك مع {{tags}} — نملؤه ببيانات المدرسة.",
  },
  name: { en: "Template name", ar: "اسم القالب" },
  namePlaceholder: {
    en: "e.g. Ministry certificate",
    ar: "مثال: شهادة الوزارة",
  },
  pickFile: { en: "Choose .docx file", ar: "اختر ملف .docx" },
  available: { en: "Available fields", ar: "الحقول المتاحة" },
  loopHint: {
    en: "Loops use {#questions}…{/questions} / {#subjects}…{/subjects}.",
    ar: "التكرار يستخدم {#questions}…{/questions} / {#subjects}…{/subjects}.",
  },
  detected: { en: "Detected in your template", ar: "اكتُشف في قالبك" },
  uploaded: { en: "Template saved", ar: "تم حفظ القالب" },
  done: { en: "Done", ar: "تم" },
} as const

interface Props {
  category: DocumentTemplateCategory
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UploadTemplateDialog({ category, open, onOpenChange }: Props) {
  const { locale } = useLocale()
  const lang = locale === "ar" ? "ar" : "en"
  const router = useRouter()
  const [name, setName] = useState("")
  const [detected, setDetected] = useState<string[] | null>(null)
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
        setDetected(res.data.mergeFields)
        router.refresh()
      } else {
        setError(res.error ?? "Failed to save")
      }
    },
  })

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setDetected(null)
    void upload(file)
  }

  const busy = isUploading || saving
  const vocab = FIELD_VOCAB[category] ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{L.title[lang]}</DialogTitle>
          <DialogDescription>{L.desc[lang]}</DialogDescription>
        </DialogHeader>

        {detected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
              <Check className="size-4" />
              {L.uploaded[lang]}
            </div>
            {detected.length > 0 && (
              <div>
                <p className="text-muted-foreground mb-1 text-xs">
                  {L.detected[lang]}
                </p>
                <div className="flex flex-wrap gap-1">
                  {detected.map((f) => (
                    <Badge key={f} variant="secondary" className="text-xs">
                      {f}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <Button onClick={() => onOpenChange(false)} className="w-full">
              {L.done[lang]}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tpl-name">{L.name[lang]}</Label>
              <Input
                id="tpl-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={L.namePlaceholder[lang]}
                disabled={busy}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tpl-file">{L.pickFile[lang]}</Label>
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

            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground mb-2 text-xs font-medium">
                <Upload className="me-1 inline size-3" />
                {L.available[lang]}
              </p>
              <div className="flex flex-wrap gap-1">
                {vocab.map((f) => (
                  <Badge
                    key={f.tag}
                    variant="outline"
                    className="text-[10px]"
                    title={lang === "ar" ? f.labelAr : f.labelEn}
                  >
                    {f.loop ? `{#${f.tag}}` : `{{${f.tag}}}`}
                  </Badge>
                ))}
              </div>
              <p className="text-muted-foreground mt-2 text-[11px]">
                {L.loopHint[lang]}
              </p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
