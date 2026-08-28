"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { GraduationCap, Shield, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useLocale } from "@/components/internationalization/use-locale"

import type { OnboardingRole } from "./config"
import { ONBOARDING_ROLES } from "./config"
import { useOnboarding } from "./use-onboarding"

// =============================================================================
// ROLE ICONS
// =============================================================================

const ROLE_ICONS = {
  teacher: GraduationCap,
  staff: Users,
  admin: Shield,
} as const

// =============================================================================
// LANDING CONTENT (provider comes from layout)
// =============================================================================

interface JoinLandingContentProps {
  schoolName: string
  schoolLogo?: string | null
}

export function JoinLandingContent({
  schoolName,
  schoolLogo,
}: JoinLandingContentProps) {
  const router = useRouter()
  const { locale } = useLocale()
  const { setRole } = useOnboarding()

  const [selectedRole, setSelectedRole] = useState<OnboardingRole | null>(null)

  const handleRoleSelect = (role: OnboardingRole) => {
    setSelectedRole(role)
  }

  const handleContinue = () => {
    if (!selectedRole) return
    setRole(selectedRole)
    router.push(`/${locale}/internal-onboarding/personal`)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        {schoolLogo && (
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
            <Image
              src={schoolLogo}
              alt={schoolName}
              width={64}
              height={64}
              className="rounded-full object-contain"
            />
          </div>
        )}
        <h1 className="text-3xl font-bold">Join {schoolName}</h1>
        <p className="text-muted-foreground mt-2">
          Select your role to get started with the onboarding process
        </p>
      </div>

      {/* Role Selection */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ONBOARDING_ROLES.map((role) => {
          const Icon = ROLE_ICONS[role.value]
          const isSelected = selectedRole === role.value

          return (
            <Card
              key={role.value}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? "border-primary ring-primary/20 ring-2"
                  : "hover:border-primary/50"
              }`}
              onClick={() => handleRoleSelect(role.value)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{role.label}</CardTitle>
                    <CardDescription className="text-xs">
                      {role.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )
        })}
      </div>

      {/*
        Students do not join through this flow -- they apply through the
        admission wizard so they are born from a real `Application` and are
        tracked from an application id onward (the same pipeline every other
        student-creation path funnels into). Point them there rather than
        letting them register as a role here.
      */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">{"Are you a student?"}</CardTitle>
          <CardDescription>
            {"Students join by applying for admission, not through this form."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href={`/${locale}/application`}>{"Apply for admission"}</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Continue Button */}
      {selectedRole && (
        <div className="flex justify-center">
          <Button size="lg" onClick={handleContinue}>
            Continue as{" "}
            {ONBOARDING_ROLES.find((r) => r.value === selectedRole)?.label}
          </Button>
        </div>
      )}
    </div>
  )
}
