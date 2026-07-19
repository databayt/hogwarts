"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"
import { ClipboardCheck, Users, Video } from "lucide-react"

import { cn } from "@/lib/utils"

import type { StreamContentProps } from "../types"

// The real teacher contribution flow this block supports: record → submit for
// review → goes live for enrolled students. Replaces the verbatim Udemy
// "become an instructor" copy + hotlinked Udemy images. Icons are lucide.
const steps = [
  {
    id: "record",
    Icon: Video,
    title: "Record your lesson",
    description:
      "Use your phone or a screen recorder to capture a lesson — no studio needed.",
    tip: "Keep each video focused on one topic so students can find it easily.",
    helpTitle: "How we help you",
    helpText:
      "Upload straight from the propose dialog with a live progress bar; large files stream directly to storage.",
  },
  {
    id: "review",
    Icon: ClipboardCheck,
    title: "Submit for review",
    description:
      "Attach the video to a lesson and send it in. Your school admin reviews it before it goes live.",
    tip: "You'll get a notification the moment it's approved or sent back.",
    helpTitle: "How we help you",
    helpText:
      "Admins see every pending video in one review queue, so nothing waits longer than it needs to.",
  },
  {
    id: "live",
    Icon: Users,
    title: "It goes live for your students",
    description:
      "Once approved, your video appears inside the lesson for every enrolled student.",
    tip: "Replace or update a video any time — students always see the latest version.",
    helpTitle: "How we help you",
    helpText:
      "Progress and quiz results are tracked automatically as students watch your lesson.",
  },
]

export function HowToBeginSection({
  dictionary,
}: Omit<StreamContentProps, "schoolId">) {
  const [activeStep, setActiveStep] = useState(0)
  const ActiveIcon = steps[activeStep].Icon

  return (
    <section className="py-16 sm:py-20 md:py-24">
      {/* Section Title */}
      <div className="mb-12 text-center">
        <h2 className="font-serif text-3xl font-bold md:text-4xl lg:text-5xl">
          {dictionary?.howToBegin?.title || "How to begin"}
        </h2>
      </div>

      {/* Tabs with underline */}
      <div className="mb-16 flex justify-center">
        <div className="border-border inline-flex gap-6 border-b md:gap-12">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(index)}
              className={cn(
                "relative pb-3 text-sm font-semibold transition-colors md:text-lg",
                activeStep === index
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {dictionary?.howToBegin?.[`tab${index + 1}`] || step.title}
              {activeStep === index && (
                <span className="bg-foreground absolute start-0 end-0 bottom-0 h-0.5" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content - Text (40%), Illustration (60%) */}
      <div className="flex flex-col items-center gap-8 md:flex-row md:gap-16">
        {/* Text Content */}
        <div className="space-y-4 text-start md:w-[40%]">
          <p className="text-muted-foreground leading-relaxed">
            {dictionary?.howToBegin?.[`description${activeStep + 1}`] ||
              steps[activeStep].description}
          </p>
          <p className="text-muted-foreground leading-relaxed">
            {dictionary?.howToBegin?.[`tip${activeStep + 1}`] ||
              steps[activeStep].tip}
          </p>

          {/* How we help you */}
          <div className="pt-6">
            <h3 className="text-foreground mb-3 font-bold">
              {dictionary?.howToBegin?.helpTitle || steps[activeStep].helpTitle}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {dictionary?.howToBegin?.[`helpText${activeStep + 1}`] ||
                steps[activeStep].helpText}
            </p>
          </div>
        </div>

        {/* Illustration */}
        <div className="flex justify-center md:w-[60%]">
          <div className="bg-muted flex aspect-video w-full max-w-lg items-center justify-center rounded-xl">
            <ActiveIcon
              className="text-muted-foreground/60 h-24 w-24"
              strokeWidth={1}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
