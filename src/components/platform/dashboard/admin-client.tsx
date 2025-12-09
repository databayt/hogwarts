"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import {
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Check,
  Eye,
  TriangleAlert,
  ChevronRight,
  Plus,
  Megaphone,
  FileText,
  Receipt,
  Clock,
  UserPlus,
  CreditCard,
  Bell,
  CalendarDays,
  Droplets,
  Wind,
  Thermometer,
  RefreshCcw,
  ArrowRight,
  Repeat2,
  Database,
  Download,
  Book,
} from "lucide-react"
import { DetailedUsageTableDemo } from "@/components/platform/billing/detailed-usage-table-demo"
import { InvoiceHistoryDemo } from "@/components/platform/billing/invoice-history-demo"
import Icon from "@mdi/react"
import {
  mdiWeatherSunny,
  mdiWeatherPartlyCloudy,
  mdiWeatherCloudy,
  mdiWeatherRainy,
  mdiWeatherPouring,
  mdiWeatherSnowy,
  mdiWeatherWindy,
} from "@mdi/js"
import Link from "next/link"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"

// ============================================================================
// TYPES
// ============================================================================

interface QuickStatData {
  label: string
  value: string
  change: string
  changeType: "positive" | "negative" | "neutral"
  href?: string
}

interface FinanceStatData {
  label: string
  value: string
}

interface ActivityData {
  action: string
  user: string
  time: string
  type: string
}

interface SummaryData {
  label: string
  value: string
}

interface AdminDashboardClientProps {
  locale: string
  subdomain: string
  userName: string
  schoolName: string
  quickStats: QuickStatData[]
  financeStats: FinanceStatData[]
  recentActivities: ActivityData[]
  todaySummary: SummaryData[]
}

// ============================================================================
// SECTION 0: Upcoming Class + Weather
// ============================================================================

const weatherIconMap: Record<string, string> = {
  sunny: mdiWeatherSunny,
  partlycloudy: mdiWeatherPartlyCloudy,
  cloudy: mdiWeatherCloudy,
  rainy: mdiWeatherRainy,
  pouring: mdiWeatherPouring,
  snowy: mdiWeatherSnowy,
  windy: mdiWeatherWindy,
}

function WeatherIcon({ condition, className }: { condition: string; className?: string }) {
  return <Icon path={weatherIconMap[condition] || mdiWeatherSunny} className={cn("size-6", className)} />
}

const currentWeather = {
  day: "Monday",
  condition: "sunny",
  conditionLabel: "Sunny",
  temperature: 24,
  tempLow: 18,
  humidity: 45,
  rainChance: 10,
  windSpeed: 12,
}

const forecast = [
  { day: "Tue", condition: "partlycloudy", temp: 22 },
  { day: "Wed", condition: "cloudy", temp: 20 },
  { day: "Thu", condition: "rainy", temp: 18 },
  { day: "Fri", condition: "pouring", temp: 16 },
  { day: "Sat", condition: "cloudy", temp: 19 },
  { day: "Sun", condition: "sunny", temp: 23 },
]

