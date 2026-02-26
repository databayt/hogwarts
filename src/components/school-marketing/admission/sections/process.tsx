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
      <div className="mb-16">
        <h2 className="font-heading mb-4 text-3xl font-bold md:text-4xl">
          {dict.title || "Admission Process"}
        </h2>
        <p className="text-muted-foreground max-w-2xl text-lg">
          {dict.subtitle ||
            "Four simple steps to join our educational community"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => (
          <div
            key={index}
            className="group border-border bg-card hover:border-primary/50 relative rounded-lg border p-6 transition-all duration-200 hover:shadow-lg"
          >
            {/* Step Number */}
            <span className="text-muted-foreground/20 group-hover:text-primary/20 absolute end-4 top-4 text-4xl font-light transition-colors">
              {index + 1}
            </span>

            {/* Icon */}
            <step.icon className="text-primary mb-4 h-8 w-8" />

            {/* Content */}
            <h3 className="font-heading mb-2 text-lg font-semibold">
              {step.title}
            </h3>
            <p className="text-muted-foreground text-sm">{step.description}</p>
          </div>
        ))}
      </div>
    </SectionContainer>
  )
}
