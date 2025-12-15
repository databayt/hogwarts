"use client"

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
import {
  getAllInterventions,
  getInterventionStats,
} from "@/components/platform/attendance/actions"

// Intervention type configuration
const INTERVENTION_TYPES: Record<
  string,
  {
    label: string
    labelAr: string
    icon: React.ReactNode
    color: string
  }
> = {
  PARENT_PHONE_CALL: {
    label: "Phone Call",
    labelAr: "مكالمة هاتفية",
    icon: <Phone className="h-4 w-4" />,
    color: "text-blue-500",
  },
  PARENT_EMAIL: {
    label: "Email",
    labelAr: "بريد إلكتروني",
    icon: <Mail className="h-4 w-4" />,
    color: "text-blue-500",
  },
  PARENT_MEETING: {
    label: "Parent Meeting",
    labelAr: "اجتماع مع ولي الأمر",
    icon: <Users className="h-4 w-4" />,
    color: "text-green-500",
  },
  HOME_VISIT: {
    label: "Home Visit",
    labelAr: "زيارة منزلية",
    icon: <Home className="h-4 w-4" />,
    color: "text-purple-500",
  },
  COUNSELOR_REFERRAL: {
    label: "Counselor",
    labelAr: "إحالة للمرشد",
    icon: <GraduationCap className="h-4 w-4" />,
    color: "text-yellow-500",
  },
  SOCIAL_WORKER_REFERRAL: {
    label: "Social Worker",
    labelAr: "إحالة للأخصائي",
    icon: <UserCheck className="h-4 w-4" />,
    color: "text-orange-500",
  },
  ADMINISTRATOR_MEETING: {
    label: "Admin Meeting",
    labelAr: "اجتماع إداري",
    icon: <Building className="h-4 w-4" />,
    color: "text-red-500",
  },
  ATTENDANCE_CONTRACT: {
    label: "Contract",
    labelAr: "عقد حضور",
    icon: <FileText className="h-4 w-4" />,
    color: "text-red-500",
  },
  TRUANCY_REFERRAL: {
    label: "Truancy Referral",
    labelAr: "إحالة تهرب",
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "text-red-700",
  },
  COMMUNITY_RESOURCE: {
    label: "Community",
    labelAr: "موارد مجتمعية",
    icon: <Building className="h-4 w-4" />,
    color: "text-teal-500",
  },
  ACADEMIC_SUPPORT: {
    label: "Academic Support",
    labelAr: "دعم أكاديمي",
    icon: <GraduationCap className="h-4 w-4" />,
    color: "text-indigo-500",
  },
  MENTORSHIP_ASSIGNMENT: {
    label: "Mentorship",
    labelAr: "إرشاد",
    icon: <Award className="h-4 w-4" />,
    color: "text-pink-500",
  },
  INCENTIVE_PROGRAM: {
    label: "Incentive",
    labelAr: "حوافز",
    icon: <Award className="h-4 w-4" />,
    color: "text-green-500",
  },
  OTHER: {
    label: "Other",
    labelAr: "أخرى",
    icon: <HelpCircle className="h-4 w-4" />,
    color: "text-gray-500",
  },
}

// Status configuration
const STATUS_CONFIG: Record<
  string,
  { label: string; labelAr: string; color: string; bgColor: string }
> = {
  SCHEDULED: {
    label: "Scheduled",
    labelAr: "مجدول",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
  },
  IN_PROGRESS: {
    label: "In Progress",
    labelAr: "قيد التنفيذ",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
  },
  COMPLETED: {
    label: "Completed",
    labelAr: "مكتمل",
    color: "text-green-700",
    bgColor: "bg-green-100",
  },
  CANCELLED: {
    label: "Cancelled",
    labelAr: "ملغى",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
  },
  ESCALATED: {
    label: "Escalated",
    labelAr: "تم التصعيد",
    color: "text-red-700",
    bgColor: "bg-red-100",
  },
}

