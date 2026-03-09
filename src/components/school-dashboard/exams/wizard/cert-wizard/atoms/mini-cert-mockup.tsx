// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * CSS-based miniature certificate preview for variant thumbnails.
 * No PDF rendering — uses styled divs to approximate each slot variant.
 * Landscape orientation matching certificate format.
 */

import { cn } from "@/lib/utils"

interface MiniCertMockupProps {
  slot: string
  variant: string
  className?: string
}

export function MiniCertMockup({
  slot,
  variant,
  className,
}: MiniCertMockupProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col gap-px overflow-hidden p-1",
        className
      )}
    >
      {renderCertSlotMockup(slot, variant)}
    </div>
  )
}

export function renderCertSlotMockup(slot: string, variant: string) {
  switch (slot) {
    case "header":
      return <CertHeaderMockup variant={variant} />
    case "title":
      return <CertTitleMockup variant={variant} />
    case "recipient":
      return <CertRecipientMockup variant={variant} />
    case "body":
      return <CertBodyMockup variant={variant} />
    case "scores":
      return <CertScoresMockup variant={variant} />
    case "signatures":
      return <CertSignaturesMockup variant={variant} />
    case "footer":
      return <CertFooterMockup variant={variant} />
    default:
      return <DefaultCertMockup />
  }
}

// Shared tiny elements
function Line({ w = "100%" }: { w?: string }) {
  return (
    <div
      className="bg-muted-foreground/30 h-[2px] rounded-full"
      style={{ width: w }}
    />
  )
}

function Block({ h = 4, accent }: { h?: number; accent?: boolean }) {
  return (
    <div
      className={cn(
        "w-full rounded-[1px]",
        accent ? "bg-primary/30" : "bg-muted-foreground/20"
      )}
      style={{ height: h }}
    />
  )
}

function Dot({ accent }: { accent?: boolean }) {
  return (
    <div
      className={cn(
        "h-[5px] w-[5px] rounded-full",
        accent ? "bg-primary/40" : "bg-muted-foreground/25"
      )}
    />
  )
}

// Header variants
function CertHeaderMockup({ variant }: { variant: string }) {
  switch (variant) {
    case "crest":
      return (
        <div className="flex flex-col items-center gap-0.5 pt-0.5">
          <Dot accent />
          <Line w="55%" />
          <Line w="35%" />
        </div>
      )
    case "ministry":
      return (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between">
            <Dot accent />
            <Line w="40%" />
            <Dot accent />
          </div>
          <Block h={2} accent />
          <Line w="50%" />
        </div>
      )
    case "bilingual":
      return (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1">
            <div className="flex-1 text-end">
              <Line w="70%" />
            </div>
            <div className="bg-primary/20 h-3 w-px" />
            <div className="flex-1">
              <Line w="70%" />
            </div>
          </div>
          <Block h={2} accent />
        </div>
      )
    case "minimal":
      return (
        <div className="flex flex-col items-center gap-0.5 pt-1">
          <Line w="50%" />
          <Line w="30%" />
        </div>
      )
    default:
      return (
        <div className="flex flex-col items-center gap-0.5 pt-0.5">
          <Dot accent />
          <Line w="55%" />
          <Line w="35%" />
        </div>
      )
  }
}

// Title variants
function CertTitleMockup({ variant }: { variant: string }) {
  switch (variant) {
    case "elegant":
      return (
        <div className="flex flex-col items-center gap-0.5">
          <Line w="20%" />
          <Block h={4} accent />
          <Line w="20%" />
        </div>
      )
    case "modern":
      return (
        <div className="flex flex-col items-center gap-0.5">
          <Block h={5} accent />
          <Line w="40%" />
        </div>
      )
    case "classic":
      return (
        <div className="flex flex-col items-center gap-0.5">
          <Block h={3} accent />
          <Block h={1} />
        </div>
      )
    case "arabic-calligraphy":
      return (
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-0.5">
            <Dot accent />
            <Block h={4} accent />
            <Dot accent />
          </div>
          <Line w="30%" />
        </div>
      )
    default:
      return (
        <div className="flex flex-col items-center gap-0.5">
          <Line w="20%" />
          <Block h={4} accent />
          <Line w="20%" />
        </div>
      )
  }
}

// Recipient variants
function CertRecipientMockup({ variant }: { variant: string }) {
  switch (variant) {
    case "centered":
      return (
        <div className="flex flex-col items-center gap-0.5 py-0.5">
          <Line w="30%" />
          <Block h={3} accent />
          <Line w="25%" />
        </div>
      )
    case "underline":
      return (
        <div className="flex flex-col items-center gap-0.5 py-0.5">
          <Line w="30%" />
          <Block h={3} accent />
          <div className="bg-primary/40 h-px w-[60%]" />
        </div>
      )
    case "framed":
      return (
        <div className="flex flex-col items-center gap-0.5 py-0.5">
          <Line w="30%" />
          <div className="border-primary/30 w-[70%] rounded border p-0.5">
            <Block h={3} accent />
          </div>
        </div>
      )
    case "photo":
      return (
        <div className="flex items-center justify-center gap-1 py-0.5">
          <div className="border-muted-foreground/20 flex h-5 w-4 items-center justify-center rounded border border-dashed">
            <div className="bg-muted-foreground/15 h-2 w-2 rounded-full" />
          </div>
          <div className="flex flex-col gap-0.5">
            <Block h={3} accent />
            <Line w="80%" />
          </div>
        </div>
      )
    default:
      return (
        <div className="flex flex-col items-center gap-0.5 py-0.5">
          <Line w="30%" />
          <Block h={3} accent />
          <Line w="25%" />
        </div>
      )
  }
}

