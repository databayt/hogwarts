"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { saveCertificateComposition } from "../actions"
import { FullCertMockupFromState } from "../atoms/full-cert-mockup"
import { useCertWizard } from "../context/cert-wizard-provider"

export function PreviewStep({
  lang,
  schoolId,
}: {
  lang: string
  schoolId: string
}) {
  const { state, clearDraft } = useCertWizard()
  const router = useRouter()
  const isAr = lang === "ar"
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)

    try {
      const result = await saveCertificateComposition({
        id: state.existingConfigId ?? undefined,
        name: state.name,
        type: state.certificateType,
        description: state.description || undefined,
        templateStyle: state.themeStyle,
        orientation: state.orientation,
        pageSize: state.pageSize,
        titleText: state.titleText,
        titleTextAr: state.titleTextAr || undefined,
        bodyTemplate: state.bodyTemplate,
        bodyTemplateAr: state.bodyTemplateAr || undefined,
        minPercentage: state.minPercentage,
        minGrade: state.minGrade || undefined,
        topPercentile: state.topPercentile,
        signatures: state.signatures,
        useSchoolLogo: state.useSchoolLogo,
        borderStyle: state.decorations.border.style ?? "gold",
        enableVerification: state.enableVerification,
        verificationPrefix: state.verificationPrefix || undefined,
        compositionConfig: JSON.parse(
          JSON.stringify({
            slots: {
              header: state.headerVariant,
              title: state.titleVariant,
              recipient: state.recipientVariant,
              body: state.bodyVariant,
              scores: state.scoresVariant,
              signatures: state.signaturesVariant,
              footer: state.footerVariant,
            },
            decorations: state.decorations,
            slotProps: {},
          })
        ),
        regionPreset: state.selectedPresetId,
      })

      if (result.success) {
        clearDraft()
        router.push(`/${lang}/exams/certificates`)
      } else {
        setError(result.error ?? "Failed to save")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const slotSummary = [
    { en: "Header", ar: "الرأس", value: state.headerVariant },
    { en: "Title", ar: "العنوان", value: state.titleVariant },
    { en: "Recipient", ar: "المستلم", value: state.recipientVariant },
    { en: "Body", ar: "المحتوى", value: state.bodyVariant },
    { en: "Scores", ar: "الدرجات", value: state.scoresVariant },
    { en: "Signatures", ar: "التوقيعات", value: state.signaturesVariant },
    { en: "Footer", ar: "التذييل", value: state.footerVariant },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">
          {isAr ? "معاينة وحفظ" : "Preview & Save"}
        </h3>
        <p className="text-muted-foreground text-sm">
          {isAr
            ? "راجع الإعدادات واحفظ القالب"
            : "Review settings and save the template"}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Summary */}
        <div className="space-y-4">
          {/* Basic info */}
          <div className="space-y-2 rounded-lg border p-4">
            <p className="text-sm font-medium">
              {isAr ? "المعلومات الأساسية" : "Basic Info"}
            </p>
            <div className="text-sm">
              <span className="text-muted-foreground">
                {isAr ? "الاسم: " : "Name: "}
              </span>
              {state.name || (
                <span className="text-destructive">
                  {isAr ? "مطلوب" : "Required"}
                </span>
              )}
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">
                {isAr ? "النوع: " : "Type: "}
              </span>
              {state.certificateType}
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">
                {isAr ? "النمط: " : "Theme: "}
              </span>
              {state.themeStyle}
            </div>
            {state.selectedPresetId && (
              <div className="text-sm">
                <span className="text-muted-foreground">
                  {isAr ? "النمط الإقليمي: " : "Preset: "}
                </span>
                {state.selectedPresetId}
              </div>
            )}
          </div>

          {/* Slot selections */}
          <div className="space-y-2 rounded-lg border p-4">
            <p className="text-sm font-medium">
              {isAr ? "أقسام الشهادة" : "Certificate Sections"}
            </p>
            <div className="flex flex-wrap gap-2">
              {slotSummary.map((slot) => (
                <Badge key={slot.en} variant="secondary">
                  {isAr ? slot.ar : slot.en}: {slot.value}
                </Badge>
              ))}
            </div>
          </div>

          {/* Decorations */}
          <div className="space-y-2 rounded-lg border p-4">
            <p className="text-sm font-medium">
              {isAr ? "الزخارف" : "Decorations"}
            </p>
            <div className="flex flex-wrap gap-2">
              {state.decorations.border.enabled && (
                <Badge variant="outline">
                  {isAr ? "إطار" : "Border"}: {state.decorations.border.style}
                </Badge>
              )}
              {state.decorations.cornerOrnaments.enabled && (
                <Badge variant="outline">{isAr ? "أركان" : "Corners"}</Badge>
              )}
              {state.decorations.seal.enabled && (
                <Badge variant="outline">{isAr ? "ختم" : "Seal"}</Badge>
              )}
              {state.decorations.watermark.enabled && (
                <Badge variant="outline">
                  {isAr ? "علامة مائية" : "Watermark"}
                </Badge>
              )}
              {state.decorations.ribbon.enabled && (
                <Badge variant="outline">{isAr ? "شريط" : "Ribbon"}</Badge>
              )}
            </div>
          </div>

          {/* Print */}
          <div className="space-y-2 rounded-lg border p-4">
            <p className="text-sm font-medium">{isAr ? "الطباعة" : "Print"}</p>
            <div className="text-sm">
              {state.pageSize} / {state.orientation}
            </div>
          </div>

          {/* Save */}
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={saving || !state.name.trim()}
          >
            {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {state.existingConfigId
              ? isAr
                ? "تحديث القالب"
                : "Update Template"
              : isAr
                ? "حفظ القالب"
                : "Save Template"}
          </Button>
        </div>

        {/* Certificate preview */}
        <div className="flex items-start justify-center">
          <div className="w-full max-w-md">
            <FullCertMockupFromState state={state} />
          </div>
        </div>
      </div>
    </div>
  )
}
