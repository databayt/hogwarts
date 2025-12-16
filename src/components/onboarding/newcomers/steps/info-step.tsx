"use client"

import * as React from "react"

import { FormStepContainer, FormStepHeader, TextField } from "@/components/form"

import { NEWCOMER_STEPS } from "../config"

/**
 * Basic Information Step
 *
 * Second step of newcomers onboarding.
 * Collects name, email, and phone.
 */
export function InfoStep() {
  const stepConfig = NEWCOMER_STEPS[1]

  return (
    <FormStepContainer maxWidth="md">
      <FormStepHeader
        stepNumber={2}
        totalSteps={5}
        title={stepConfig?.title || "Basic Information"}
        description={stepConfig?.description}
        showStepIndicator={false}
      />

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            name="givenName"
            label="First Name"
            placeholder="Enter your first name"
            required
          />
          <TextField
            name="surname"
            label="Last Name"
            placeholder="Enter your last name"
            required
          />
        </div>

        <TextField
          name="email"
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          description="We'll send a verification code to this email"
          required
        />

        <TextField
          name="phone"
          label="Phone Number"
          type="tel"
          placeholder="+1 (555) 000-0000"
          description="Optional - for important updates"
        />
      </div>
    </FormStepContainer>
  )
}
