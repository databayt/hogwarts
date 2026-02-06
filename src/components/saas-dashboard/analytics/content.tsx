import { DollarSign, TrendingDown, TrendingUp, Users } from "lucide-react"

import { formatCurrency, formatPercentage } from "@/lib/i18n-format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import { Shell as PageContainer } from "@/components/table/shell"

import { calculateMRR, getMRRHistory, getRevenueTrends } from "./actions"
import { MRRByPlan } from "./mrr-by-plan"
import { MRRChart } from "./mrr-chart"

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
}

export async function AnalyticsContent({ dictionary, lang }: Props) {
  const t = dictionary?.operator?.analytics

  const [mrrData, mrrHistory, revenueTrends] = await Promise.all([
    calculateMRR(),
    getMRRHistory(),
    getRevenueTrends(),
  ])

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-6">
        <div>
          <h2>{t?.revenueAnalytics || "Revenue Analytics"}</h2>
          <p className="muted">
            {t?.trackMRR || "Track MRR, revenue trends, and financial health"}
          </p>
        </div>

        {/* MRR Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t?.currentMRR || "Current MRR"}
              </CardTitle>
              <DollarSign className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(mrrData.currentMRR, lang, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </div>
              <div className="text-muted-foreground flex items-center gap-1 text-xs">
                {mrrData.growth >= 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-green-600">
                      +{formatPercentage(mrrData.growth / 100, lang)}
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 text-red-600" />
                    <span className="text-red-600">
                      {formatPercentage(mrrData.growth / 100, lang)}
                    </span>
                  </>
                )}
                <span>
                  {dictionary?.operator?.dashboard?.vsLastMonth ||
                    "vs last month"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t?.lastMonthMRR || "Last Month MRR"}
              </CardTitle>
              <DollarSign className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(mrrData.lastMonthMRR, lang, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </div>
              <p className="text-muted-foreground text-xs">
                {t?.previousPeriod || "Previous period"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t?.payingSchools || "Paying Schools"}
              </CardTitle>
              <Users className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mrrData.totalSchools}</div>
              <p className="text-muted-foreground text-xs">
                {t?.activeSubscriptions || "Active subscriptions"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t?.avgPerSchool || "Avg per School"}
              </CardTitle>
              <DollarSign className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  mrrData.totalSchools > 0
                    ? mrrData.currentMRR / mrrData.totalSchools
                    : 0,
                  lang,
                  { minimumFractionDigits: 0, maximumFractionDigits: 0 }
                )}
              </div>
              <p className="text-muted-foreground text-xs">
                {t?.avgRevenuePerSchool || "Average revenue per school"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* MRR Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <MRRChart data={mrrHistory} lang={lang} />
          <MRRByPlan data={mrrData.mrrByPlan} lang={lang} />
        </div>

        {/* Revenue Trends */}
        <Card>
          <CardHeader>
            <CardTitle>{t?.revenueTrends || "Revenue Trends"}</CardTitle>
            <p className="text-muted-foreground text-sm">
              {t?.actualRevenue ||
                "Actual revenue from paid invoices over the last 6 months"}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenueTrends.map((trend, index) => {
                const prevRevenue =
                  index > 0 ? revenueTrends[index - 1].revenue : trend.revenue
                const growth =
                  prevRevenue > 0
                    ? ((trend.revenue - prevRevenue) / prevRevenue) * 100
                    : 0

                return (
                  <div
                    key={trend.month}
                    className="flex items-center justify-between border-b pb-3 last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-24">
                        <span className="text-sm font-medium">
                          {trend.month}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold">
                          {formatCurrency(trend.revenue, lang, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                        </span>
                        {index > 0 && (
                          <span
                            className={`text-xs ${growth >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {growth >= 0 ? "+" : ""}
                            {formatPercentage(growth / 100, lang)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {trend.invoices} invoice{trend.invoices !== 1 ? "s" : ""}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Projected Annual Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>{t?.projections || "Projections"}</CardTitle>
            <p className="text-muted-foreground text-sm">
              {t?.basedOnGrowth || "Based on current MRR and growth rate"}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-muted-foreground text-sm">
                  {t?.annualRunRate || "Annual Run Rate (ARR)"}
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(mrrData.currentMRR * 12, lang, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">
                  {t?.projectedNextMonth || "Projected Next Month"}
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    mrrData.currentMRR * (1 + mrrData.growth / 100),
                    lang,
                    { minimumFractionDigits: 0, maximumFractionDigits: 0 }
                  )}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">
                  {t?.projected12Months || "Projected 12 Months"}
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    mrrData.currentMRR *
                      Math.pow(1 + mrrData.growth / 100, 12) *
                      12,
                    lang,
                    { minimumFractionDigits: 0, maximumFractionDigits: 0 }
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
