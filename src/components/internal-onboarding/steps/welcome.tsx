"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useState } from "react"
import { useParams } from "next/navigation"
import {
  Building,
  Check,
  Clock,
  Copy,
  MessageCircle,
  Phone,
  Smartphone,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FormSuccess } from "@/components/form/template/success"
import { useLocale } from "@/components/internationalization/use-locale"

interface WelcomeStepProps {
  schoolName: string
  schoolPhone?: string | null
  schoolEmail?: string | null
  subdomain: string
  refCode?: string
  applicantName?: string
  applicantRole?: string
  applicantPhone?: string
}

function maskPhone(phone: string): string {
  if (phone.length <= 6) return phone
  return phone.slice(0, 4) + "****" + phone.slice(-2)
}

export function WelcomeStep({
  schoolName,
  schoolPhone,
  schoolEmail,
  subdomain,
  refCode,
  applicantName,
  applicantRole,
  applicantPhone,
}: WelcomeStepProps) {
  const { locale } = useLocale()
  const params = useParams()
  const [copied, setCopied] = useState(false)

  const copyRef = () => {
    if (refCode) {
      navigator.clipboard.writeText(refCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const whatsappText = refCode
    ? `${schoolName} - Application submitted. Reference: ${refCode}. Role: ${applicantRole || "N/A"}. Status: Pending approval.`
    : `${schoolName} - Application submitted. Status: Pending approval.`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`

  const contactDescription =
    [schoolPhone, schoolEmail].filter(Boolean).join(" | ") ||
    "Visit the school office"

  const nextSteps = [
    ...(applicantPhone
      ? [
          {
            label: "Check your phone",
            description: `SMS confirmation sent to ${maskPhone(applicantPhone)}`,
            icon: Smartphone,
          },
        ]
      : []),
    {
      label: "Pending admin approval",
      description: "A school administrator will review your application",
      icon: Clock,
    },
    {
      label: "Contact the school",
      description: contactDescription,
      icon: Building,
    },
  ]

  return (
    <div className="mx-auto max-w-2xl py-8">
      <FormSuccess
        title="Welcome Aboard!"
        description={`Your application to join ${schoolName} has been submitted successfully. An administrator will review your application shortly.`}
        showConfetti
        nextSteps={nextSteps}
        onComplete={() => {
          window.location.href = `/${locale}/s/${subdomain}`
        }}
      />

      {/* Reference Card */}
      {refCode && (
        <div className="mt-6 flex justify-center">
          <Card className="border-primary/20 bg-primary/5 w-full max-w-md">
            <CardContent className="space-y-2 p-4 text-center">
              <p className="text-muted-foreground text-sm">
                Application Reference
              </p>
              <p className="font-mono text-2xl font-bold tracking-wider">
                {refCode}
              </p>
              <p className="text-muted-foreground text-xs">
                Save this number for follow-up
              </p>
              <div className="flex justify-center gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={copyRef}>
                  {copied ? (
                    <Check className="mr-1 h-3 w-3" />
                  ) : (
                    <Copy className="mr-1 h-3 w-3" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="mr-1 h-3 w-3" />
                    Share
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
