import { type Locale } from "@/components/internationalization/config"
import { type getDictionary } from "@/components/internationalization/dictionaries"

import { DashboardHeader } from "./header"
import StatsAppleActivity from "./stat-apple-activity"
import StatsAreaChart from "./stat-area-chart"
import StatsBadges from "./stat-badges"
import StatsBorders from "./stat-borders"
import StatsCardFlip from "./stat-card-flip"
import StatsCards from "./stat-cards"
import StatsCircular from "./stat-circular"
import StatsCircularLinks from "./stat-circular-links"
import StatsCurrencyTransfer from "./stat-currency-transfer"
import StatsDashboard from "./stat-dashboard"
import StatsLinks from "./stat-links"
import StatsProgress from "./stat-progress"
import StatsSegmented from "./stat-segmented"
import StatsStatus from "./stat-status"
import StatsTrending from "./stat-trending"
import StatsUsage from "./stat-usage"
import StatsWeather from "./stat-weather"

interface StatsContentProps {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
}

export default function StatsContent(_props: StatsContentProps) {
  return (
    <>
      <DashboardHeader heading="Stats" text="Stat components from blocks.so" />
      <div className="flex flex-col gap-8 py-4 pb-14">
        {/* Stats 01: Trending */}
        <section>
          <h3 className="mb-4 text-lg font-medium">
            Stats with Trending (stats-01)
          </h3>
          <StatsTrending />
        </section>

        {/* Stats 02: Borders */}
        <section>
          <h3 className="mb-4 text-lg font-medium">
            Stats with Borders (stats-02)
          </h3>
          <StatsBorders />
        </section>

        {/* Stats 03: Cards */}
        <section>
          <h3 className="mb-4 text-lg font-medium">
            Stats with Card Layout (stats-03)
          </h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 2xl:grid-cols-4">
            <StatsCards />
          </div>
        </section>

        {/* Stats 04: Badges */}
        <section>
          <h3 className="mb-4 text-lg font-medium">
            Stats with Badges (stats-04)
          </h3>
          <StatsBadges />
        </section>

        {/* Stats 05: Links */}
        <section>
          <h3 className="mb-4 text-lg font-medium">
            Stats with Links (stats-05)
          </h3>
          <StatsLinks />
        </section>

        {/* Stats 06: Status */}
        <section>
          <h3 className="mb-4 text-lg font-medium">
            Stats with Status (stats-06)
          </h3>
          <StatsStatus />
        </section>

        {/* Stats 07: Circular Progress */}
        <section>
          <h3 className="mb-4 text-lg font-medium">
            Stats with Circular Progress (stats-07)
          </h3>
          <StatsCircular />
        </section>

        {/* Stats 08: Circular Progress with Links */}
        <section>
          <h3 className="mb-4 text-lg font-medium">
            Stats with Circular Progress & Links (stats-08)
          </h3>
          <StatsCircularLinks />
        </section>

        {/* Stats 09: Progress */}
        <section>
          <h3 className="mb-4 text-lg font-medium">
            Stats with Progress (stats-09)
          </h3>
          <StatsProgress />
        </section>

        {/* Stats 10: Area Chart */}
        <section>
          <h3 className="mb-4 text-lg font-medium">
            Stats with Area Chart (stats-10)
          </h3>
          <StatsAreaChart />
        </section>

        {/* Stats 11: Dashboard */}
        <section>
          <h3 className="mb-4 text-lg font-medium">
            Stats Dashboard with Progress Bars (stats-11)
          </h3>
          <StatsDashboard />
        </section>

        {/* Stats 12: Usage */}
        <section>
          <h3 className="mb-4 text-lg font-medium">Stats Usage (stats-12)</h3>
          <StatsUsage />
        </section>

        {/* Stats 13: Segmented */}
        <section>
          <h3 className="mb-4 text-lg font-medium">
            Stats Segmented (stats-13)
          </h3>
          <StatsSegmented />
        </section>

        {/* Stats 14: Weather */}
        <section>
          <h3 className="mb-4 text-lg font-medium">Stats Weather (stats-14)</h3>
          <StatsWeather />
        </section>

        {/* Stats 15: Apple Activity */}
        <section>
          <h3 className="mb-4 text-lg font-medium">
            Apple Activity Rings (stats-15)
          </h3>
          <StatsAppleActivity />
        </section>

        {/* Stats 16: Card Flip */}
        <section>
          <h3 className="mb-4 text-lg font-medium">Card Flip (stats-16)</h3>
          <StatsCardFlip />
        </section>

        {/* Stats 17: Currency Transfer */}
        <section>
          <h3 className="mb-4 text-lg font-medium">
            Currency Transfer (stats-17)
          </h3>
          <StatsCurrencyTransfer />
        </section>
      </div>
    </>
  )
}
