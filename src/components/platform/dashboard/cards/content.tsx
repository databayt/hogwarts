import { getDictionary } from "@/components/internationalization/dictionaries"
import { type Locale } from "@/components/internationalization/config"
import { DashboardHeader } from "@/components/platform/dashboard/header"
import { CardsActivityGoal } from "./activity-goal"
import { CardsCalendar } from "./calendar"
import { CardsChat } from "./chat"
import { CardsCookieSettings } from "./cookie-settings"
import { CardsCreateAccount } from "./create-account"
import { CardsExerciseMinutes } from "./exercise-minutes"
import { CardsForms } from "./forms"
import { CardsMetric } from "./metric"
import { CardsPaymentMethod } from "./payment-method"
import { CardsPayments } from "./payments"
import { CardsReportIssue } from "./report-issue"
import { CardsShare } from "./share"
import { CardsStats } from "./stats"
import { CardsTeamMembers } from "./team-members"

interface CardsContentProps {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
}

export default function CardsContent({ dictionary, lang }: CardsContentProps) {
  return (
    <>
      <DashboardHeader heading="Cards" text="Card components from shadcn/ui v4" />
      <div className="grid gap-6 py-4 pb-14 md:grid-cols-2 lg:grid-cols-3">
        <CardsStats />
        <CardsCalendar />
        <CardsActivityGoal />
        <CardsMetric />
        <CardsExerciseMinutes />
        <CardsForms />
        <CardsTeamMembers />
        <CardsCookieSettings />
        <CardsCreateAccount />
        <CardsChat />
        <CardsPaymentMethod />
        <CardsReportIssue />
        <CardsShare />
        <CardsPayments />
      </div>
    </>
  )
}
