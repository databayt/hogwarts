"use client"

import React from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"
import { useLocale } from "@/components/internationalization/use-locale"

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
  const { isRTL } = useLocale()

  const steps: Step[] = [
    {
      number: 1,
      title: dictionary.steps.step1.title,
      description: dictionary.steps.step1.description,
      illustration:
        "https://www-cdn.anthropic.com/images/4zrzovbb/website/5dfb835ad3cbbf76b85824e969146eac20329e72-1000x1000.svg",
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
    const startTimestamp = new Date().toISOString()
    console.log("🚀 [DEBUG] handleGetStarted called", {
      startTimestamp,
      currentIsCreating: isCreating,
      location: "overview-page",
    })

    if (isCreating) {
      console.log("⚠️ [DEBUG] Already creating, ignoring click", {
        isCreating,
        timestamp: new Date().toISOString(),
      })
      return
    }

    console.log("🔄 [DEBUG] Setting isCreating to true", {
      previousState: isCreating,
      timestamp: new Date().toISOString(),
    })
    setIsCreating(true)

    // Check if we have a real school ID from query params or sessionStorage
    const schoolIdFromParams = searchParams.get("schoolId")
    const schoolIdFromSession = sessionStorage.getItem("currentSchoolId")
    const schoolId = schoolIdFromParams || schoolIdFromSession
    console.log("🔍 [DEBUG] School ID sources:", {
      fromParams: schoolIdFromParams,
      fromSession: schoolIdFromSession,
      final: schoolId,
    })

    if (schoolId) {
      console.log("✅ [DEBUG] Using existing schoolId, redirecting...")
      // Use the real school ID that was just created
      router.push(`/${lang}/onboarding/${schoolId}/about-school`)
    } else {
      console.log("🏗️ [DEBUG] No schoolId, creating new school...")
      // Create a new school record first
      try {
        console.log("📦 [DEBUG] Importing initializeSchoolSetup...")
        const { initializeSchoolSetup } =
          await import("@/components/onboarding/actions")

        console.log("🏗️ [DEBUG] Calling initializeSchoolSetup...")
        const result = await initializeSchoolSetup()

        console.log("📋 [DEBUG] initializeSchoolSetup result:", {
          success: result.success,
          hasData: !!result.data,
          schoolId: result.data?.id,
          schoolName: result.data?.name,
          error: result.error,
          resultTimestamp: new Date().toISOString(),
        })

        if (result.success && result.data) {
          console.log("✅ [DEBUG] School created successfully:", {
            schoolId: result.data.id,
            schoolName: result.data.name,
            hasRedirectHint: !!result.data._redirect,
            redirectHint: result.data._redirect,
            sessionRefreshRequired: result.data._sessionRefreshRequired,
            timestamp: new Date().toISOString(),
          })

          // PRODUCTION-READY: Force session refresh to get new schoolId in JWT immediately
          // This is critical for the atomic transaction flow to work correctly
          if (result.data._sessionRefreshRequired) {
            console.log("🔄 [DEBUG] Refreshing session to sync schoolId...")
            try {
              await updateSession()
              console.log("✅ [DEBUG] Session refreshed successfully")
            } catch (sessionError) {
              console.warn(
                "⚠️ [DEBUG] Session refresh failed, continuing with redirect:",
                sessionError
              )
            }
          }

          // Use the redirect hint from the server if available
          const redirectPath =
            result.data._redirect ||
            `/${lang}/onboarding/${result.data.id}/about-school`
          console.log("🔄 [DEBUG] Executing redirect:", {
            targetUrl: redirectPath,
            redirectMethod: "router.push",
            timestamp: new Date().toISOString(),
          })

          // Use router.push for faster client-side navigation (session is now synced)
          router.push(redirectPath)
        } else {
          console.error("❌ [DEBUG] Failed to create school:", {
            error: result.error,
            success: result.success,
            hasData: !!result.data,
            errorTimestamp: new Date().toISOString(),
          })

          // Fallback to temporary ID if school creation fails
          const tempId = `draft-${Date.now()}`
          console.log("🔄 [DEBUG] Using fallback draft redirect:", {
            tempId,
            redirectTarget: `/${lang}/onboarding/${tempId}/about-school`,
            fallbackTimestamp: new Date().toISOString(),
          })
          router.push(`/${lang}/onboarding/${tempId}/about-school`)
        }
      } catch (error) {
        console.error("❌ [DEBUG] Exception in handleGetStarted:", error)
        // Fallback to temporary ID if there's an error
        const tempId = `draft-${Date.now()}`
        console.log("🔄 [DEBUG] Exception fallback redirect to draft:", tempId)
        router.push(`/${lang}/onboarding/${tempId}/about-school`)
      } finally {
        console.log("🏁 [DEBUG] Setting isCreating to false")
        setIsCreating(false)
      }
    }
  }

  return (
    <div className={`flex h-full flex-col px-20 ${isRTL ? "rtl" : "ltr"}`}>
      <div className="flex flex-1 items-center">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-2">
            {/* Left Side - Title */}
            <div>
              <h2
                className={`text-4xl font-bold tracking-tight ${isRTL ? "text-right" : "text-left"}`}
              >
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
                  className={`flex items-start justify-between gap-6 ${isRTL ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`flex flex-1 gap-3 ${isRTL ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div className="flex-shrink-0">
                      <h4 className="text-foreground">{step.number}.</h4>
                    </div>
                    <div className={isRTL ? "text-right" : "text-left"}>
                      <h4 className="mb-1 font-semibold">{step.title}</h4>
                      <p>{step.description}</p>
                    </div>
                  </div>
                  <div
                    className={`hidden flex-shrink-0 md:flex ${isRTL ? "justify-start" : "justify-end"}`}
                  >
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

      {/* Bottom Section with HR and Button */}
      <div className="mx-auto w-full max-w-7xl">
        <Separator className="w-full" />
        <div className={`flex py-4 ${isRTL ? "justify-start" : "justify-end"}`}>
          <Button onClick={handleGetStarted} disabled={isCreating}>
            {isCreating ? (
              <>
                <Skeleton className="me-2 h-4 w-4" />
                {dictionary.creatingSchool}
              </>
            ) : (
              dictionary.getStarted
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default StepsOverviewClient
