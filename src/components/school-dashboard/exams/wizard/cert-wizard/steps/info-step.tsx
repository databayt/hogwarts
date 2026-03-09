"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

import { WizardCard } from "../../atoms/wizard-card"
import { useCertWizard } from "../context/cert-wizard-provider"
import type { CertificateType, SignatureEntry } from "../types"

const CERT_TYPES: { value: CertificateType; en: string; ar: string }[] = [
  { value: "ACHIEVEMENT", en: "Achievement", ar: "إنجاز" },
  { value: "COMPLETION", en: "Completion", ar: "إتمام" },
  { value: "PARTICIPATION", en: "Participation", ar: "مشاركة" },
  { value: "MERIT", en: "Merit", ar: "جدارة" },
  { value: "EXCELLENCE", en: "Excellence", ar: "تميز" },
  { value: "CUSTOM", en: "Custom", ar: "مخصص" },
]

const THEME_STYLES = [
  { value: "elegant", en: "Elegant", ar: "أنيق" },
  { value: "modern", en: "Modern", ar: "عصري" },
  { value: "classic", en: "Classic", ar: "كلاسيكي" },
] as const

export function InfoStep({ lang }: { lang: string }) {
  const { state, dispatch } = useCertWizard()
  const isAr = lang === "ar"

  function update(payload: Record<string, unknown>) {
    dispatch({ type: "SET_INFO", payload: payload as Partial<typeof state> })
  }

  function addSignature() {
    dispatch({
      type: "SET_SIGNATURES_DATA",
      payload: [...state.signatures, { name: "", title: "" }],
    })
  }

  function removeSignature(idx: number) {
    dispatch({
      type: "SET_SIGNATURES_DATA",
      payload: state.signatures.filter((_, i) => i !== idx),
    })
  }

  function updateSignature(
    idx: number,
    field: keyof SignatureEntry,
    value: string
  ) {
    const updated = state.signatures.map((s, i) =>
      i === idx ? { ...s, [field]: value } : s
    )
    dispatch({ type: "SET_SIGNATURES_DATA", payload: updated })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">
          {isAr ? "معلومات الشهادة" : "Certificate Info"}
        </h3>
        <p className="text-muted-foreground text-sm">
          {isAr
            ? "أدخل المعلومات الأساسية للشهادة"
            : "Enter the basic certificate information"}
        </p>
      </div>

      {/* Basic info */}
      <WizardCard state="idle" className="cursor-default space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{isAr ? "اسم القالب" : "Template Name"} *</Label>
            <Input
              value={state.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder={
                isAr ? "مثال: شهادة نهاية العام" : "e.g., End of Year Award"
              }
            />
          </div>
          <div className="space-y-2">
            <Label>{isAr ? "نوع الشهادة" : "Certificate Type"}</Label>
            <Select
              value={state.certificateType}
              onValueChange={(v) =>
                update({ certificateType: v as CertificateType })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CERT_TYPES.map((ct) => (
                  <SelectItem key={ct.value} value={ct.value}>
                    {isAr ? ct.ar : ct.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>{isAr ? "الوصف" : "Description"}</Label>
          <Textarea
            value={state.description}
            onChange={(e) => update({ description: e.target.value })}
            rows={2}
            placeholder={
              isAr ? "وصف اختياري للقالب" : "Optional template description"
            }
          />
        </div>

        <div className="space-y-2">
          <Label>{isAr ? "النمط البصري" : "Theme Style"}</Label>
          <div className="flex gap-3">
            {THEME_STYLES.map((ts) => (
              <WizardCard
                key={ts.value}
                size="sm"
                state={state.themeStyle === ts.value ? "selected" : "idle"}
                onClick={() => update({ themeStyle: ts.value })}
              >
                <p className="text-center text-sm font-medium">
                  {isAr ? ts.ar : ts.en}
                </p>
              </WizardCard>
            ))}
          </div>
        </div>
      </WizardCard>

      {/* Title & Body templates */}
      <WizardCard state="idle" className="cursor-default space-y-4">
        <p className="text-sm font-medium">
          {isAr ? "نصوص الشهادة" : "Certificate Text"}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{isAr ? "عنوان (إنجليزي)" : "Title (English)"}</Label>
            <Input
              value={state.titleText}
              onChange={(e) => update({ titleText: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>{isAr ? "عنوان (عربي)" : "Title (Arabic)"}</Label>
            <Input
              value={state.titleTextAr}
              onChange={(e) => update({ titleTextAr: e.target.value })}
              dir="rtl"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{isAr ? "نص (إنجليزي)" : "Body (English)"}</Label>
            <Textarea
              value={state.bodyTemplate}
              onChange={(e) => update({ bodyTemplate: e.target.value })}
              rows={3}
            />
            <p className="text-muted-foreground text-xs">
              {isAr
                ? "استخدم {{studentName}} {{grade}} {{subject}}"
                : "Use {{studentName}} {{grade}} {{subject}}"}
            </p>
          </div>
          <div className="space-y-2">
            <Label>{isAr ? "نص (عربي)" : "Body (Arabic)"}</Label>
            <Textarea
              value={state.bodyTemplateAr}
              onChange={(e) => update({ bodyTemplateAr: e.target.value })}
              rows={3}
              dir="rtl"
            />
          </div>
        </div>
      </WizardCard>

      {/* Eligibility */}
      <WizardCard state="idle" className="cursor-default space-y-4">
        <p className="text-sm font-medium">
          {isAr ? "معايير الأهلية" : "Eligibility Criteria"}
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>{isAr ? "الحد الأدنى %" : "Min Percentage"}</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={state.minPercentage ?? ""}
              onChange={(e) =>
                update({
                  minPercentage: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>{isAr ? "الحد الأدنى للدرجة" : "Min Grade"}</Label>
            <Input
              value={state.minGrade}
              onChange={(e) => update({ minGrade: e.target.value })}
              placeholder="e.g., B"
            />
          </div>
          <div className="space-y-2">
            <Label>{isAr ? "أعلى نسبة %" : "Top Percentile"}</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={state.topPercentile ?? ""}
              onChange={(e) =>
                update({
                  topPercentile: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
          </div>
        </div>
      </WizardCard>

      {/* Verification & Branding */}
      <WizardCard state="idle" className="cursor-default space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">
              {isAr ? "التحقق" : "Verification"}
            </p>
            <p className="text-muted-foreground text-xs">
              {isAr
                ? "تمكين رمز التحقق والرمز QR"
                : "Enable verification code and QR"}
            </p>
          </div>
          <Switch
            checked={state.enableVerification}
            onCheckedChange={(v) => update({ enableVerification: v })}
          />
        </div>
        {state.enableVerification && (
          <div className="space-y-2">
            <Label>{isAr ? "بادئة الرمز" : "Verification Prefix"}</Label>
            <Input
              value={state.verificationPrefix}
              onChange={(e) => update({ verificationPrefix: e.target.value })}
              placeholder="CERT-"
            />
          </div>
        )}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            {isAr ? "شعار المدرسة" : "School Logo"}
          </p>
          <Switch
            checked={state.useSchoolLogo}
            onCheckedChange={(v) => update({ useSchoolLogo: v })}
          />
        </div>
      </WizardCard>

      {/* Signatures */}
      <WizardCard state="idle" className="cursor-default space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            {isAr ? "التوقيعات" : "Signatures"}
          </p>
          <Button variant="outline" size="sm" onClick={addSignature}>
            <Plus className="me-1 h-3.5 w-3.5" />
            {isAr ? "إضافة" : "Add"}
          </Button>
        </div>
        {state.signatures.map((sig, idx) => (
          <div key={idx} className="flex items-end gap-3">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">{isAr ? "الاسم" : "Name"}</Label>
              <Input
                value={sig.name}
                onChange={(e) => updateSignature(idx, "name", e.target.value)}
                placeholder={isAr ? "الاسم" : "Name"}
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-xs">{isAr ? "المنصب" : "Title"}</Label>
              <Input
                value={sig.title}
                onChange={(e) => updateSignature(idx, "title", e.target.value)}
                placeholder={isAr ? "المنصب" : "Title"}
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeSignature(idx)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {state.signatures.length === 0 && (
          <p className="text-muted-foreground text-center text-xs">
            {isAr ? "لم تتم إضافة توقيعات بعد" : "No signatures added yet"}
          </p>
        )}
      </WizardCard>
    </div>
  )
}
