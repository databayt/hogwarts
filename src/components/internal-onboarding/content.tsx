"use client"

import React, { useCallback, useState } from "react"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { GraduationCap, Loader2, Settings, Shield, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLocale } from "@/components/internationalization/use-locale"

import { checkExistingApplication } from "./actions"
import type { OnboardingRole } from "./config"
import { ONBOARDING_ROLES } from "./config"
import { OnboardingProvider, useOnboarding } from "./use-onboarding"

// =============================================================================
// ROLE ICONS
// =============================================================================

const ROLE_ICONS = {
  teacher: GraduationCap,
  staff: Users,
  admin: Shield,
  student: GraduationCap,
} as const

// =============================================================================
// LANDING CONTENT (with provider)
// =============================================================================

interface JoinLandingContentProps {
  schoolId: string
  schoolName: string
  schoolLogo?: string | null
  subdomain: string
}

export function JoinLandingContent({
  schoolId,
  schoolName,
  schoolLogo,
  subdomain,
}: JoinLandingContentProps) {
  return (
    <OnboardingProvider schoolId={schoolId} subdomain={subdomain}>
      <JoinLandingInner
        schoolName={schoolName}
        schoolLogo={schoolLogo}
        subdomain={subdomain}
      />
    </OnboardingProvider>
  )
}

// =============================================================================
// INNER COMPONENT (uses context)
// =============================================================================

interface JoinLandingInnerProps {
  schoolName: string
  schoolLogo?: string | null
  subdomain: string
}

function JoinLandingInner({
  schoolName,
  schoolLogo,
  subdomain,
}: JoinLandingInnerProps) {
  const router = useRouter()
  const { locale } = useLocale()
  const { setRole, setAutoFillData, schoolId } = useOnboarding()

  const [selectedRole, setSelectedRole] = useState<OnboardingRole | null>(null)
  const [studentEmail, setStudentEmail] = useState("")
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [emailChecked, setEmailChecked] = useState(false)
  const [autoFillFound, setAutoFillFound] = useState(false)

  const handleRoleSelect = (role: OnboardingRole) => {
    setSelectedRole(role)
    setEmailChecked(false)
    setAutoFillFound(false)
    setStudentEmail("")
  }

  const handleCheckEmail = useCallback(async () => {
    if (!studentEmail) return
    setCheckingEmail(true)
    const result = await checkExistingApplication(schoolId, studentEmail)
    setCheckingEmail(false)
    setEmailChecked(true)

    if (result.success && result.found && result.data) {
      setAutoFillData(result.data)
      setAutoFillFound(true)
    }
  }, [studentEmail, schoolId, setAutoFillData])

  const handleContinue = () => {
    if (!selectedRole) return
    setRole(selectedRole)
    router.push(`/${locale}/s/${subdomain}/join/personal`)
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

      {/* Student Email Check */}
      {selectedRole === "student" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Did you already apply through admissions?
            </CardTitle>
            <CardDescription>
              Enter your email to auto-fill your information from your admission
              application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="student-email" className="sr-only">
                  Email
                </Label>
                <Input
                  id="student-email"
                  type="email"
                  placeholder="your@email.com"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                onClick={handleCheckEmail}
                disabled={!studentEmail || checkingEmail}
              >
                {checkingEmail ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Check"
                )}
              </Button>
            </div>
            {emailChecked && autoFillFound && (
              <p className="text-sm text-green-600">
                Application found! Your information will be pre-filled.
              </p>
            )}
            {emailChecked && !autoFillFound && (
              <p className="text-muted-foreground text-sm">
                No admitted application found for this email. You can still
                proceed manually.
              </p>
            )}
          </CardContent>
        </Card>
      )}

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
