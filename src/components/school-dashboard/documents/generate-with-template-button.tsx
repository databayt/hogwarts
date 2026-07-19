"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"
import type { DocumentTemplateCategory } from "@prisma/client"
import { Download, FileText, Loader2 } from "lucide-react"

import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/components/internationalization/use-locale"

import { downloadBase64 } from "./download"
import { generateFromDefaultTemplate } from "./generate"

/**
 * Per-domain "Generate with my uploaded template" button. Fills the school's
 * default `.docx` template of `category` with the entity's data and streams the
 * result to the browser. Reused across certificates, exam papers, and report
 * cards so every screen shares one behaviour (and one failure message when no
 * template has been uploaded yet).
 */
const L = {
  label: { en: "My template", ar: "قالبي" },
  noTemplate: {
    en: "No template uploaded yet. Upload one under Documents first.",
    ar: "لا يوجد قالب مرفوع بعد. ارفع قالبًا من صفحة المستندات أولًا.",
  },
  failed: {
    en: "Could not generate the document.",
    ar: "تعذّر إنشاء المستند.",
  },
} as const

export function GenerateWithTemplateButton({
  category,
  entityId,
  label,
  size = "sm",
  variant = "outline",
  className,
  disabled,
}: {
  category: DocumentTemplateCategory
  entityId: string
  label?: string
  size?: React.ComponentProps<typeof Button>["size"]
  variant?: React.ComponentProps<typeof Button>["variant"]
  className?: string
  disabled?: boolean
}) {
  const { locale } = useLocale()
  const lang = locale === "ar" ? "ar" : "en"
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)

  const handleClick = async () => {
    if (!entityId) return
    setBusy(true)
    const res = await generateFromDefaultTemplate(category, entityId)
    setBusy(false)
    if (res.success && res.data) {
      downloadBase64(res.data.filename, res.data.base64, res.data.mime)
      return
    }
    toast({
      variant: "destructive",
      description:
        res.error === "TEMPLATE_NOT_FOUND"
          ? L.noTemplate[lang]
          : L.failed[lang],
    })
  }

  return (
    <Button
      size={size}
      variant={variant}
      className={className}
      onClick={handleClick}
      disabled={busy || disabled}
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <FileText className="size-4" />
      )}
      <span className="ms-1">{label ?? L.label[lang]}</span>
      <Download className="ms-1 size-3.5" />
    </Button>
  )
}
