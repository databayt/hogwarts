// @ts-nocheck
"use client"

import * as React from "react"

import { ButtonGroup } from "@/components/atom/button-group"
import { CardForm } from "@/components/atom/card-form"
import { LabeledInput } from "@/components/atom/labeled-input"
import { LabeledSelect } from "@/components/atom/labeled-select"
import { LabeledTextarea } from "@/components/atom/labeled-textarea"
import type { getDictionary } from "@/components/internationalization/dictionaries"

const areaOptions = [
  { value: "team", label: "Team" },
  { value: "billing", label: "Billing" },
  { value: "account", label: "Account" },
  { value: "deployments", label: "Deployments" },
  { value: "support", label: "Support" },
]

const severityOptions = [
  { value: "1", label: "Severity 1 (Highest)" },
  { value: "2", label: "Severity 2" },
  { value: "3", label: "Severity 3" },
  { value: "4", label: "Severity 4 (Lowest)" },
]

interface CardsReportIssueProps {
  dictionary?: Awaited<ReturnType<typeof getDictionary>>
}

export function CardsReportIssue({ dictionary }: CardsReportIssueProps) {
  return (
    <CardForm
      title="Report an issue"
      description="What area are you having problems with?"
      dir={dictionary?.locale === "ar" ? "rtl" : "ltr"}
      footer={<ButtonGroup primaryLabel="Submit" secondaryLabel="Cancel" />}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <LabeledSelect
          label="Area"
          options={areaOptions}
          defaultValue="billing"
        />
        <LabeledSelect
          label="Security Level"
          options={severityOptions}
          defaultValue="2"
          placeholder="Select level"
          triggerClassName="line-clamp-1 truncate"
        />
      </div>
      <LabeledInput label="Subject" placeholder="I need help with..." />
      <LabeledTextarea
        label="Description"
        placeholder="Please include all information relevant to your issue."
      />
    </CardForm>
  )
}
