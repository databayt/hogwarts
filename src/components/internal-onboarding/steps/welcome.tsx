"use client"

import React from "react"
import { useParams } from "next/navigation"
import { Clock, Mail, UserCheck } from "lucide-react"

import { FormSuccess } from "@/components/form/template/success"
import { useLocale } from "@/components/internationalization/use-locale"

interface WelcomeStepProps {
  schoolName: string
  subdomain: string
}

export function WelcomeStep({ schoolName, subdomain }: WelcomeStepProps) {
  const { locale } = useLocale()
  const params = useParams()

  return (
    <div className="mx-auto max-w-2xl py-8">
      <FormSuccess
        title="Welcome Aboard!"
        description={`Your application to join ${schoolName} has been submitted successfully. An administrator will review your application shortly.`}
        showConfetti
        nextSteps={[
          {
            label: "Check your email",
            description:
              "You will receive a confirmation email with your application details",
            icon: Mail,
          },
          {
            label: "Pending approval",
            description:
              "A school administrator will review and approve your account",
            icon: Clock,
          },
          {
            label: "Get started",
            description:
              "Once approved, you can sign in and access the school platform",
            icon: UserCheck,
          },
        ]}
        onComplete={() => {
          window.location.href = `/${locale}/s/${subdomain}`
        }}
      />
    </div>
  )
}
