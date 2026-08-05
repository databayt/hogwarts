// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { AnthropicIcons } from "@/components/icons"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { SectionContainer } from "../shared/section-container"

interface AdmissionRequirementsProps {
  lang: Locale
  dictionary?: Dictionary
}

export function AdmissionRequirements({
  lang,
  dictionary,
}: AdmissionRequirementsProps) {
  const dict =
    (
      dictionary as unknown as {
        school?: {
          admission?: { sections?: { requirements?: Record<string, string> } }
        }
      }
    )?.school?.admission?.sections?.requirements ?? {}

  const categories = [
    {
      title: dict.academicRecords || "Academic Records",
      icon: AnthropicIcons.Archive,
      items: [
        dict.officialTranscripts || "Official transcripts",
        dict.testScores || "Test scores (if applicable)",
        dict.teacherRecommendations || "Teacher recommendations",
      ],
    },
    {
      title: dict.personalInfo || "Personal Information",
      icon: AnthropicIcons.Checklist,
      items: [
        dict.birthCertificate || "Birth certificate",
        dict.immunizationRecords || "Immunization records",
        dict.emergencyContacts || "Emergency contacts",
      ],
    },
    {
      title: dict.applicationForms || "Application Forms",
      icon: AnthropicIcons.Book,
      items: [
        dict.completedForm || "Completed application form",
        dict.parentQuestionnaire || "Parent questionnaire",
        // Applying is always free -- never list a fee here.
        dict.recentPhotograph || "Recent photograph",
      ],
    },
  ]

  return (
    <SectionContainer>
      <div className="mb-16 text-center">
        <p className="eyebrow band-muted mb-3">
          {dict.eyebrow || "What you need"}
        </p>
        <h2 className="font-heading text-3xl font-bold text-neutral-900 md:text-4xl">
          {dict.title || "Admission Requirements"}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
        {categories.map((category, index) => (
          <div key={index} className="rounded-3xl bg-white p-6 md:p-8">
            <category.icon className="mb-4 h-8 w-8 text-neutral-900" />
            <h3 className="font-heading mb-4 text-lg font-semibold text-neutral-900">
              {category.title}
            </h3>
            <ul className="space-y-3">
              {category.items.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-sm text-neutral-600"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-900" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SectionContainer>
  )
}
