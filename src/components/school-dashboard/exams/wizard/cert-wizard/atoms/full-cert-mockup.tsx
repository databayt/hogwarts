// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Full certificate mockup combining all 7 slots in landscape layout.
 * Includes decoration indicators (border, corners, seal, watermark).
 */

import { cn } from "@/lib/utils"

import type { CertDecorationConfig, CertWizardState } from "../types"
import { renderCertSlotMockup } from "./mini-cert-mockup"

interface FullCertMockupProps {
  headerVariant?: string
  titleVariant?: string
  recipientVariant?: string
  bodyVariant?: string
  scoresVariant?: string
  signaturesVariant?: string
  footerVariant?: string
  decorations?: CertDecorationConfig
  className?: string
}

export function FullCertMockup({
  headerVariant = "crest",
  titleVariant = "elegant",
  recipientVariant = "centered",
  bodyVariant = "achievement",
  scoresVariant = "badge-row",
  signaturesVariant = "dual",
  footerVariant = "verification",
  decorations,
  className,
}: FullCertMockupProps) {
  const borderEnabled = decorations?.border?.enabled ?? true
  const borderStyle = decorations?.border?.style ?? "gold"
  const cornerEnabled = decorations?.cornerOrnaments?.enabled ?? true
  const sealEnabled = decorations?.seal?.enabled ?? false
  const watermarkEnabled = decorations?.watermark?.enabled ?? false
  const watermarkText = decorations?.watermark?.text ?? ""

  const borderColorClass =
    borderStyle === "gold"
      ? "border-amber-400/60"
      : borderStyle === "silver"
        ? "border-zinc-400/60"
        : borderStyle === "blue"
          ? "border-blue-400/60"
          : "border-primary/40"

  return (
    <div
      className={cn(
        "relative flex aspect-[297/210] w-full flex-col gap-1 rounded bg-white p-2 dark:bg-zinc-950",
        borderEnabled ? `border-2 ${borderColorClass}` : "border",
        className
      )}
    >
      {/* Corner ornaments */}
      {cornerEnabled && (
        <>
          <div
            className={cn(
              "absolute start-1 top-1 h-2 w-2 rounded-ss-sm border-s-2 border-t-2",
              borderColorClass
            )}
          />
          <div
            className={cn(
              "absolute end-1 top-1 h-2 w-2 rounded-se-sm border-e-2 border-t-2",
              borderColorClass
            )}
          />
          <div
            className={cn(
              "absolute start-1 bottom-1 h-2 w-2 rounded-es-sm border-s-2 border-b-2",
              borderColorClass
            )}
          />
          <div
            className={cn(
              "absolute end-1 bottom-1 h-2 w-2 rounded-ee-sm border-e-2 border-b-2",
              borderColorClass
            )}
          />
        </>
      )}

      {/* Watermark overlay */}
      {watermarkEnabled && watermarkText && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-muted-foreground/10 rotate-[-30deg] text-[10px] font-bold tracking-widest uppercase">
            {watermarkText}
          </span>
        </div>
      )}

      {/* Seal indicator */}
      {sealEnabled && (
        <div className="bg-primary/10 border-primary/30 absolute end-3 bottom-3 flex h-4 w-4 items-center justify-center rounded-full border">
          <div className="bg-primary/20 h-2 w-2 rounded-full" />
        </div>
      )}

      {/* Slots */}
      <div className="px-1">
        {renderCertSlotMockup("header", headerVariant)}
      </div>
      <div className="px-1">{renderCertSlotMockup("title", titleVariant)}</div>
      <div className="px-1">
        {renderCertSlotMockup("recipient", recipientVariant)}
      </div>
      <div className="flex-1 px-1">
        {renderCertSlotMockup("body", bodyVariant)}
      </div>
      <div className="px-1">
        {renderCertSlotMockup("scores", scoresVariant)}
      </div>
      <div className="px-1">
        {renderCertSlotMockup("signatures", signaturesVariant)}
      </div>
      <div className="px-1">
        {renderCertSlotMockup("footer", footerVariant)}
      </div>
    </div>
  )
}

/** Helper to create FullCertMockup from wizard state */
export function FullCertMockupFromState({
  state,
  className,
}: {
  state: CertWizardState
  className?: string
}) {
  return (
    <FullCertMockup
      headerVariant={state.headerVariant}
      titleVariant={state.titleVariant}
      recipientVariant={state.recipientVariant}
      bodyVariant={state.bodyVariant}
      scoresVariant={state.scoresVariant}
      signaturesVariant={state.signaturesVariant}
      footerVariant={state.footerVariant}
      decorations={state.decorations}
      className={className}
    />
  )
}