// Priority configuration
const PRIORITY_CONFIG: Record<
  number,
  { label: string; labelAr: string; color: string }
> = {
  1: { label: "Low", labelAr: "منخفض", color: "text-gray-500" },
  2: { label: "Medium", labelAr: "متوسط", color: "text-blue-500" },
  3: { label: "High", labelAr: "مرتفع", color: "text-orange-500" },
  4: { label: "Critical", labelAr: "حرج", color: "text-red-500" },
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

  const isArabic = locale === "ar"
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
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.SCHEDULED
    return (
      <Badge className={cn(config.bgColor, config.color, "font-normal")}>
        {isArabic ? config.labelAr : config.label}
      </Badge>
    )
  }

  const getTypeInfo = (type: string) => {
    return INTERVENTION_TYPES[type] || INTERVENTION_TYPES.OTHER
  }

  const getPriorityInfo = (priority: number) => {
    return PRIORITY_CONFIG[priority] || PRIORITY_CONFIG[2]
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
    <div className="space-y-6" dir={isArabic ? "rtl" : "ltr"}>
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>
                {isArabic ? "الإجمالي" : "Total"}
              </CardDescription>
              <CardTitle className="text-2xl">{total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{isArabic ? "نشطة" : "Active"}</CardDescription>
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
                {isArabic ? "معدل النجاح" : "Success Rate"}
              </CardDescription>
              <CardTitle className="text-2xl text-green-600">
                {stats.successRate.toFixed(1)}%
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>
                {isArabic ? "متوسط أيام الإكمال" : "Avg. Days to Complete"}
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
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder={
                  isArabic
                    ? "بحث عن طالب أو عنوان..."
                    : "Search student or title..."
                }
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={isArabic ? "الحالة" : "Status"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {isArabic ? "جميع الحالات" : "All Statuses"}
                </SelectItem>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {isArabic ? config.labelAr : config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={isArabic ? "النوع" : "Type"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {isArabic ? "جميع الأنواع" : "All Types"}
                </SelectItem>
                {Object.entries(INTERVENTION_TYPES).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {isArabic ? config.labelAr : config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isPending}
              aria-label={isArabic ? "تحديث" : "Refresh"}
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
            {isArabic ? "جميع التدخلات" : "All Interventions"}
          </CardTitle>
          <CardDescription>
            {isArabic
              ? `عرض ${interventions.length} من ${total} تدخل`
              : `Showing ${interventions.length} of ${total} interventions`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {interventions.length === 0 ? (
            <div className="text-muted-foreground py-12 text-center">
              <FileText className="mx-auto mb-3 h-12 w-12 opacity-50" />
              <p>
                {isArabic
                  ? "لا توجد تدخلات تطابق البحث"
                  : "No interventions match your search"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isArabic ? "النوع" : "Type"}</TableHead>
                      <TableHead>{isArabic ? "العنوان" : "Title"}</TableHead>
                      <TableHead>{isArabic ? "الطالب" : "Student"}</TableHead>
                      <TableHead>{isArabic ? "الحالة" : "Status"}</TableHead>
                      <TableHead>
                        {isArabic ? "الأولوية" : "Priority"}
                      </TableHead>
                      <TableHead>{isArabic ? "المخاطر" : "Risk"}</TableHead>
                      <TableHead>{isArabic ? "التاريخ" : "Date"}</TableHead>
                      <TableHead>{isArabic ? "المكلف" : "Assignee"}</TableHead>
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
                                {isArabic ? typeInfo.labelAr : typeInfo.label}
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
                              {isArabic
                                ? priorityInfo.labelAr
                                : priorityInfo.label}
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
                                (isArabic ? "غير مكلف" : "Unassigned")}
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
                    {isArabic
                      ? `صفحة ${page} من ${totalPages}`
                      : `Page ${page} of ${totalPages}`}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {isArabic ? "السابق" : "Previous"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                    >
                      {isArabic ? "التالي" : "Next"}
                      <ChevronRight className="h-4 w-4" />
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
