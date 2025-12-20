import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { DashboardHeader } from "@/components/platform/dashboard/header"

import { CardsActivityGoal } from "./card-activity-goal"
import { CardsChat } from "./card-chat"
import { CardsCookieSettings } from "./card-cookie-settings"
import { CardsCreateAccount } from "./card-create-account"
import { CardsExerciseMinutes } from "./card-exercise-minutes"
import { CardsForms } from "./card-forms"
import { CardsMetric } from "./card-metric"
import { CardsPaymentMethod } from "./card-payment-method"
import { CardsPayments } from "./card-payments"
import { CardsReportIssue } from "./card-report-issue"
import { CardsShare } from "./card-share"
import { CardsStats } from "./card-stats"
import { CardsTeamMembers } from "./card-team-members"

interface CardsContentProps {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
}

export default function CardsContent({ dictionary, lang }: CardsContentProps) {
  return (
    <>
      <DashboardHeader
        heading="Cards"
        text="Card components from shadcn/ui v4"
      />
      <div className="md:grids-col-2 grid py-4 pb-14 **:data-[slot=card]:shadow-none md:gap-4 lg:grid-cols-10 xl:grid-cols-11">
        {/* Left column */}
        <div className="grid gap-4 lg:col-span-4 xl:col-span-6">
          <CardsStats />
          {/* Mobile: Activity Goal + Exercise Minutes */}
          <div className="grid gap-1 sm:grid-cols-2 md:hidden">
            <CardsActivityGoal />
            <div className="pt-3 sm:pt-0">
              <CardsMetric />
            </div>
            <div className="pt-3 sm:col-span-2">
              <CardsExerciseMinutes />
            </div>
          </div>
          {/* Two-column grid for form cards */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
            <div className="flex flex-col gap-4">
              <CardsForms />
              <CardsTeamMembers />
              <CardsCookieSettings />
            </div>
            <div className="flex flex-col gap-4">
              <CardsCreateAccount />
              <CardsChat />
              <div className="hidden xl:block">
                <CardsReportIssue />
              </div>
            </div>
          </div>
        </div>
        {/* Right column */}
        <div className="flex flex-col gap-4 lg:col-span-6 xl:col-span-5">
          {/* Desktop: Activity Goal + Exercise Minutes */}
          <div className="hidden gap-1 sm:grid-cols-2 md:grid">
            <CardsActivityGoal />
            <div className="pt-3 sm:pt-0 sm:pl-2 xl:pl-3">
              <CardsMetric />
            </div>
            <div className="pt-3 sm:col-span-2 xl:pt-3">
              <CardsExerciseMinutes />
            </div>
          </div>
          {/* Payments table */}
          <div className="hidden md:block">
            <CardsPayments />
          </div>
          <CardsPaymentMethod />
          <CardsShare />
          {/* Mobile: Report Issue */}
          <div className="xl:hidden">
            <CardsReportIssue />
          </div>
        </div>
      </div>
    </>
  )
}
