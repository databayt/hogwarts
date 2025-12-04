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
      <div className="flex flex-col gap-8 py-4 pb-14 max-w-4xl">
        <section>
          <h3 className="mb-4 text-lg font-medium">Stats</h3>
          <CardsStats />
        </section>

        <section>
          <h3 className="mb-4 text-lg font-medium">Calendar</h3>
          <CardsCalendar />
        </section>

        <section>
          <h3 className="mb-4 text-lg font-medium">Activity Goal</h3>
          <CardsActivityGoal />
        </section>

        <section>
          <h3 className="mb-4 text-lg font-medium">Exercise Minutes</h3>
          <CardsExerciseMinutes />
        </section>

        <section>
          <h3 className="mb-4 text-lg font-medium">Forms</h3>
          <CardsForms />
        </section>

        <section>
          <h3 className="mb-4 text-lg font-medium">Team Members</h3>
          <CardsTeamMembers />
        </section>

        <section>
          <h3 className="mb-4 text-lg font-medium">Cookie Settings</h3>
          <CardsCookieSettings />
        </section>

        <section>
          <h3 className="mb-4 text-lg font-medium">Create Account</h3>
          <CardsCreateAccount />
        </section>

        <section>
          <h3 className="mb-4 text-lg font-medium">Chat</h3>
          <CardsChat />
        </section>

        <section>
          <h3 className="mb-4 text-lg font-medium">Payment Method</h3>
          <CardsPaymentMethod />
        </section>

        <section>
          <h3 className="mb-4 text-lg font-medium">Payments</h3>
          <CardsPayments />
        </section>

        <section>
          <h3 className="mb-4 text-lg font-medium">Report Issue</h3>
          <CardsReportIssue />
        </section>

        <section>
          <h3 className="mb-4 text-lg font-medium">Share Document</h3>
          <CardsShare />
        </section>
      </div>
    </>
  )
}
