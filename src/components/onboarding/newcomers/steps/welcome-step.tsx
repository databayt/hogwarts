"use client"

import * as React from "react"
import { Clock, Mail, UserCheck } from "lucide-react"
import { useFormContext } from "react-hook-form"

import { FormStepContainer, FormSuccess } from "@/components/form"

import { NEWCOMER_ROLES } from "../config"
import type { NewcomerFormData } from "../validation"

/**
 * Welcome Step
 *
 * Final step of newcomers onboarding.
 * Shows success message and next steps.
 */
export function WelcomeStep({ onComplete }: { onComplete?: () => void }) {
  const form = useFormContext<NewcomerFormData>()
  const role = form.watch("role")
  const givenName = form.watch("givenName")

  const roleLabel =
    NEWCOMER_ROLES.find((r) => r.value === role)?.label || "Member"

  return (
    <FormStepContainer maxWidth="md">
      <FormSuccess
        title={`Welcome, ${givenName}!`}
        description={`Your ${roleLabel.toLowerCase()} application has been submitted successfully. A school administrator will review your application shortly.`}
        showConfetti
        confettiColors={["#22c55e", "#3b82f6", "#8b5cf6"]}
        onComplete={onComplete}
        nextSteps={[
          {
            label: "Check your email",
            description: "You'll receive confirmation at your email address",
            icon: Mail,
          },
          {
            label: "Pending approval",
            description:
              "A school admin will review and approve your application",
            icon: Clock,
          },
          {
            label: "Get started",
            description: "Once approved, you can access the school portal",
            icon: UserCheck,
          },
        ]}
      />
    </FormStepContainer>
  )
}
