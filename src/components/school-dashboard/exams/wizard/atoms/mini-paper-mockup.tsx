// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * CSS-based miniature paper preview for template variant thumbnails.
 * No PDF rendering — uses styled divs to approximate each section variant.
 */

import { cn } from "@/lib/utils"

interface MiniPaperMockupProps {
  slot: string
  variant: string
  className?: string
}

export function MiniPaperMockup({
  slot,
  variant,
  className,
}: MiniPaperMockupProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col gap-px overflow-hidden p-1",
        className
      )}
    >
      {renderSlotMockup(slot, variant)}
    </div>
  )
}

function renderSlotMockup(slot: string, variant: string) {
  switch (slot) {
    case "header":
      return <HeaderMockup variant={variant} />
    case "footer":
      return <FooterMockup variant={variant} />
    case "studentInfo":
      return <StudentInfoMockup variant={variant} />
    case "instructions":
      return <InstructionsMockup variant={variant} />
    case "answerSheet":
      return <AnswerSheetMockup variant={variant} />
    case "cover":
      return <CoverMockup variant={variant} />
    default:
      return <DefaultMockup />
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
function HeaderMockup({ variant }: { variant: string }) {
  switch (variant) {
    case "ministry":
      return (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between">
            <Dot accent />
            <Line w="40%" />
            <Dot accent />
          </div>
          <Block h={2} accent />
          <Line w="60%" />
          <Line w="40%" />
        </div>
      )
    case "minimal":
      return (
        <div className="flex flex-col items-center gap-0.5 pt-1">
          <Line w="50%" />
          <Line w="30%" />
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
          <Line w="50%" />
        </div>
      )
    case "centered":
      return (
        <div className="flex flex-col items-center gap-0.5 pt-0.5">
          <Dot accent />
          <Line w="55%" />
          <Line w="35%" />
          <Block h={1} accent />
          <Line w="45%" />
        </div>
      )
    default: // standard
      return (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1">
            <Dot accent />
            <div className="flex flex-1 flex-col gap-px">
              <Line w="60%" />
              <Line w="40%" />
            </div>
          </div>
          <Block h={2} accent />
          <Line w="50%" />
        </div>
      )
  }
}

// Footer variants
function FooterMockup({ variant }: { variant: string }) {
  switch (variant) {
    case "disclaimer":
      return (
        <div className="mt-auto flex flex-col gap-0.5">
          <Line w="80%" />
          <Block h={1} />
          <div className="flex justify-between">
            <Line w="20%" />
            <Line w="20%" />
          </div>
        </div>
      )
    case "minimal":
      return (
        <div className="mt-auto flex justify-center">
          <Line w="15%" />
        </div>
      )
    case "grading":
      return (
        <div className="mt-auto flex flex-col gap-0.5">
          <Line w="70%" />
          <div className="flex gap-1">
            <Block h={3} />
            <Block h={3} />
            <Block h={3} />
          </div>
          <div className="flex justify-between">
            <Line w="20%" />
            <Line w="20%" />
          </div>
        </div>
      )
    default: // standard
      return (
        <div className="mt-auto flex flex-col gap-0.5">
          <Block h={1} />
          <div className="flex justify-between">
            <Line w="20%" />
            <Line w="15%" />
            <Line w="20%" />
          </div>
        </div>
      )
  }
}

// Student info variants
function StudentInfoMockup({ variant }: { variant: string }) {
  switch (variant) {
    case "bubble-id":
      return (
        <div className="flex flex-col gap-0.5 rounded border border-dashed p-0.5">
          <div className="flex gap-0.5">
            <Line w="45%" />
            <Line w="45%" />
          </div>
          <div className="mt-0.5 grid grid-cols-4 gap-px">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="bg-muted-foreground/15 h-[3px] rounded-full"
              />
            ))}
          </div>
        </div>
      )
    case "table":
      return (
        <div className="border-primary/30 flex flex-col border">
          <div className="border-primary/20 flex border-b">
            <div className="bg-muted/50 flex-1 border-e p-px">
              <Line w="60%" />
            </div>
            <div className="flex-1 p-px" />
          </div>
          <div className="flex">
            <div className="bg-muted/50 flex-1 border-e p-px">
              <Line w="40%" />
            </div>
            <div className="flex-1 p-px" />
          </div>
        </div>
      )
    case "photo":
      return (
        <div className="flex gap-1 rounded border border-dashed p-0.5">
          <div className="border-muted-foreground/20 flex h-5 w-4 shrink-0 items-center justify-center rounded border border-dashed">
            <div className="bg-muted-foreground/15 h-2 w-2 rounded-full" />
          </div>
          <div className="flex flex-1 flex-col gap-0.5">
            <Line w="70%" />
            <Line w="50%" />
          </div>
        </div>
      )
    default: // standard
      return (
        <div className="flex flex-col gap-0.5 rounded border border-dashed p-0.5">
          <div className="flex gap-1">
            <Line w="45%" />
            <Line w="45%" />
          </div>
          <div className="flex gap-1">
            <Line w="30%" />
            <Line w="30%" />
          </div>
        </div>
      )
  }
}

