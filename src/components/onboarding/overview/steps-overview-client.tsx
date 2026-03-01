"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"
import { useLocale } from "@/components/internationalization/use-locale"

import TemplateGallery from "./template-gallery"

interface Step {
  number: number
  title: string
  description: string
  illustration: string
}

interface StepsOverviewClientProps {
  dictionary: Dictionary["school"]["onboarding"]["overview"]
  lang: Locale
}

const StepsOverviewClient: React.FC<StepsOverviewClientProps> = ({
  dictionary,
  lang,
}) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { update: updateSession } = useSession()
  const [isCreating, setIsCreating] = React.useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<
    string | undefined
  >()
  const { isRTL } = useLocale()

  const isTemplateMode = searchParams.get("template") === "true"

  const steps: Step[] = [
    {
      number: 1,
      title: dictionary.steps.step1.title,
      description: dictionary.steps.step1.description,
      illustration:
        "https://www-cdn.anthropic.com/images/4zrzovbb/website/521a945a74f2d25262db4a002073aaeec9bc1919-1000x1000.svg",
    },
    {
      number: 2,
      title: dictionary.steps.step2.title,
      description: dictionary.steps.step2.description,
      illustration:
        "https://www-cdn.anthropic.com/images/4zrzovbb/website/521a945a74f2d25262db4a002073aaeec9bc1919-1000x1000.svg",
    },
    {
      number: 3,
      title: dictionary.steps.step3.title,
      description: dictionary.steps.step3.description,
      illustration:
        "https://www-cdn.anthropic.com/images/4zrzovbb/website/0321b0ecbbf53535e93be1310ae1935157bcebdd-1000x1000.svg",
    },
  ]

  const handleGetStarted = async () => {
    if (isCreating) {
      return
    }

    setIsCreating(true)

    // Check if we have a real school ID from query params or sessionStorage
    const schoolIdFromParams = searchParams.get("schoolId")
    const schoolIdFromSession = sessionStorage.getItem("currentSchoolId")
    const rawSchoolId = schoolIdFromParams || schoolIdFromSession
    const schoolId =
      rawSchoolId && rawSchoolId !== "undefined" ? rawSchoolId : null

    if (schoolId) {
      // Use the real school ID that was just created
      router.push(`/${lang}/onboarding/${schoolId}/about-school`)
    } else {
      // Create a new school record first
      try {
        const { initializeSchoolSetup } =
          await import("@/components/onboarding/actions")

        const result = await initializeSchoolSetup(selectedTemplateId)

        if (result.success && result.data) {
          // PRODUCTION-READY: Force session refresh to get new schoolId in JWT immediately
          // This is critical for the atomic transaction flow to work correctly
          if (result.data._sessionRefreshRequired) {
            try {
              await updateSession()
            } catch (sessionError) {
              console.warn(
                "Session refresh failed, continuing with redirect:",
                sessionError
              )
            }
          }

          // Use the redirect hint from the server if available
          const redirectPath =
            result.data._redirect ||
            `/${lang}/onboarding/${result.data.id}/about-school`

          // Use router.push for faster client-side navigation (session is now synced)
          router.push(redirectPath)
        } else {
          console.error("Failed to create school:", result.error)

          // Fallback to temporary ID if school creation fails
          const tempId = `draft-${Date.now()}`
          router.push(`/${lang}/onboarding/${tempId}/about-school`)
        }
      } catch (error) {
        console.error("Exception in handleGetStarted:", error)
        // Fallback to temporary ID if there's an error
        const tempId = `draft-${Date.now()}`
        router.push(`/${lang}/onboarding/${tempId}/about-school`)
      } finally {
        setIsCreating(false)
      }
    }
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col pb-24">
      <div className="flex flex-1 items-center">
        <div className="w-full">
          <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-2">
            {/* Left Side - Title */}
            <div>
              <h2 className="text-start text-4xl font-bold tracking-tight">
                {dictionary.title.split("\n").map((line, index) => (
                  <React.Fragment key={index}>
                    {line}
                    {index < dictionary.title.split("\n").length - 1 && <br />}
                  </React.Fragment>
                ))}
              </h2>
            </div>

            {/* Right Side - Steps */}
            <div className="space-y-6">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="flex items-start justify-between gap-6 rtl:flex-row-reverse"
                >
                  <div className="flex flex-1 gap-3 rtl:flex-row-reverse">
                    <div className="flex-shrink-0">
                      <h4 className="text-foreground">{step.number}.</h4>
                    </div>
                    <div className="text-start">
                      <h4 className="mb-1 font-semibold">{step.title}</h4>
                      <p>{step.description}</p>
                    </div>
                  </div>
                  <div className="hidden flex-shrink-0 justify-end md:flex rtl:justify-start">
                    <div className="relative h-14 w-14 overflow-hidden">
                      <Image
                        src={step.illustration}
                        alt={step.title}
                        fill
                        sizes="56px"
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Template gallery - shown when ?template=true */}
      {isTemplateMode && (
        <div className="mt-8">
          <TemplateGallery
            onSelect={setSelectedTemplateId}
            selectedId={selectedTemplateId}
            dictionary={dictionary}
          />
        </div>
      )}

      {/* Fixed footer - matches FormFooter positioning */}
      <footer className="bg-background fixed start-0 end-0 bottom-0 px-4 py-3 sm:px-6 sm:py-4 md:px-12 lg:px-20">
        <Separator className="mx-auto mb-3 w-full max-w-5xl sm:mb-4" />
        <div className="mx-auto flex w-full max-w-5xl justify-end rtl:justify-start">
          <Button onClick={handleGetStarted} disabled={isCreating}>
            {isCreating ? (
              <>
                <Spinner className="me-2" />
                {dictionary.creatingSchool}
              </>
            ) : (
              dictionary.getStarted
            )}
          </Button>
        </div>
      </footer>
    </div>
  )
}

export default StepsOverviewClient
