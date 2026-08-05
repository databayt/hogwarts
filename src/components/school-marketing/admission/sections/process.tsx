// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { AnthropicIcons } from "@/components/icons"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { SectionContainer } from "../shared/section-container"

interface AdmissionProcessProps {
  lang: Locale
  dictionary?: Dictionary
}

export function AdmissionProcess({ lang, dictionary }: AdmissionProcessProps) {
  const dict =
    (
      dictionary as unknown as {
        school?: {
          admission?: { sections?: { process?: Record<string, string> } }
        }
      }
    )?.school?.admission?.sections?.process ?? {}

  const steps = [
    {
      icon: AnthropicIcons.Book,
      title: dict.submitApplication || "Submit Application",
      description:
        dict.submitApplicationDesc ||
        "Complete our online application form with all required documents",
    },
    {
      icon: AnthropicIcons.Checklist,
      title: dict.campusTour || "Campus Tour",
      description:
        dict.campusTourDesc ||
        "Experience our amazing facilities with a guided tour",
    },
    {
      icon: AnthropicIcons.Chat,
      title: dict.meetGreet || "Meet & Greet",
      description:
        dict.meetGreetDesc ||
        "Connect with our admissions team and faculty members",
    },
    {
      icon: AnthropicIcons.Sparkle,
      title: dict.joinFamily || "Join Family",
      description:
        dict.joinFamilyDesc ||
        "Complete enrollment and begin your educational journey with us",
    },
  ]

  return (
    <SectionContainer>
      <div className="mb-16 text-center">
        <p className="eyebrow band-muted mb-3">
          {dict.eyebrow || "How it works"}
        </p>
        <h2 className="font-heading mb-4 text-3xl font-bold text-neutral-900 md:text-4xl">
          {dict.title || "Admission Process"}
        </h2>
        <p className="band-muted mx-auto max-w-2xl text-lg">
          {dict.subtitle ||
            "Four simple steps to join our educational community"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
        {steps.map((step, index) => (
          <div key={index} className="relative rounded-3xl bg-white p-6 md:p-8">
            {/* Step Number */}
            <span className="absolute end-6 top-6 text-4xl font-light text-neutral-200">
              {index + 1}
            </span>

            {/* Icon */}
            <step.icon className="mb-4 h-8 w-8 text-neutral-900" />

            {/* Content */}
            <h3 className="font-heading mb-2 text-lg font-semibold text-neutral-900">
              {step.title}
            </h3>
            <p className="text-sm text-neutral-600">{step.description}</p>
          </div>
        ))}
      </div>
    </SectionContainer>
  )
}
