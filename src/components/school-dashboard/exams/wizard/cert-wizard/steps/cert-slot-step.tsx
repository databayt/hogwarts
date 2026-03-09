"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { CERT_VARIANT_REGISTRY } from "@/components/school-dashboard/grades/templates/composition/registry"
import type { CertSlotName } from "@/components/school-dashboard/grades/templates/composition/types"

import { VariantThumbnail } from "../../atoms/variant-thumbnail"
import { MiniCertMockup } from "../atoms/mini-cert-mockup"
import { useCertWizard } from "../context/cert-wizard-provider"
import { CERT_SLOT_ACTION_MAP, type CertWizardAction } from "../types"

const SLOT_STATE_KEY_MAP: Record<CertSlotName, string> = {
  header: "headerVariant",
  title: "titleVariant",
  recipient: "recipientVariant",
  body: "bodyVariant",
  scores: "scoresVariant",
  signatures: "signaturesVariant",
  footer: "footerVariant",
}

interface CertSlotStepProps {
  slotName: CertSlotName
  lang: string
}

export function CertSlotStep({ slotName, lang }: CertSlotStepProps) {
  const { state, dispatch } = useCertWizard()
  const isAr = lang === "ar"

  const variants = CERT_VARIANT_REGISTRY[slotName]
  const stateKey = SLOT_STATE_KEY_MAP[slotName]
  const currentVariant = state[stateKey as keyof typeof state] as string
  const actionType = CERT_SLOT_ACTION_MAP[slotName] as CertWizardAction["type"]

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">
          {isAr ? "اختر النمط" : "Choose a variant"}
        </h3>
        <p className="text-muted-foreground text-sm">
          {isAr
            ? "اختر النمط الأنسب لهذا القسم من الشهادة"
            : "Select the best variant for this certificate section"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Object.entries(variants).map(([key, entry]) => (
          <div key={key} className="flex flex-col items-center gap-2">
            <VariantThumbnail
              state={key === currentVariant ? "selected" : "idle"}
              size="lg"
              label={entry.label[isAr ? "ar" : "en"]}
              onClick={() =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                dispatch({ type: actionType, payload: key } as any)
              }
            >
              <MiniCertMockup slot={slotName} variant={key} />
            </VariantThumbnail>
            <p className="text-muted-foreground max-w-[120px] text-center text-xs">
              {entry.description[isAr ? "ar" : "en"]}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