// Instructions variants
function InstructionsMockup({ variant }: { variant: string }) {
  switch (variant) {
    case "compact":
      return (
        <div className="bg-muted/50 flex justify-between rounded p-0.5">
          <Line w="25%" />
          <Line w="25%" />
          <Line w="25%" />
        </div>
      )
    case "rules":
      return (
        <div className="flex flex-col gap-0.5 rounded border-2 p-0.5">
          <Block h={3} accent />
          <Line w="80%" />
          <Line w="70%" />
          <div className="mt-0.5 rounded bg-red-100 p-px dark:bg-red-950/20">
            <Line w="60%" />
          </div>
        </div>
      )
    case "sectioned":
      return (
        <div className="flex flex-col gap-0.5 rounded border p-0.5">
          <Line w="50%" />
          <div className="flex gap-0.5">
            <Dot accent />
            <Line w="60%" />
          </div>
          <div className="flex gap-0.5">
            <Dot accent />
            <Line w="55%" />
          </div>
        </div>
      )
    default: // standard
      return (
        <div className="flex flex-col gap-0.5 rounded border p-0.5">
          <div className="flex justify-between">
            <Line w="30%" />
            <Line w="25%" />
          </div>
          <Line w="80%" />
          <Line w="70%" />
          <Line w="60%" />
        </div>
      )
  }
}

// Answer sheet variants
function AnswerSheetMockup({ variant }: { variant: string }) {
  switch (variant) {
    case "omr":
      return (
        <div className="flex flex-col gap-0.5 p-0.5">
          <Line w="50%" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-0.5">
              <span className="text-muted-foreground text-[6px]">{i + 1}</span>
              <div className="flex gap-px">
                {["A", "B", "C", "D"].map((l) => (
                  <div
                    key={l}
                    className="border-muted-foreground/30 h-[4px] w-[4px] rounded-full border"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )
    case "grid":
      return (
        <div className="flex flex-col gap-0.5 p-0.5">
          <Line w="40%" />
          <div className="border-muted-foreground/20 grid h-6 grid-cols-5 grid-rows-4 border">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="border-muted-foreground/10 border" />
            ))}
          </div>
        </div>
      )
    default: // standard
      return (
        <div className="flex flex-col gap-0.5 p-0.5">
          <Line w="50%" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-0.5">
              <span className="text-muted-foreground text-[6px]">{i + 1}</span>
              <Block h={2} />
            </div>
          ))}
        </div>
      )
  }
}

// Cover variants
function CoverMockup({ variant }: { variant: string }) {
  switch (variant) {
    case "toc":
      return (
        <div className="flex flex-col items-center gap-0.5 pt-1">
          <Line w="40%" />
          <div className="mt-0.5 flex w-full flex-col gap-px px-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Line w="50%" />
                <Line w="10%" />
              </div>
            ))}
          </div>
        </div>
      )
    case "ministry":
      return (
        <div className="flex flex-col items-center gap-0.5 pt-1">
          <Dot accent />
          <Line w="40%" />
          <Line w="30%" />
          <Block h={1} accent />
          <Line w="50%" />
          <div className="mt-0.5 w-3/4">
            <Block h={6} />
          </div>
        </div>
      )
    default: // standard
      return (
        <div className="flex flex-col items-center gap-0.5 pt-1">
          <Dot accent />
          <Line w="50%" />
          <Block h={1} accent />
          <Line w="40%" />
          <Line w="35%" />
        </div>
      )
  }
}

function DefaultMockup() {
  return (
    <div className="flex flex-col gap-0.5 p-0.5">
      <Block h={3} accent />
      <Line w="70%" />
      <Line w="50%" />
    </div>
  )
}

/**
 * Full page paper mockup combining all sections for gallery cards.
 */
export function FullPaperMockup({
  headerVariant = "standard",
  studentInfoVariant = "standard",
  instructionsVariant = "standard",
  footerVariant = "standard",
  className,
}: {
  headerVariant?: string
  studentInfoVariant?: string
  instructionsVariant?: string
  footerVariant?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex aspect-[210/297] w-full flex-col gap-0.5 rounded border bg-white p-1.5 dark:bg-zinc-950",
        className
      )}
    >
      <HeaderMockup variant={headerVariant} />
      <div className="my-0.5">
        <StudentInfoMockup variant={studentInfoVariant} />
      </div>
      <div className="my-0.5">
        <InstructionsMockup variant={instructionsVariant} />
      </div>
      {/* Question lines */}
      <div className="flex flex-1 flex-col gap-0.5 pt-0.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-0.5">
            <span className="text-muted-foreground text-[6px]">{i + 1}.</span>
            <div className="flex flex-1 flex-col gap-px">
              <Line w="80%" />
              <Line w="60%" />
            </div>
          </div>
        ))}
      </div>
      <FooterMockup variant={footerVariant} />
    </div>
  )
}