function UpcomingClassCard({ locale, subdomain }: { locale: string; subdomain: string }) {
  const [isFlipped, setIsFlipped] = useState(false)

  const upcomingClass = {
    title: "Upcoming Class",
    subtitle: "Mathematics - Grade 10",
    description: "Next scheduled class session",
    details: [
      { label: "Time", value: "09:00 AM" },
      { label: "Room", value: "Hall A" },
      { label: "Duration", value: "45 min" },
      { label: "Students", value: "32" },
    ],
  }

  return (
    <div
      className="group relative h-[320px] w-full max-w-[320px] [perspective:2000px]"
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <div
        className={cn(
          "relative h-full w-full",
          "[transform-style:preserve-3d]",
          "transition-all duration-700",
          isFlipped ? "[transform:rotateY(180deg)]" : "[transform:rotateY(0deg)]"
        )}
      >
        {/* Front of card */}
        <div
          className={cn(
            "absolute inset-0 h-full w-full",
            "[backface-visibility:hidden] [transform:rotateY(0deg)]",
            "overflow-hidden rounded-2xl",
            "bg-card",
            "border",
            "shadow-sm",
            "transition-all duration-700",
            "group-hover:shadow-lg",
            isFlipped ? "opacity-0" : "opacity-100"
          )}
        >
          <div className="relative h-full overflow-hidden bg-gradient-to-b from-muted/50 to-background">
            <div className="absolute inset-0 flex items-start justify-center pt-24">
              <div className="relative flex h-[100px] w-[200px] items-center justify-center">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "absolute h-[50px] w-[50px]",
                      "rounded-[140px]",
                      "animate-pulse",
                      "opacity-20",
                      "bg-primary/30"
                    )}
                    style={{
                      animationDelay: `${i * 0.3}s`,
                      transform: `scale(${1 + i * 0.2})`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1.5">
                <h3 className="text-lg font-semibold leading-snug tracking-tighter text-foreground transition-all duration-500 ease-out group-hover:translate-y-[-4px]">
                  {upcomingClass.title}
                </h3>
                <p className="line-clamp-2 text-sm tracking-tight text-muted-foreground transition-all delay-[50ms] duration-500 ease-out group-hover:translate-y-[-4px]">
                  {upcomingClass.subtitle}
                </p>
              </div>
              <div className="group/icon relative">
                <div
                  className={cn(
                    "absolute inset-[-8px] rounded-lg transition-opacity duration-300",
                    "bg-gradient-to-br from-primary/20 via-primary/10 to-transparent"
                  )}
                />
                <Repeat2 className="relative z-10 h-4 w-4 text-primary transition-transform duration-300 group-hover/icon:-rotate-12 group-hover/icon:scale-110" />
              </div>
            </div>
          </div>
        </div>

        {/* Back of card */}
        <div
          className={cn(
            "absolute inset-0 h-full w-full",
            "[backface-visibility:hidden] [transform:rotateY(180deg)]",
            "flex flex-col rounded-2xl border p-6",
            "bg-gradient-to-b from-muted/50 to-background",
            "shadow-sm",
            "transition-all duration-700",
            "group-hover:shadow-lg",
            !isFlipped ? "opacity-0" : "opacity-100"
          )}
        >
          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold leading-snug tracking-tight text-foreground transition-all duration-500 ease-out group-hover:translate-y-[-2px]">
                {upcomingClass.title}
              </h3>
              <p className="line-clamp-2 text-sm tracking-tight text-muted-foreground transition-all duration-500 ease-out group-hover:translate-y-[-2px]">
                {upcomingClass.description}
              </p>
            </div>

            <div className="space-y-2">
              {upcomingClass.details.map((detail, index) => (
                <div
                  key={detail.label}
                  className="flex items-center justify-between text-sm transition-all duration-500"
                  style={{
                    transform: isFlipped ? "translateX(0)" : "translateX(-10px)",
                    opacity: isFlipped ? 1 : 0,
                    transitionDelay: `${index * 100 + 200}ms`,
                  }}
                >
                  <span className="text-muted-foreground">{detail.label}</span>
                  <span className="font-medium text-foreground">{detail.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t pt-6">
            <Link
              href={`/${locale}/s/${subdomain}/timetable`}
              className={cn(
                "group/start relative",
                "flex items-center justify-between",
                "-m-3 rounded-xl p-3",
                "transition-all duration-300",
                "bg-muted/50",
                "hover:bg-primary/10",
                "hover:scale-[1.02]"
              )}
            >
              <span className="text-sm font-medium text-foreground transition-colors duration-300 group-hover/start:text-primary">
                View Timetable
              </span>
              <div className="group/icon relative">
                <div
                  className={cn(
                    "absolute inset-[-6px] rounded-lg transition-all duration-300",
                    "bg-gradient-to-br from-primary/20 via-primary/10 to-transparent",
                    "scale-90 opacity-0 group-hover/start:scale-100 group-hover/start:opacity-100"
                  )}
                />
                <ArrowRight className="relative z-10 h-4 w-4 text-primary transition-all duration-300 group-hover/start:translate-x-0.5 group-hover/start:scale-110" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function DateTimeDisplay() {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const hours = currentTime.getHours()
  const period = hours >= 12 ? "PM" : "AM"
  const displayHours = hours % 12 || 12
  const minutes = currentTime.getMinutes().toString().padStart(2, "0")

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="flex flex-col items-end justify-center text-right">
      <p className="text-sm font-medium text-muted-foreground">{period}</p>
      <p className="text-4xl font-bold tabular-nums">{displayHours}:{minutes}</p>
      <p className="text-sm text-muted-foreground">{formatDate(currentTime)}</p>
    </div>
  )
}

function WeatherDateTime() {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const hours = currentTime.getHours()
  const period = hours >= 12 ? "PM" : "AM"
  const displayHours = hours % 12 || 12
  const minutes = currentTime.getMinutes().toString().padStart(2, "0")

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Clock className="size-4 text-muted-foreground" />
        <span className="text-base font-medium text-foreground">{displayHours}:{minutes} {period}</span>
      </div>
      <div className="flex items-center gap-2">
        <CalendarDays className="size-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{formatDate(currentTime)}</span>
      </div>
    </div>
  )
}

function TopSection({ locale, subdomain }: { locale: string; subdomain: string }) {
  return (
    <section>
      <div className="flex flex-wrap gap-12 items-start">
        {/* Upcoming Class Card */}
        <UpcomingClassCard locale={locale} subdomain={subdomain} />

        {/* Weather - no border, no padding, same height as card */}
        <div className="w-full max-w-md h-[320px] flex flex-col justify-between">
          <div>
            {/* Header with current weather */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-lg font-medium">{currentWeather.day}</p>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <WeatherIcon condition={currentWeather.condition} className="size-5" />
                    <span className="text-sm">({currentWeather.conditionLabel})</span>
                  </div>
                </div>

                {/* Weather metrics */}
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Droplets className="size-4" />
                    <span>Humidity: {currentWeather.humidity}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="text-primary">Rain: {currentWeather.rainChance}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Thermometer className="size-4" />
                    <span>
                      {currentWeather.temperature}° ({currentWeather.tempLow}°)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Wind className="size-4" />
                    <span>{currentWeather.windSpeed} km/h</span>
                  </div>
                  {/* Time and Date */}
                  <div className="pt-2">
                    <WeatherDateTime />
                  </div>
                </div>
              </div>

              <Button size="icon" variant="ghost">
                <RefreshCcw className="size-4" />
              </Button>
            </div>

            {/* Forecast strip */}
            <div className="mt-6 flex justify-between rounded-lg bg-muted/50 p-3">
              {forecast.map((item) => (
                <div key={item.day} className="flex flex-col items-center gap-1">
                  <span className="text-xs text-muted-foreground">{item.day}</span>
                  <WeatherIcon condition={item.condition} className="size-6" />
                  <span className="text-sm font-medium">{item.temp}°</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// SECTION 2: Quick Stats - 3 Cards with Icons
// ============================================================================

const iconMap = {
  Students: Users,
  Teachers: GraduationCap,
  Classes: BookOpen,
}

function StatBadge({ label, value, change, changeType, href }: QuickStatData) {
  const Icon = iconMap[label as keyof typeof iconMap] || Users

  const content = (
    <CardContent className="p-0">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold">{value}</p>
            <Badge
              variant="secondary"
              className={cn(
                "text-xs",
                changeType === "positive" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                changeType === "negative" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                changeType === "neutral" && "bg-muted text-muted-foreground"
              )}
            >
              {changeType === "positive" && <TrendingUp className="mr-1 h-3 w-3" />}
              {changeType === "negative" && <TrendingDown className="mr-1 h-3 w-3" />}
              {change}
            </Badge>
          </div>
        </div>
        {href && <ChevronRight className="h-5 w-5 text-muted-foreground" />}
      </div>
    </CardContent>
  )

  if (href) {
    return (
      <Link href={href}>
        <Card className="p-6 cursor-pointer hover:bg-accent/50 transition-colors">
          {content}
        </Card>
      </Link>
    )
  }

  return (
    <Card className="p-6">
      {content}
    </Card>
  )
}

function QuickStatsSection({ quickStats }: { quickStats: QuickStatData[] }) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">Quick Stats</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {quickStats.map((stat) => (
          <StatBadge key={stat.label} {...stat} />
        ))}
      </div>
    </section>
  )
}

// ============================================================================
// SECTION 3: Financial Overview - Stats Row + Full Width Chart
// ============================================================================

const financeIconMap: Record<string, React.ElementType> = {
  Revenue: DollarSign,
  Collected: Check,
  Pending: Clock,
  Overdue: TriangleAlert,
}

const revenueChartData = [
  { average: 18000, today: 22000, day: "Monday" },
  { average: 19000, today: 25000, day: "Tuesday" },
  { average: 17500, today: 21000, day: "Wednesday" },
  { average: 20000, today: 28000, day: "Thursday" },
  { average: 18500, today: 24000, day: "Friday" },
  { average: 16000, today: 19500, day: "Saturday" },
  { average: 15000, today: 17000, day: "Sunday" },
]

const revenueChartConfig = {
  today: {
    label: "This Week",
    color: "var(--primary)",
  },
  average: {
    label: "Average",
    color: "var(--primary)",
  },
} satisfies ChartConfig

function FinancialSection({ financeStats }: { financeStats: FinanceStatData[] }) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">Financial Overview</h2>
      <div className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {financeStats.map((stat) => {
            const Icon = financeIconMap[stat.label] || DollarSign
            return (
              <Card key={stat.label} className="p-4">
                <CardContent className="p-0 flex items-center gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-lg font-semibold">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Revenue Chart - Exercise Minutes style */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Collected</CardTitle>
            <p className="text-sm text-muted-foreground">
              Your revenue collection is ahead of where you normally are.
            </p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueChartConfig} className="w-full md:h-[200px]">
              <LineChart
                accessibilityLayer
                data={revenueChartData}
                margin={{
                  top: 5,
                  right: 10,
                  left: 16,
                  bottom: 0,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <Line
                  type="monotone"
                  dataKey="today"
                  strokeWidth={2}
                  stroke="var(--color-today)"
                  dot={{
                    fill: "var(--color-today)",
                  }}
                  activeDot={{
                    r: 5,
                  }}
                />
                <Line
                  type="monotone"
                  strokeWidth={2}
                  dataKey="average"
                  stroke="var(--color-average)"
                  strokeOpacity={0.5}
                  dot={{
                    fill: "var(--color-average)",
                    opacity: 0.5,
                  }}
                  activeDot={{
                    r: 5,
                  }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

// ============================================================================
// SECTION 4: Recent Activity - Feed (2/3) + Summary Stats (1/3)
// ============================================================================

<DetailedUsageTableDemo />

const activityIconMap: Record<string, React.ElementType> = {
  enrollment: UserPlus,
  payment: CreditCard,
  announcement: Bell,
  academic: FileText,
}

function RecentActivitySection({
  recentActivities,
  todaySummary,
}: {
  recentActivities: ActivityData[]
  todaySummary: SummaryData[]
}) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Activity Feed */}
        <Card className="lg:col-span-2 p-6">
          <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Activity Feed</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs">
              See All <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => {
                const Icon = activityIconMap[activity.type] || FileText
                return (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.user}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent activities</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Summary */}
        <Card className="p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base">Today&apos;s Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            {todaySummary.map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-lg font-semibold">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

// ============================================================================
// SECTION 0: Quick Look - Announcements, Events, Notifications, Messages
// ============================================================================

function QuickLookSection({ locale, subdomain }: { locale: string; subdomain: string }) {
  const quickLookItems = [
    {
      icon: Megaphone,
      label: "Announcements",
      count: 3,
      newCount: 1,
      recent: "Holiday Schedule Update",
      href: `/${locale}/s/${subdomain}/announcements`,
      color: "text-[#D97757]",
      bgColor: "bg-[#D97757]/15"
    },
    {
      icon: CalendarDays,
      label: "Events",
      count: 5,
      newCount: 2,
      recent: "Parent-Teacher Meeting",
      href: `/${locale}/s/${subdomain}/events`,
      color: "text-[#6A9BCC]",
      bgColor: "bg-[#6A9BCC]/15"
    },
    {
      icon: Bell,
      label: "Notifications",
      count: 12,
      newCount: 4,
      recent: "Fee reminder for Grade 10",
      href: `/${locale}/s/${subdomain}/admin`,
      color: "text-[#CBCADB]",
      bgColor: "bg-[#CBCADB]/15"
    },
    {
      icon: FileText,
      label: "Messages",
      count: 8,
      newCount: 2,
      recent: "Request for meeting",
      href: `/${locale}/s/${subdomain}/admin`,
      color: "text-[#BCD1CA]",
      bgColor: "bg-[#BCD1CA]/15"
    },
  ]

  return (
    <section>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {quickLookItems.map((item) => (
          <Card key={item.label} className="p-4">
            <CardContent className="p-0 space-y-3">
              <div className="flex items-center gap-3">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", item.bgColor)}>
                  <item.icon className={cn("h-5 w-5", item.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold">{item.count}</p>
                    {item.newCount > 0 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        +{item.newCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground truncate">{item.recent}</p>
              <Link
                href={item.href}
                className="inline-flex items-center text-xs text-primary hover:underline"
              >
                View All <ChevronRight className="ml-1 h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

// ============================================================================
// SECTION 6: Quick Actions - Grid like /admin page
// ============================================================================

function QuickActionsSection({ locale, subdomain }: { locale: string; subdomain: string }) {
  const actions = [
    { icon: UserPlus, label: "Add Student", description: "Enroll new student", href: `/${locale}/s/${subdomain}/students/new` },
    { icon: Bell, label: "Announce", description: "Send notification", href: `/${locale}/s/${subdomain}/announcements/new` },
    { icon: FileText, label: "View Reports", description: "Analytics & data", href: `/${locale}/s/${subdomain}/admin/reports` },
    { icon: CreditCard, label: "Billing", description: "Manage payments", href: `/${locale}/s/${subdomain}/billing` },
  ]

  return (
    <div className="grid gap-3 grid-cols-4">
      {actions.map((action) => (
        <Button key={action.label} asChild variant="outline" className="justify-start h-auto py-3">
          <Link href={action.href}>
            <action.icon className="mr-2 h-4 w-4" />
            <span className="flex flex-col items-start">
              <span className="font-medium">{action.label}</span>
              <span className="text-xs text-muted-foreground">{action.description}</span>
            </span>
          </Link>
        </Button>
      ))}
    </div>
  )
}

// ============================================================================
// MAIN CLIENT COMPONENT
// ============================================================================

export function AdminDashboardClient({
  locale,
  subdomain,
  quickStats,
  financeStats,
  recentActivities,
  todaySummary,
}: AdminDashboardClientProps) {
  return (
    <div className="space-y-8">
      {/* Section 0: Upcoming Class + Weather */}
      <TopSection locale={locale} subdomain={subdomain} />

      {/* Section 1: Quick Look */}
      <QuickLookSection locale={locale} subdomain={subdomain} />

      {/* Section 2: Resource Usage */}
      <DetailedUsageTableDemo />

      {/* Section 3: Invoice History */}
      <InvoiceHistoryDemo />

      {/* Section 4: Quick Actions */}
      <QuickActionsSection locale={locale} subdomain={subdomain} />
    </div>
  )
}
