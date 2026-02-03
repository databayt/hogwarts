"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  ExternalLink,
  GraduationCap,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { getSchoolOnboardingStatus } from "../legal/actions"
import type { OnboardingSchoolData } from "../types"
import SuccessModal from "./success-modal"

interface SchoolData extends Pick<
  OnboardingSchoolData,
  "name" | "domain" | "id"
> {}

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
  id: string
}

// Safe dictionary accessor to avoid TS errors for non-existent keys
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const safeGet = (obj: any, path: string, fallback: string): string => {
  try {
    const keys = path.split(".")
    let result = obj
    for (const key of keys) {
      result = result?.[key]
      if (result === undefined) return fallback
    }
    return typeof result === "string" ? result : fallback
  } catch {
    return fallback
  }
}

export default function CongratulationsContent(props: Props) {
  const { lang, id } = props
  const { dictionary: d } = useDictionary()
  const router = useRouter()
  const schoolId = id
  const [schoolData, setSchoolData] = useState<SchoolData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get root domain from env or derive from hostname
  const getRootDomain = () => {
    // Use env var if available
    if (process.env.NEXT_PUBLIC_ROOT_DOMAIN) {
      return process.env.NEXT_PUBLIC_ROOT_DOMAIN
    }

    // Fallback: derive from current hostname
    const hostname = window.location.hostname

    // Handle localhost
    if (hostname === "localhost" || hostname.includes("localhost")) {
      return "localhost:3000"
    }

    // Handle Vercel preview deployments (tenant---branch.vercel.app)
    if (hostname.includes("vercel.app")) {
      return hostname
    }

    // Handle production (ed.databayt.org → databayt.org)
    // Remove common prefixes like "ed.", "www.", or subdomain
    const parts = hostname.split(".")
    if (parts.length >= 2) {
      // Take last two parts (e.g., databayt.org)
      return parts.slice(-2).join(".")
    }

    return hostname
  }

  useEffect(() => {
    async function fetchSchoolData() {
      try {
        const result = await getSchoolOnboardingStatus(schoolId)
        if (result.success && result.data) {
          setSchoolData(result.data)
        } else {
          const errorMsg = safeGet(
            d,
            "saas-marketing.onboarding.errors.loadFailed",
            "Failed to load school data"
          )
          setError(errorMsg)
          toast.error(errorMsg)
        }
      } catch (err) {
        console.error("Error fetching school data:", err)
        const errorMsg = safeGet(
          d,
          "saas-marketing.onboarding.errors.loadFailed",
          "Failed to load school data"
        )
        setError(errorMsg)
        toast.error(errorMsg)
      } finally {
        setLoading(false)
        // Show the success modal after data is loaded
        setShowSuccessModal(true)
      }
    }
    fetchSchoolData()
  }, [schoolId, d])

  const handleGoToDashboard = () => {
    if (schoolData?.domain) {
      const protocol = window.location.protocol
      const rootDomain = getRootDomain()

      // Handle localhost differently (no subdomain)
      let schoolUrl: string
      if (rootDomain.includes("localhost")) {
        // For localhost, use path-based routing
        schoolUrl = `${protocol}//${rootDomain}/${lang}/s/${schoolData.domain}/dashboard`
      } else {
        // For production/preview, use subdomain
        schoolUrl = `${protocol}//${schoolData.domain}.${rootDomain}/${lang}/dashboard`
      }

      window.location.href = schoolUrl
    }
  }

  // Get display domain
  const getDisplayDomain = () => {
    const rootDomain = getRootDomain()
    if (rootDomain.includes("localhost")) {
      return `localhost:3000/${lang}/s/${schoolData?.domain}`
    }
    return `${schoolData?.domain}.${rootDomain}`
  }

  // i18n helper - use safeGet for dictionary access with fallbacks
  const t = {
    congratulations: safeGet(
      d,
      "saas-marketing.onboarding.success.congratulations",
      "Congratulations!"
    ),
    schoolReady: safeGet(
      d,
      "saas-marketing.onboarding.success.schoolReady",
      "is now set up and ready to go!"
    ),
    yourSchoolUrl: safeGet(
      d,
      "saas-marketing.onboarding.success.yourSchoolUrl",
      "Your school's URL:"
    ),
    goToDashboard: safeGet(
      d,
      "saas-marketing.onboarding.success.goToDashboard",
      "Go to Dashboard"
    ),
    whatsNext: safeGet(
      d,
      "saas-marketing.onboarding.success.whatsNext",
      "What's Next?"
    ),
    inviteTeam: safeGet(
      d,
      "saas-marketing.onboarding.success.inviteTeam",
      "Invite Your Team"
    ),
    inviteTeamDesc: safeGet(
      d,
      "saas-marketing.onboarding.success.inviteTeamDesc",
      "Add teachers, staff, and administrators to your school"
    ),
    addStudents: safeGet(
      d,
      "saas-marketing.onboarding.success.addStudents",
      "Add Students"
    ),
    addStudentsDesc: safeGet(
      d,
      "saas-marketing.onboarding.success.addStudentsDesc",
      "Import student data or add them individually"
    ),
    setUpClasses: safeGet(
      d,
      "saas-marketing.onboarding.success.setUpClasses",
      "Set Up Classes"
    ),
    setUpClassesDesc: safeGet(
      d,
      "saas-marketing.onboarding.success.setUpClassesDesc",
      "Create class schedules and assign teachers"
    ),
    configureSettings: safeGet(
      d,
      "saas-marketing.onboarding.success.configureSettings",
      "Configure Settings"
    ),
    configureSettingsDesc: safeGet(
      d,
      "saas-marketing.onboarding.success.configureSettingsDesc",
      "Customize your school's preferences and policies"
    ),
    quickTips: safeGet(
      d,
      "saas-marketing.onboarding.success.quickTips",
      "Quick Tips"
    ),
    tipPortalLive: safeGet(
      d,
      "saas-marketing.onboarding.success.tipPortalLive",
      "Your school portal is now live at"
    ),
    tipShareUrl: safeGet(
      d,
      "saas-marketing.onboarding.success.tipShareUrl",
      "Share this URL with your staff and parents for easy access"
    ),
    tipHelpCenter: safeGet(
      d,
      "saas-marketing.onboarding.success.tipHelpCenter",
      "Check out the Help Center for guides and tutorials"
    ),
    tipContactSupport: safeGet(
      d,
      "saas-marketing.onboarding.success.tipContactSupport",
      "Contact support if you need any assistance getting started"
    ),
    reviewSettings: safeGet(
      d,
      "saas-marketing.onboarding.success.reviewSettings",
      "Review Settings"
    ),
    goToSchoolDashboard: safeGet(
      d,
      "saas-marketing.onboarding.success.goToSchoolDashboard",
      "Go to School Dashboard"
    ),
    loading: safeGet(d, "common.loading", "Loading..."),
    yourSchool: safeGet(
      d,
      "saas-marketing.onboarding.yourSchool",
      "Your school"
    ),
  }

  if (loading) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center"
        role="status"
        aria-busy="true"
        aria-label={t.loading}
      >
        <div className="animate-pulse">
          <div className="bg-muted mb-4 h-12 w-48 rounded" />
          <div className="bg-muted h-4 w-32 rounded" />
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Success Modal */}
      {schoolData?.name && schoolData?.domain && schoolData?.id && (
        <SuccessModal
          schoolData={{
            name: schoolData.name,
            domain: schoolData.domain,
            id: schoolData.id,
          }}
          showModal={showSuccessModal}
          setShowModal={setShowSuccessModal}
          onGoToDashboard={handleGoToDashboard}
        />
      )}

      {/* Regular content as fallback or when modal is closed */}
      <div>
        {/* Success Header */}
        <div className="mb-8 text-center">
          <div className="bg-chart-2/10 mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full">
            <CheckCircle className="text-chart-2 h-12 w-12" />
          </div>
          <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
            {t.congratulations}
          </h1>
          <p className="lead text-muted-foreground mt-3">
            {schoolData?.name || t.yourSchool} {t.schoolReady}
          </p>
        </div>

        {/* School URL Card */}
        {schoolData?.domain && (
          <Card className="bg-primary/5 border-primary/20 mb-8 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-1 text-sm">
                  {t.yourSchoolUrl}
                </p>
                <p className="scroll-m-20 text-xl font-semibold tracking-tight">
                  {getDisplayDomain()}
                </p>
              </div>
              <Button onClick={handleGoToDashboard} size="lg" className="gap-2">
                {t.goToDashboard}
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Next Steps */}
        <div className="mb-8">
          <h2 className="mb-4 scroll-m-20 text-2xl font-semibold tracking-tight">
            {t.whatsNext}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card
              className="cursor-pointer p-6 transition-shadow hover:shadow-lg"
              onClick={handleGoToDashboard}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && handleGoToDashboard()}
            >
              <div className="flex items-start gap-4">
                <div className="bg-chart-1/10 rounded-lg p-2">
                  <Users className="text-chart-1 h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="mb-1 scroll-m-20 text-lg font-semibold tracking-tight">
                    {t.inviteTeam}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {t.inviteTeamDesc}
                  </p>
                </div>
              </div>
            </Card>

            <Card
              className="cursor-pointer p-6 transition-shadow hover:shadow-lg"
              onClick={handleGoToDashboard}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && handleGoToDashboard()}
            >
              <div className="flex items-start gap-4">
                <div className="bg-chart-3/10 rounded-lg p-2">
                  <GraduationCap
                    className="text-chart-3 h-6 w-6"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <h3 className="mb-1 scroll-m-20 text-lg font-semibold tracking-tight">
                    {t.addStudents}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {t.addStudentsDesc}
                  </p>
                </div>
              </div>
            </Card>

            <Card
              className="cursor-pointer p-6 transition-shadow hover:shadow-lg"
              onClick={handleGoToDashboard}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && handleGoToDashboard()}
            >
              <div className="flex items-start gap-4">
                <div className="bg-chart-2/10 rounded-lg p-2">
                  <Calendar
                    className="text-chart-2 h-6 w-6"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <h3 className="mb-1 scroll-m-20 text-lg font-semibold tracking-tight">
                    {t.setUpClasses}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {t.setUpClassesDesc}
                  </p>
                </div>
              </div>
            </Card>

            <Card
              className="cursor-pointer p-6 transition-shadow hover:shadow-lg"
              onClick={handleGoToDashboard}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && handleGoToDashboard()}
            >
              <div className="flex items-start gap-4">
                <div className="bg-chart-1/10 rounded-lg p-2">
                  <ArrowRight
                    className="text-chart-1 h-6 w-6"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <h3 className="mb-1 scroll-m-20 text-lg font-semibold tracking-tight">
                    {t.configureSettings}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {t.configureSettingsDesc}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Quick Tips */}
        <Card className="bg-muted/50 p-6">
          <h3 className="mb-3 scroll-m-20 text-lg font-semibold tracking-tight">
            {t.quickTips}
          </h3>
          <ul className="space-y-2">
            <li className="text-muted-foreground text-sm">
              {t.tipPortalLive}{" "}
              <span className="font-medium">{getDisplayDomain()}</span>
            </li>
            <li className="text-muted-foreground text-sm">{t.tipShareUrl}</li>
            <li className="text-muted-foreground text-sm">{t.tipHelpCenter}</li>
            <li className="text-muted-foreground text-sm">
              {t.tipContactSupport}
            </li>
          </ul>
        </Card>

        {/* CTA Buttons */}
        <div className="mt-8 flex justify-center gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() =>
              router.push(`/${lang}/onboarding/${schoolId}/overview`)
            }
          >
            {t.reviewSettings}
          </Button>
          <Button size="lg" onClick={handleGoToDashboard} className="gap-2">
            {t.goToSchoolDashboard}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </>
  )
}
