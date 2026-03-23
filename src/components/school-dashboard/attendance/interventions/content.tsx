"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useState, useTransition } from "react"
import { format } from "date-fns"
import {
  AlertTriangle,
  ArrowUpDown,
  Award,
  Building,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  Filter,
  GraduationCap,
  HelpCircle,
  Home,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  User,
  UserCheck,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import {
  getAllInterventions,
  getInterventionStats,
} from "@/components/school-dashboard/attendance/actions"

// Icon and color config (labels come from dictionary)
const INTERVENTION_TYPE_ICONS: Record<
  string,
  { icon: React.ReactNode; color: string }
> = {
  PARENT_PHONE_CALL: {
    icon: <Phone className="h-4 w-4" />,
    color: "text-blue-500",
  },
  PARENT_EMAIL: { icon: <Mail className="h-4 w-4" />, color: "text-blue-500" },
  PARENT_MEETING: {
    icon: <Users className="h-4 w-4" />,
    color: "text-green-500",
  },
  HOME_VISIT: { icon: <Home className="h-4 w-4" />, color: "text-purple-500" },
  COUNSELOR_REFERRAL: {
    icon: <GraduationCap className="h-4 w-4" />,
    color: "text-yellow-500",
  },
  SOCIAL_WORKER_REFERRAL: {
    icon: <UserCheck className="h-4 w-4" />,
    color: "text-orange-500",
  },
  ADMINISTRATOR_MEETING: {
    icon: <Building className="h-4 w-4" />,
    color: "text-red-500",
  },
  ATTENDANCE_CONTRACT: {
    icon: <FileText className="h-4 w-4" />,
    color: "text-red-500",
  },
  TRUANCY_REFERRAL: {
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "text-red-700",
  },
  COMMUNITY_RESOURCE: {
    icon: <Building className="h-4 w-4" />,
    color: "text-teal-500",
  },
  ACADEMIC_SUPPORT: {
    icon: <GraduationCap className="h-4 w-4" />,
    color: "text-indigo-500",
  },
  MENTORSHIP_ASSIGNMENT: {
    icon: <Award className="h-4 w-4" />,
    color: "text-pink-500",
  },
  INCENTIVE_PROGRAM: {
    icon: <Award className="h-4 w-4" />,
    color: "text-green-500",
  },
  OTHER: { icon: <HelpCircle className="h-4 w-4" />, color: "text-gray-500" },
}

// Map type codes to dictionary keys
const TYPE_KEY_MAP: Record<string, string> = {
  PARENT_PHONE_CALL: "parentPhoneCall",
  PARENT_EMAIL: "parentEmail",
  PARENT_MEETING: "parentMeeting",
  HOME_VISIT: "homeVisit",
  COUNSELOR_REFERRAL: "counselorReferral",
  SOCIAL_WORKER_REFERRAL: "socialWorkerReferral",
  ADMINISTRATOR_MEETING: "administratorMeeting",
  ATTENDANCE_CONTRACT: "attendanceContract",
  TRUANCY_REFERRAL: "truancyReferral",
  COMMUNITY_RESOURCE: "communityResource",
  ACADEMIC_SUPPORT: "academicSupport",
  MENTORSHIP_ASSIGNMENT: "mentorshipAssignment",
  INCENTIVE_PROGRAM: "incentiveProgram",
  OTHER: "other",
}

const STATUS_KEY_MAP: Record<string, string> = {
  SCHEDULED: "scheduled",
  IN_PROGRESS: "inProgress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  ESCALATED: "escalated",
}

const STATUS_COLORS: Record<string, { color: string; bgColor: string }> = {
  SCHEDULED: { color: "text-blue-700", bgColor: "bg-blue-100" },
  IN_PROGRESS: { color: "text-yellow-700", bgColor: "bg-yellow-100" },
  COMPLETED: { color: "text-green-700", bgColor: "bg-green-100" },
  CANCELLED: { color: "text-gray-700", bgColor: "bg-gray-100" },
  ESCALATED: { color: "text-red-700", bgColor: "bg-red-100" },
}

const PRIORITY_KEY_MAP: Record<number, string> = {
  1: "low",
  2: "medium",
  3: "high",
  4: "critical",
}

const PRIORITY_COLORS: Record<number, string> = {
  1: "text-gray-500",
  2: "text-blue-500",
  3: "text-orange-500",
  4: "text-red-500",
}

interface Intervention {
  id: string
  studentId: string
  studentName: string
  className: string | null
  type: string
  title: string
  description: string | null
  status: string
  priority: number
  scheduledDate: string | null
  completedDate: string | null
  assigneeName: string | null
  outcome: string | null
  createdAt: string
  riskLevel: string
}

interface Stats {
  byType: Array<{ type: string; count: number }>
  byStatus: Array<{ status: string; count: number }>
  successRate: number
  averageDaysToComplete: number
}

interface InterventionsContentProps {
  locale?: string
}

export function InterventionsContent({
  locale = "en",
}: InterventionsContentProps) {
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  // Filters
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const { dictionary } = useDictionary()
  const t = (dictionary?.school?.attendance as any)?.interventions as
    | Record<string, any>
    | undefined
  const typeLabels = t?.interventionTypes as Record<string, string> | undefined
  const statusLabels = t?.statusConfig as Record<string, string> | undefined
  const priorityLabels = t?.priorityConfig as Record<string, string> | undefined
  const limit = 15

  const fetchData = useCallback(async () => {
    setIsLoading(true)

    const [interventionsResult, statsResult] = await Promise.all([
      getAllInterventions({
        search: search || undefined,
        status:
          statusFilter !== "all"
            ? (statusFilter as
                | "SCHEDULED"
                | "IN_PROGRESS"
                | "COMPLETED"
                | "CANCELLED"
                | "ESCALATED")
            : undefined,
        type:
          typeFilter !== "all"
            ? (typeFilter as
                | "PARENT_PHONE_CALL"
                | "PARENT_EMAIL"
                | "PARENT_MEETING"
                | "HOME_VISIT"
                | "COUNSELOR_REFERRAL"
                | "SOCIAL_WORKER_REFERRAL"
                | "ADMINISTRATOR_MEETING"
                | "ATTENDANCE_CONTRACT"
                | "TRUANCY_REFERRAL"
                | "COMMUNITY_RESOURCE"
                | "ACADEMIC_SUPPORT"
                | "MENTORSHIP_ASSIGNMENT"
                | "INCENTIVE_PROGRAM"
                | "OTHER")
            : undefined,
        page,
        limit,
      }),
      getInterventionStats(),
    ])

    if (interventionsResult.success && interventionsResult.data) {
      setInterventions(interventionsResult.data.interventions)
      setTotalPages(interventionsResult.data.pagination.totalPages)
      setTotal(interventionsResult.data.pagination.total)
    }

    if (statsResult.success && statsResult.data) {
      setStats(statsResult.data)
    }

    setIsLoading(false)
  }, [search, statusFilter, typeFilter, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    setPage(1)
  }

  const handleTypeChange = (value: string) => {
    setTypeFilter(value)
    setPage(1)
  }

  const handleRefresh = () => {
    startTransition(() => {
      fetchData()
    })
  }

  const getStatusBadge = (status: string) => {
    const colors = STATUS_COLORS[status] || STATUS_COLORS.SCHEDULED
    const label =
      statusLabels?.[STATUS_KEY_MAP[status]] || STATUS_KEY_MAP[status] || status
    return (
      <Badge className={cn(colors.bgColor, colors.color, "font-normal")}>
        {label}
      </Badge>
    )
  }

  const getTypeInfo = (type: string) => {
    const iconConfig =
      INTERVENTION_TYPE_ICONS[type] || INTERVENTION_TYPE_ICONS.OTHER
    const label = typeLabels?.[TYPE_KEY_MAP[type]] || TYPE_KEY_MAP[type] || type
    return { ...iconConfig, label }
  }

  const getPriorityInfo = (priority: number) => {
    const color = PRIORITY_COLORS[priority] || PRIORITY_COLORS[2]
    const label =
      priorityLabels?.[PRIORITY_KEY_MAP[priority]] ||
      PRIORITY_KEY_MAP[priority] ||
      String(priority)
    return { label, color }
  }

  const getRiskBadge = (riskLevel: string) => {
    const colors: Record<string, string> = {
      SATISFACTORY: "bg-green-100 text-green-700",
      AT_RISK: "bg-yellow-100 text-yellow-700",
      MODERATELY_CHRONIC: "bg-orange-100 text-orange-700",
      SEVERELY_CHRONIC: "bg-red-100 text-red-700",
    }
    return colors[riskLevel] || "bg-gray-100 text-gray-700"
  }

  if (isLoading && interventions.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t?.total || "Total"}</CardDescription>
              <CardTitle className="text-2xl">{total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t?.active || "Active"}</CardDescription>
              <CardTitle className="text-2xl text-yellow-600">
                {stats.byStatus
                  .filter(
                    (s) =>
                      s.status === "SCHEDULED" || s.status === "IN_PROGRESS"
                  )
                  .reduce((a, b) => a + b.count, 0)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>
                {t?.successRate || "Success Rate"}
              </CardDescription>
              <CardTitle className="text-2xl text-green-600">
                {stats.successRate.toFixed(1)}%
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>
                {t?.avgDaysComplete || "Avg. Days to Complete"}
              </CardDescription>
              <CardTitle className="text-2xl">
                {stats.averageDaysToComplete.toFixed(1)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder={
                  t?.searchPlaceholder || "Search student or title..."
                }
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="ps-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t?.statusFilter || "Status"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t?.allStatuses || "All Statuses"}
                </SelectItem>
                {Object.entries(STATUS_COLORS).map(([key]) => (
                  <SelectItem key={key} value={key}>
                    {statusLabels?.[STATUS_KEY_MAP[key]] ||
                      STATUS_KEY_MAP[key] ||
                      key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t?.typeFilter || "Type"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t?.allTypes || "All Types"}
                </SelectItem>
                {Object.keys(INTERVENTION_TYPE_ICONS).map((key) => (
                  <SelectItem key={key} value={key}>
                    {typeLabels?.[TYPE_KEY_MAP[key]] ||
                      TYPE_KEY_MAP[key] ||
                      key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isPending}
              aria-label={t?.refresh || "Refresh"}
            >
              <RefreshCw
                className={cn("h-4 w-4", isPending && "animate-spin")}
              />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t?.allInterventions || "All Interventions"}
          </CardTitle>
          <CardDescription>
            {(t?.showingOf || "Showing {shown} of {total} interventions")
              .replace("{shown}", String(interventions.length))
              .replace("{total}", String(total))}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {interventions.length === 0 ? (
            <div className="text-muted-foreground py-12 text-center">
              <FileText className="mx-auto mb-3 h-12 w-12 opacity-50" />
              <p>
                {t?.noInterventionsMatch ||
                  "No interventions match your search"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t?.typeLabel || "Type"}</TableHead>
                      <TableHead>{t?.titleLabel || "Title"}</TableHead>
                      <TableHead>{t?.studentLabel || "Student"}</TableHead>
                      <TableHead>{t?.statusLabel || "Status"}</TableHead>
                      <TableHead>{t?.priorityLabel || "Priority"}</TableHead>
                      <TableHead>{t?.riskLabel || "Risk"}</TableHead>
                      <TableHead>{t?.dateLabel || "Date"}</TableHead>
                      <TableHead>{t?.assigneeLabel || "Assignee"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {interventions.map((intervention) => {
                      const typeInfo = getTypeInfo(intervention.type)
                      const priorityInfo = getPriorityInfo(
                        intervention.priority
                      )

                      return (
                        <TableRow key={intervention.id}>
                          <TableCell>
                            <div
                              className={cn(
                                "flex items-center gap-2",
                                typeInfo.color
                              )}
                            >
                              {typeInfo.icon}
                              <span className="hidden text-sm md:inline">
                                {typeInfo.label}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[200px]">
                              <p className="truncate font-medium">
                                {intervention.title}
                              </p>
                              {intervention.description && (
                                <p className="text-muted-foreground truncate text-xs">
                                  {intervention.description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="text-muted-foreground h-4 w-4" />
                              <div>
                                <p className="text-sm">
                                  {intervention.studentName}
                                </p>
                                {intervention.className && (
                                  <p className="text-muted-foreground text-xs">
                                    {intervention.className}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(intervention.status)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={priorityInfo.color}
                            >
                              {priorityInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={getRiskBadge(intervention.riskLevel)}
                            >
                              {intervention.riskLevel.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {intervention.scheduledDate ? (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(
                                    new Date(intervention.scheduledDate),
                                    "PP"
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {intervention.assigneeName ||
                                t?.unassigned ||
                                "Unassigned"}
                            </span>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between border-t pt-4">
                  <p className="text-muted-foreground text-sm">
                    {(t?.pageOf || "Page {page} of {total}")
                      .replace("{page}", String(page))
                      .replace("{total}", String(totalPages))}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                      {t?.previous || "Previous"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                    >
                      {t?.next || "Next"}
                      <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
