"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { DEFAULT_CERT_COMPOSITION } from "@/components/school-dashboard/grades/templates/composition/defaults"
import { certRegionPresetToComposition } from "@/components/school-dashboard/grades/templates/composition/region-mapping"
import {
  getAllCertPresetIds,
  getCertRegionPreset,
} from "@/components/school-dashboard/grades/templates/presets"

import { GalleryCard } from "../../atoms/gallery-card"
import { FullCertMockup } from "../atoms/full-cert-mockup"
import { useCertWizard } from "../context/cert-wizard-provider"
import {
  DEFAULT_CERT_DECORATIONS,
  type CertDecorationConfig,
  type CertWizardState,
} from "../types"

export function GalleryStep({ lang }: { lang: string }) {
  const { state, dispatch } = useCertWizard()
  const isAr = lang === "ar"

  const presetIds = getAllCertPresetIds()

  function applyPreset(presetId: string | null) {
    dispatch({ type: "SET_PRESET", payload: presetId })

    if (!presetId) {
      // Blank preset — reset to defaults
      dispatch({
        type: "APPLY_PRESET",
        payload: {
          slots: DEFAULT_CERT_COMPOSITION.slots,
          decorations:
            DEFAULT_CERT_COMPOSITION.decorations as CertDecorationConfig,
        },
      })
      return
    }

    const preset = getCertRegionPreset(presetId)
    if (!preset) return

    const overrides = certRegionPresetToComposition(preset)
    const mergedSlots = {
      ...DEFAULT_CERT_COMPOSITION.slots,
      ...overrides.slots,
    }
    const mergedDecorations = {
      ...DEFAULT_CERT_COMPOSITION.decorations,
      ...overrides.decorations,
    } as CertDecorationConfig

    dispatch({
      type: "APPLY_PRESET",
      payload: { slots: mergedSlots, decorations: mergedDecorations },
    })
  }

  function getPresetMockupProps(presetId: string): Partial<CertWizardState> {
    const preset = getCertRegionPreset(presetId)
    if (!preset) return {}
    const overrides = certRegionPresetToComposition(preset)
    return {
      headerVariant:
        overrides.slots?.header ?? DEFAULT_CERT_COMPOSITION.slots.header,
      titleVariant:
        overrides.slots?.title ?? DEFAULT_CERT_COMPOSITION.slots.title,
      recipientVariant:
        overrides.slots?.recipient ?? DEFAULT_CERT_COMPOSITION.slots.recipient,
      bodyVariant: overrides.slots?.body ?? DEFAULT_CERT_COMPOSITION.slots.body,
      scoresVariant:
        overrides.slots?.scores ?? DEFAULT_CERT_COMPOSITION.slots.scores,
      signaturesVariant:
        overrides.slots?.signatures ??
        DEFAULT_CERT_COMPOSITION.slots.signatures,
      footerVariant:
        overrides.slots?.footer ?? DEFAULT_CERT_COMPOSITION.slots.footer,
      decorations: {
        ...DEFAULT_CERT_COMPOSITION.decorations,
        ...overrides.decorations,
      } as CertDecorationConfig,
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">
          {isAr ? "اختر نمطاً إقليمياً" : "Choose a Regional Preset"}
        </h3>
        <p className="text-muted-foreground text-sm">
          {isAr
            ? "ابدأ بنمط إقليمي أو ابدأ من الصفر"
            : "Start with a regional preset or start from scratch"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {/* Blank option */}
        <GalleryCard
          state={state.selectedPresetId === null ? "selected" : "idle"}
          size="lg"
          onClick={() => applyPreset(null)}
        >
          <div className="p-3">
            <FullCertMockup
              headerVariant={DEFAULT_CERT_COMPOSITION.slots.header}
              titleVariant={DEFAULT_CERT_COMPOSITION.slots.title}
              recipientVariant={DEFAULT_CERT_COMPOSITION.slots.recipient}
              bodyVariant={DEFAULT_CERT_COMPOSITION.slots.body}
              scoresVariant={DEFAULT_CERT_COMPOSITION.slots.scores}
              signaturesVariant={DEFAULT_CERT_COMPOSITION.slots.signatures}
              footerVariant={DEFAULT_CERT_COMPOSITION.slots.footer}
              decorations={DEFAULT_CERT_DECORATIONS}
            />
          </div>
          <div className="border-t p-2 text-center">
            <p className="text-xs font-medium">{isAr ? "فارغ" : "Blank"}</p>
          </div>
        </GalleryCard>

        {/* Regional presets */}
        {presetIds.map((id) => {
          const preset = getCertRegionPreset(id)
          if (!preset) return null
          const mockupProps = getPresetMockupProps(id)

          return (
            <GalleryCard
              key={id}
              state={state.selectedPresetId === id ? "selected" : "idle"}
              size="lg"
              onClick={() => applyPreset(id)}
            >
              <div className="p-3">
                <FullCertMockup
                  headerVariant={mockupProps.headerVariant}
                  titleVariant={mockupProps.titleVariant}
                  recipientVariant={mockupProps.recipientVariant}
                  bodyVariant={mockupProps.bodyVariant}
                  scoresVariant={mockupProps.scoresVariant}
                  signaturesVariant={mockupProps.signaturesVariant}
                  footerVariant={mockupProps.footerVariant}
                  decorations={mockupProps.decorations}
                />
              </div>
              <div className="border-t p-2 text-center">
                <p className="text-xs font-medium">
                  {preset.name[isAr ? "ar" : "en"]}
                </p>
              </div>
            </GalleryCard>
          )
        })}
      </div>
    </div>
  )
}