// Body variants
function CertBodyMockup({ variant }: { variant: string }) {
  switch (variant) {
    case "achievement":
      return (
        <div className="flex flex-col items-center gap-0.5 py-0.5">
          <Line w="80%" />
          <Line w="70%" />
          <Line w="60%" />
        </div>
      )
    case "report-summary":
      return (
        <div className="flex flex-col gap-0.5 py-0.5">
          <div className="border-muted-foreground/15 grid grid-cols-3 gap-px border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-muted/50 p-px">
                <Line w="80%" />
              </div>
            ))}
          </div>
        </div>
      )
    case "transcript":
      return (
        <div className="flex flex-col gap-0.5 py-0.5">
          <Block h={2} accent />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Line w="40%" />
              <Line w="15%" />
            </div>
          ))}
        </div>
      )
    case "custom":
      return (
        <div className="flex flex-col items-center gap-0.5 py-0.5">
          <div className="border-muted-foreground/20 w-[80%] rounded border border-dashed p-1">
            <Line w="60%" />
            <div className="mt-0.5">
              <Line w="40%" />
            </div>
          </div>
        </div>
      )
    default:
      return (
        <div className="flex flex-col items-center gap-0.5 py-0.5">
          <Line w="80%" />
          <Line w="70%" />
          <Line w="60%" />
        </div>
      )
  }
}

// Scores variants
function CertScoresMockup({ variant }: { variant: string }) {
  switch (variant) {
    case "badge-row":
      return (
        <div className="flex items-center justify-center gap-1 py-0.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-primary/20 flex h-3 w-3 items-center justify-center rounded-full"
            >
              <div className="bg-primary/40 h-1 w-1 rounded-full" />
            </div>
          ))}
        </div>
      )
    case "table-grid":
      return (
        <div className="py-0.5">
          <div className="border-muted-foreground/15 grid grid-cols-4 gap-px border">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-muted/30 p-px">
                <Line w="70%" />
              </div>
            ))}
          </div>
        </div>
      )
    case "gauge":
      return (
        <div className="flex items-center justify-center py-0.5">
          <div className="border-primary/30 h-4 w-4 rounded-full border-2 border-b-transparent" />
        </div>
      )
    case "hidden":
      return <div className="py-0.5" />
    default:
      return (
        <div className="flex items-center justify-center gap-1 py-0.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-primary/20 flex h-3 w-3 items-center justify-center rounded-full"
            >
              <div className="bg-primary/40 h-1 w-1 rounded-full" />
            </div>
          ))}
        </div>
      )
  }
}

// Signatures variants
function CertSignaturesMockup({ variant }: { variant: string }) {
  switch (variant) {
    case "dual":
      return (
        <div className="flex justify-between py-0.5">
          <div className="flex flex-col items-center gap-px">
            <Line w="100%" />
            <Line w="70%" />
          </div>
          <div className="flex flex-col items-center gap-px">
            <Line w="100%" />
            <Line w="70%" />
          </div>
        </div>
      )
    case "triple":
      return (
        <div className="flex justify-between py-0.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-px">
              <Line w="100%" />
              <Line w="60%" />
            </div>
          ))}
        </div>
      )
    case "single":
      return (
        <div className="flex flex-col items-center gap-px py-0.5">
          <Line w="30%" />
          <Line w="20%" />
        </div>
      )
    case "stamps":
      return (
        <div className="flex justify-center gap-2 py-0.5">
          <div className="border-primary/30 h-4 w-4 rounded-full border" />
          <div className="border-primary/30 h-4 w-4 rounded-full border" />
        </div>
      )
    default:
      return (
        <div className="flex justify-between py-0.5">
          <div className="flex flex-col items-center gap-px">
            <Line w="100%" />
            <Line w="70%" />
          </div>
          <div className="flex flex-col items-center gap-px">
            <Line w="100%" />
            <Line w="70%" />
          </div>
        </div>
      )
  }
}

// Footer variants
function CertFooterMockup({ variant }: { variant: string }) {
  switch (variant) {
    case "verification":
      return (
        <div className="mt-auto flex items-center justify-between">
          <div className="border-muted-foreground/20 h-3 w-3 rounded border" />
          <Line w="30%" />
          <Line w="20%" />
        </div>
      )
    case "minimal":
      return (
        <div className="mt-auto flex justify-center">
          <Line w="20%" />
        </div>
      )
    case "dated":
      return (
        <div className="mt-auto flex flex-col items-center gap-0.5">
          <Block h={2} accent />
          <Line w="30%" />
        </div>
      )
    case "numbered":
      return (
        <div className="mt-auto flex flex-col items-center gap-0.5">
          <Line w="25%" />
          <Block h={2} accent />
        </div>
      )
    default:
      return (
        <div className="mt-auto flex items-center justify-between">
          <div className="border-muted-foreground/20 h-3 w-3 rounded border" />
          <Line w="30%" />
          <Line w="20%" />
        </div>
      )
  }
}

function DefaultCertMockup() {
  return (
    <div className="flex flex-col gap-0.5 p-0.5">
      <Block h={3} accent />
      <Line w="70%" />
      <Line w="50%" />
    </div>
  )
}
