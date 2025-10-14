import { Shell as PageContainer } from "@/components/table/shell";
import { MRRChart } from "./mrr-chart";
import { MRRByPlan } from "./mrr-by-plan";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateMRR, getMRRHistory, getRevenueTrends } from "./actions";
import { TrendingUp, TrendingDown, DollarSign, Users } from "lucide-react";
import type { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";

interface Props {
  dictionary: any;
  lang: Locale;
}

export async function AnalyticsContent({ dictionary, lang }: Props) {
  const [mrrData, mrrHistory, revenueTrends] = await Promise.all([
    calculateMRR(),
    getMRRHistory(),
    getRevenueTrends(),
  ]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-6">
        <div>
          <h2>{dictionary?.title || "Revenue Analytics"}</h2>
          <p className="muted">{dictionary?.description || "Track MRR, revenue trends, and financial health"}</p>
        </div>

        {/* MRR Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current MRR</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(mrrData.currentMRR)}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {mrrData.growth >= 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-green-600">+{mrrData.growth}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 text-red-600" />
                    <span className="text-red-600">{mrrData.growth}%</span>
                  </>
                )}
                <span>vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Month MRR</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(mrrData.lastMonthMRR)}</div>
              <p className="text-xs text-muted-foreground">
                Previous period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paying Schools</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mrrData.totalSchools}</div>
              <p className="text-xs text-muted-foreground">
                Active subscriptions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg per School</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(mrrData.totalSchools > 0 ? mrrData.currentMRR / mrrData.totalSchools : 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Average revenue per school
              </p>
            </CardContent>
          </Card>
        </div>

        {/* MRR Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <MRRChart data={mrrHistory} />
          <MRRByPlan data={mrrData.mrrByPlan} />
        </div>

        {/* Revenue Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
            <p className="text-sm text-muted-foreground">
              Actual revenue from paid invoices over the last 6 months
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenueTrends.map((trend, index) => {
                const prevRevenue = index > 0 ? revenueTrends[index - 1].revenue : trend.revenue;
                const growth = prevRevenue > 0
                  ? ((trend.revenue - prevRevenue) / prevRevenue) * 100
                  : 0;

                return (
                  <div key={trend.month} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="flex items-center gap-4">
                      <div className="w-24">
                        <span className="text-sm font-medium">{trend.month}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold">{formatCurrency(trend.revenue)}</span>
                        {index > 0 && (
                          <span className={`text-xs ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {trend.invoices} invoice{trend.invoices !== 1 ? 's' : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Projected Annual Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Projections</CardTitle>
            <p className="text-sm text-muted-foreground">
              Based on current MRR and growth rate
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Annual Run Rate (ARR)</p>
                <p className="text-2xl font-bold">{formatCurrency(mrrData.currentMRR * 12)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Projected Next Month</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(mrrData.currentMRR * (1 + mrrData.growth / 100))}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Projected 12 Months</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(mrrData.currentMRR * Math.pow(1 + mrrData.growth / 100, 12) * 12)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
