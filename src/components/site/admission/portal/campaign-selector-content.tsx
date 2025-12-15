"use client"

import { useRouter } from "next/navigation"
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileText,
  GraduationCap,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { School } from "../../types"
import type { PublicCampaign } from "../types"

interface Props {
  school: School
  campaigns: PublicCampaign[]
  dictionary: Dictionary
  lang: Locale
  subdomain: string
}

export default function CampaignSelectorContent({
  school,
  campaigns,
  dictionary,
  lang,
  subdomain,
}: Props) {
  const router = useRouter()
  const isRTL = lang === "ar"
  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight
  const handleStartNew = (campaignId: string) => {
    router.push(`/${lang}/s/${subdomain}/apply/overview?id=${campaignId}`)
  }

  const activeCampaign =
    campaigns.find((c) => c.availableSeats > 0) || campaigns[0]

  // Application info for the draft card
  const applicationInfo = {
    campaignName:
      activeCampaign?.name ||
      (lang === "ar" ? "القبول 2025-2026" : "Admissions 2025-2026"),
    step: lang === "ar" ? "المعلومات الشخصية" : "Personal Information",
    stepNumber: "1/6",
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-3 px-3 sm:space-y-4 sm:px-4">
      {/* Welcome Header */}
      <div>
        <h3 className="mb-3 text-lg sm:mb-4 sm:text-xl lg:text-2xl">
          {lang === "ar" ? "مرحباً" : "Welcome"}
        </h3>
      </div>

      {/* Complete your application section - shows draft like onboarding "Complete your school setup" */}
      <div className="space-y-2 sm:space-y-3">
        <p className="text-sm font-medium">
          {lang === "ar" ? "أكمل طلبك" : "Complete your application"}
        </p>

        <div className="space-y-2">
          <Card
            className="hover:border-foreground/50 bg-card hover:bg-accent cursor-pointer rounded-lg border shadow-none transition-all hover:shadow-none"
            onClick={() => activeCampaign && handleStartNew(activeCampaign.id)}
          >
            <CardContent className="flex items-center justify-start gap-3 px-4 py-6 sm:py-8">
              <div className="bg-muted flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md sm:h-12 sm:w-12">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className={isRTL ? "text-right" : "text-left"}>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">
                    {applicationInfo.campaignName}
                  </p>
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-xs text-blue-800"
                  >
                    {lang === "ar" ? "مسودة" : "Draft"}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {lang === "ar" ? "الخطوة" : "Step"}{" "}
                  {applicationInfo.stepNumber} • {applicationInfo.step}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Start a new application section */}
      <div className="space-y-2 sm:space-y-3">
        <p className="text-sm font-medium">
          {lang === "ar" ? "ابدأ طلباً جديداً" : "Start a new application"}
        </p>

        <div className="space-y-2">
          {/* Start from scratch */}
          <button
            onClick={() => activeCampaign && handleStartNew(activeCampaign.id)}
            disabled={!activeCampaign || activeCampaign.availableSeats === 0}
            className="border-border group flex h-auto min-h-[50px] w-full items-center justify-between border-b py-2 transition-all disabled:opacity-50 sm:min-h-[60px] sm:py-3"
          >
            <div className="flex items-center gap-2">
              <div className="bg-muted flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10">
                <GraduationCap className="text-foreground h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div
                className={`min-w-0 flex-1 ${isRTL ? "text-right" : "text-left"}`}
              >
                <p className="text-sm font-medium">
                  {lang === "ar" ? "ابدأ من الصفر" : "Start from scratch"}
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {lang === "ar"
                    ? "ابدأ طلباً جديداً بالإعدادات الأساسية"
                    : "Begin a new application with basic setup"}
                </p>
              </div>
            </div>
            <ChevronIcon className="text-foreground group-hover:text-foreground h-4 w-4 flex-shrink-0 transition-colors sm:h-5 sm:w-5" />
          </button>

          {/* Import from profile/documents */}
          <button
            onClick={() =>
              activeCampaign &&
              router.push(
                `/${lang}/s/${subdomain}/apply/overview?id=${activeCampaign.id}&import=true`
              )
            }
            disabled={!activeCampaign || activeCampaign.availableSeats === 0}
            className="border-border group flex h-auto min-h-[50px] w-full items-center justify-between border-b py-2 transition-all disabled:opacity-50 sm:min-h-[60px] sm:py-3"
          >
            <div className="flex items-center gap-2">
              <div className="bg-muted flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10">
                <BookOpen className="text-foreground h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div
                className={`min-w-0 flex-1 ${isRTL ? "text-right" : "text-left"}`}
              >
                <p className="text-sm font-medium">
                  {lang === "ar"
                    ? "استيراد من ملف شخصي"
                    : "Import from profile"}
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {lang === "ar"
                    ? "استخرج البيانات من المستندات أو LinkedIn"
                    : "Auto-fill from documents or LinkedIn"}
                </p>
              </div>
            </div>
            <ChevronIcon className="text-foreground group-hover:text-foreground h-4 w-4 flex-shrink-0 transition-colors sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
