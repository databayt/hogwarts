"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { CertWizardProvider } from "./context/cert-wizard-provider"
import { useCertWizardState } from "./hooks/use-cert-wizard-state"
import { useCertWizardSteps } from "./hooks/use-cert-wizard-steps"
import { CertWizardShell } from "./layout/cert-wizard-shell"
import { BodyStep } from "./steps/body-step"
import { DecorationsStep } from "./steps/decorations-step"
import { FooterStep } from "./steps/footer-step"
import { GalleryStep } from "./steps/gallery-step"
import { HeaderStep } from "./steps/header-step"
import { InfoStep } from "./steps/info-step"
import { PreviewStep } from "./steps/preview-step"
import { PrintStep } from "./steps/print-step"
import { RecipientStep } from "./steps/recipient-step"
import { ScoresStep } from "./steps/scores-step"
import { SignaturesStep } from "./steps/signatures-step"
import { TitleStep } from "./steps/title-step"
import type { CertWizardState } from "./types"

export interface ExistingCertConfig {
  id: string
  name: string
  type: string
  description: string | null
  templateStyle: string
  orientation: string
  pageSize: string
  titleText: string
  titleTextAr: string | null
  bodyTemplate: string
  bodyTemplateAr: string | null
  minPercentage: number | null
  minGrade: string | null
  topPercentile: number | null
  signatures: Array<{ name: string; title: string; signatureUrl?: string }>
  useSchoolLogo: boolean
  borderStyle: string
  enableVerification: boolean
  verificationPrefix: string | null
  compositionConfig: Record<string, unknown> | null
  regionPreset: string | null
}

interface CertWizardClientProps {
  lang: Locale
  dictionary: Dictionary
  schoolId: string
  existingConfig?: ExistingCertConfig
}

export function CertWizardClient({
  lang,
  dictionary,
  schoolId,
  existingConfig,
}: CertWizardClientProps) {
  const { state, dispatch, loadDraft, clearDraft } =
    useCertWizardState(schoolId)
  const steps = useCertWizardSteps()
  const [showResume, setShowResume] = useState(false)

  // On mount: check for existing draft or load existing config
  useEffect(() => {
    if (existingConfig) {
      const comp = existingConfig.compositionConfig as {
        slots?: Record<string, string>
        decorations?: CertWizardState["decorations"]
      } | null

      dispatch({
        type: "LOAD_STATE",
        payload: {
          ...state,
          existingConfigId: existingConfig.id,
          name: existingConfig.name,
          description: existingConfig.description || "",
          certificateType:
            existingConfig.type as CertWizardState["certificateType"],
          themeStyle:
            (existingConfig.templateStyle as CertWizardState["themeStyle"]) ||
            "elegant",
          titleText: existingConfig.titleText,
          titleTextAr: existingConfig.titleTextAr || "",
          bodyTemplate: existingConfig.bodyTemplate,
          bodyTemplateAr: existingConfig.bodyTemplateAr || "",
          minPercentage: existingConfig.minPercentage,
          minGrade: existingConfig.minGrade || "",
          topPercentile: existingConfig.topPercentile,
          signatures: existingConfig.signatures || [],
          useSchoolLogo: existingConfig.useSchoolLogo,
          enableVerification: existingConfig.enableVerification,
          verificationPrefix: existingConfig.verificationPrefix || "CERT-",
          pageSize: (existingConfig.pageSize as "A4" | "LETTER") || "A4",
          orientation:
            (existingConfig.orientation as "portrait" | "landscape") ||
            "landscape",
          selectedPresetId: existingConfig.regionPreset,
          headerVariant:
            (comp?.slots?.header as CertWizardState["headerVariant"]) ||
            "crest",
          titleVariant:
            (comp?.slots?.title as CertWizardState["titleVariant"]) ||
            "elegant",
          recipientVariant:
            (comp?.slots?.recipient as CertWizardState["recipientVariant"]) ||
            "centered",
          bodyVariant:
            (comp?.slots?.body as CertWizardState["bodyVariant"]) ||
            "achievement",
          scoresVariant:
            (comp?.slots?.scores as CertWizardState["scoresVariant"]) ||
            "badge-row",
          signaturesVariant:
            (comp?.slots?.signatures as CertWizardState["signaturesVariant"]) ||
            "dual",
          footerVariant:
            (comp?.slots?.footer as CertWizardState["footerVariant"]) ||
            "verification",
          decorations: comp?.decorations || state.decorations,
          currentStep: 0,
        },
      })
    } else {
      const hasDraft = loadDraft()
      if (hasDraft) {
        setShowResume(true)
      }
    }
    // Run only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isAr = lang === "ar"

  // Show resume draft dialog
  if (showResume) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="mx-auto max-w-md space-y-4 p-6 text-center">
          <h2 className="text-lg font-semibold">
            {isAr ? "استئناف المسودة؟" : "Resume Draft?"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {isAr
              ? "لديك مسودة شهادة محفوظة. هل تريد الاستمرار من حيث توقفت؟"
              : "You have a saved certificate draft. Would you like to continue where you left off?"}
          </p>
          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => {
                clearDraft()
                dispatch({
                  type: "LOAD_STATE",
                  payload: {
                    ...state,
                    currentStep: 0,
                    name: "",
                    description: "",
                    existingConfigId: null,
                  },
                })
                setShowResume(false)
              }}
            >
              {isAr ? "بدء جديد" : "Start Fresh"}
            </Button>
            <Button onClick={() => setShowResume(false)}>
              {isAr ? "استئناف" : "Resume"}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Render the active step
  const renderStep = () => {
    const currentStepDef = steps[state.currentStep]
    if (!currentStepDef) return null

    switch (currentStepDef.id) {
      case "gallery":
        return <GalleryStep lang={lang} />
      case "info":
        return <InfoStep lang={lang} />
      case "header":
        return <HeaderStep lang={lang} />
      case "title":
        return <TitleStep lang={lang} />
      case "recipient":
        return <RecipientStep lang={lang} />
      case "body":
        return <BodyStep lang={lang} />
      case "scores":
        return <ScoresStep lang={lang} />
      case "signatures":
        return <SignaturesStep lang={lang} />
      case "footer":
        return <FooterStep lang={lang} />
      case "decorations":
        return <DecorationsStep lang={lang} />
      case "print":
        return <PrintStep lang={lang} />
      case "preview":
        return <PreviewStep lang={lang} schoolId={schoolId} />
      default:
        return null
    }
  }

  return (
    <CertWizardProvider
      value={{
        state,
        dispatch,
        totalSteps: steps.length,
        clearDraft,
      }}
    >
      <CertWizardShell steps={steps} lang={lang}>
        {renderStep()}
      </CertWizardShell>
    </CertWizardProvider>
  )
}
