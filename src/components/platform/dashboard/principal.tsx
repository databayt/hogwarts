import type { Dictionary } from "@/components/internationalization/dictionaries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TriangleAlert, DollarSign } from "lucide-react"
import { getPrincipalDashboardData } from "./actions"
import { DashboardSectionError } from "./error-boundary"
import { QuickActions } from "./quick-action"
import { getQuickActionsByRole } from "./quick-actions-config"
import { getTenantContext } from "@/lib/tenant-context"
import { PrincipalDashboardStats } from "@/components/platform/shared/stats"

interface PrincipalDashboardProps {
  user: any
  dictionary: Dictionary["school"]
  locale?: string
}

export async function PrincipalDashboard({ user, dictionary, locale = "en" }: PrincipalDashboardProps) {
  // Get tenant context for subdomain
  const { schoolId } = await getTenantContext()

  // Get school subdomain for URL construction with error handling
  let school = null
  try {
    if (schoolId) {
      const { db } = await import("@/lib/db")
      school = await db.school.findUnique({
        where: { id: schoolId },
        select: { domain: true },
      })
    }
  } catch (error) {
    console.error("[PrincipalDashboard] Error fetching school domain:", error)
  }

  // Helper variable for dictionary access
  const t = dictionary.principalDashboard

  // Fetch all real data from server actions
  let dashboardData

  try {
    dashboardData = await getPrincipalDashboardData()
  } catch (error) {
    console.error("Error fetching principal data:", error)
    return <DashboardSectionError title={t.dashboardUnavailable} message={t.unableToLoadData} />
  }

  const {
    performanceScorecard,
    criticalAlerts,
    todaysPriorities,
    academicTrends,
    disciplinarySummary,
    staffEvaluations,
    budgetStatus,
    parentFeedback,
    goalProgress,
    boardMeetings,
    monthlyHighlights,
  } = dashboardData

  return (
    <div className="space-y-6">
      {/* Hero Section - School Performance Scorecard using new reusable component */}
      <PrincipalDashboardStats
        overallScore={performanceScorecard.overall}
        academicScore={performanceScorecard.academic}
        attendance={performanceScorecard.attendance}
        disciplineScore={performanceScorecard.discipline}
        parentSatisfaction={performanceScorecard.parentSatisfaction}
        dictionary={t.performanceScorecard}
      />

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TriangleAlert className="h-5 w-5 text-destructive" />
              <span>{t.criticalAlerts.title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalAlerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <TriangleAlert
                      className={`h-5 w-5 ${
                        alert.severity === "critical" || alert.severity === "high"
                          ? "text-destructive"
                          : "text-amber-500"
                      }`}
                    />
                    <div>
                      <p className="font-medium">{alert.type}</p>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        alert.severity === "critical" || alert.severity === "high" ? "destructive" : "secondary"
                      }
                    >
                      {alert.severity}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{alert.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <QuickActions actions={getQuickActionsByRole("PRINCIPAL", dictionary, school?.domain)} locale={locale} />

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's Priorities */}
        <Card>
          <CardHeader>
            <CardTitle>{t.todaysPriorities.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todaysPriorities.length > 0 ? (
              todaysPriorities.map((priority, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{priority.priority}</p>
                    <p className="text-sm text-muted-foreground">{priority.time}</p>
                  </div>
                  <Badge variant={priority.status === "scheduled" ? "default" : "secondary"}>{priority.status}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">{t.todaysPriorities.noPriorities}</p>
            )}
          </CardContent>
        </Card>

        {/* Academic Performance Trends */}
        <Card>
          <CardHeader>
            <CardTitle>{t.academicPerformance.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {academicTrends.length > 0 ? (
              academicTrends.map((subject, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{subject.subject}</p>
                    <p className="text-sm text-muted-foreground">
                      {t.academicPerformance.current}: {subject.currentAvg}%
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        subject.trend === "up" ? "default" : subject.trend === "down" ? "destructive" : "secondary"
                      }
                    >
                      {subject.trend === "up" ? "↗" : subject.trend === "down" ? "↘" : "→"} {subject.improvement}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">{t.academicPerformance.noData}</p>
            )}
          </CardContent>
        </Card>

        {/* Disciplinary Summary */}
        <Card>
          <CardHeader>
            <CardTitle>{t.disciplinarySummary.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{disciplinarySummary.totalIncidents}</p>
                <p className="text-xs text-muted-foreground">{t.disciplinarySummary.totalIncidents}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {disciplinarySummary.resolved}
                </p>
                <p className="text-xs text-muted-foreground">{t.disciplinarySummary.resolved}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{disciplinarySummary.pending}</p>
                <p className="text-xs text-muted-foreground">{t.disciplinarySummary.pending}</p>
              </div>
            </div>
            {disciplinarySummary.topIssues.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground mb-2">{t.disciplinarySummary.topIssues}</p>
                <div className="space-y-1">
                  {disciplinarySummary.topIssues.map((issue, index) => (
                    <Badge key={index} variant="outline" className="mr-1">
                      {issue}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Staff Evaluations Due */}
        <Card>
          <CardHeader>
            <CardTitle>{t.staffEvaluations.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {staffEvaluations.length > 0 ? (
              staffEvaluations.map((evaluation, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{evaluation.teacher}</p>
                    <p className="text-sm text-muted-foreground">{evaluation.department}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={evaluation.status === "in-progress" ? "default" : "secondary"}>
                      {evaluation.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t.staffEvaluations.due}: {new Date(evaluation.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">{t.staffEvaluations.noEvaluations}</p>
            )}
          </CardContent>
        </Card>

        {/* Budget Status */}
        <Card>
          <CardHeader>
            <CardTitle>{t.budgetStatus.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t.budgetStatus.allocated}</span>
              <span className="font-medium">${(budgetStatus.allocated / 1000000).toFixed(1)}M</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t.budgetStatus.spent}</span>
              <span className="font-medium text-destructive">${(budgetStatus.spent / 1000000).toFixed(1)}M</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t.budgetStatus.remaining}</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                ${(budgetStatus.remaining / 1000).toFixed(0)}K
              </span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">{t.budgetStatus.utilization}</span>
                <span className="font-medium">{budgetStatus.utilization.toFixed(1)}%</span>
              </div>
              <Progress value={budgetStatus.utilization} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {t.budgetStatus.status} {budgetStatus.projections}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Parent Feedback */}
        <Card>
          <CardHeader>
            <CardTitle>{t.parentFeedback.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-2 border rounded">
              <span className="text-sm">{t.parentFeedback.satisfaction}</span>
              <div className="flex items-center space-x-2">
                <Progress value={parentFeedback.satisfaction} className="w-20" />
                <span className="text-sm font-medium">{parentFeedback.satisfaction.toFixed(1)}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 border rounded">
              <span className="text-sm">{t.parentFeedback.communication}</span>
              <div className="flex items-center space-x-2">
                <Progress value={parentFeedback.communication} className="w-20" />
                <span className="text-sm font-medium">{parentFeedback.communication.toFixed(1)}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 border rounded">
              <span className="text-sm">{t.parentFeedback.academicQuality}</span>
              <div className="flex items-center space-x-2">
                <Progress value={parentFeedback.academicQuality} className="w-20" />
                <span className="text-sm font-medium">{parentFeedback.academicQuality.toFixed(1)}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 border rounded">
              <span className="text-sm">{t.parentFeedback.facilities}</span>
              <div className="flex items-center space-x-2">
                <Progress value={parentFeedback.facilities} className="w-20" />
                <span className="text-sm font-medium">{parentFeedback.facilities.toFixed(1)}%</span>
              </div>
            </div>
            <div className="pt-2 border-t text-center">
              <p className="text-lg font-bold text-primary">{parentFeedback.overall.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">{t.parentFeedback.overallSatisfaction}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle>{t.executiveSummary.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Monthly Highlights */}
            <div>
              <h4 className="mb-3">{t.executiveSummary.monthlyHighlights}</h4>
              <div className="space-y-3">
                {monthlyHighlights.length > 0 ? (
                  monthlyHighlights.map((highlight, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant={highlight.impact === "high" ? "default" : "secondary"}>{highlight.impact}</Badge>
                      </div>
                      <p className="font-medium">{highlight.highlight}</p>
                      <p className="text-sm text-muted-foreground">{highlight.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">{t.executiveSummary.noHighlights}</p>
                )}
              </div>
            </div>

            {/* Goal Progress */}
            <div>
              <h4 className="mb-3">{t.executiveSummary.goalProgress}</h4>
              <div className="space-y-3">
                {goalProgress.map((goal, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <p className="font-medium mb-2">{goal.goal}</p>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">
                        {t.executiveSummary.target}: {goal.target}
                      </span>
                      <span className="text-sm font-medium">
                        {t.executiveSummary.current}: {goal.current}
                      </span>
                    </div>
                    <Progress value={Math.min(100, goal.progress)} className="mt-2" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Board Meetings */}
      <Card>
        <CardHeader>
          <CardTitle>{t.upcomingBoardMeetings.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {boardMeetings.map((meeting, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{meeting.topic}</p>
                  <p className="text-sm text-muted-foreground">{new Date(meeting.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <Badge variant={meeting.status === "confirmed" ? "default" : "secondary"}>{meeting.status}</Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {meeting.attendees} {t.upcomingBoardMeetings.attendees}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Financial Health Indicator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>{t.financialHealth.title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">{t.financialHealth.collectionRate}</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {performanceScorecard.financialHealth?.toFixed(1) || "85"}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">{t.financialHealth.budgetStatus}</p>
              <Badge
                variant={
                  budgetStatus.utilization > 90 ? "destructive" : budgetStatus.utilization > 75 ? "secondary" : "default"
                }
                className="text-lg px-4 py-1"
              >
                {budgetStatus.projections}
              </Badge>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">{t.financialHealth.yearToDate}</p>
              <p className="text-2xl font-bold">
                $
                {(budgetStatus.yearToDate?.spent || 0) > 1000000
                  ? `${(budgetStatus.yearToDate.spent / 1000000).toFixed(1)}M`
                  : `${((budgetStatus.yearToDate?.spent || 0) / 1000).toFixed(0)}K`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
