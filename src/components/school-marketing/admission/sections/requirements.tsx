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
        dict.applicationFee || "Application fee",
      ],
    },
  ]

  return (
    <SectionContainer className="bg-muted/30">
      <h2 className="font-heading mb-16 text-3xl font-bold md:text-4xl">
        {dict.title || "Admission Requirements"}
      </h2>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {categories.map((category, index) => (
          <div
            key={index}
            className="bg-card border-border rounded-lg border p-6"
          >
            <category.icon className="text-primary mb-4 h-8 w-8" />
            <h3 className="font-heading mb-4 text-lg font-semibold">
              {category.title}
            </h3>
            <ul className="space-y-3">
              {category.items.map((item, i) => (
                <li
                  key={i}
                  className="text-muted-foreground flex items-start gap-3 text-sm"
                >
                  <span className="bg-primary mt-2 h-1.5 w-1.5 shrink-0 rounded-full" />
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
