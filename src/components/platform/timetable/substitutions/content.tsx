"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import {
  AlertTriangle,
  Calendar,
  Check,
  Clock,
  Plus,
  RefreshCw,
  Search,
  UserMinus,
  Users,
  X,
} from "lucide-react"

import { useToast } from "@/hooks/use-toast"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { getSubstitutionRecords, getTeacherAbsences } from "../actions"
import { ABSENCE_TYPES } from "../constants"
import { AbsenceFormDialog } from "./absence-form"
import { SubstitutionList } from "./substitution-list"

interface SubstitutionsContentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dictionary?: Record<string, any>
  termId: string
}

interface Absence {
  id: string
  teacherId: string
  teacherName: string
  startDate: Date
  endDate: Date
  absenceType: string
  reason: string | null
  status: string
  isAllDay: boolean
  substitutions: Array<{
    id: string
    status: string
    slotDate: Date
    substituteId: string
    substituteName: string
    periodName: string
    className: string | undefined
    subjectName: string | undefined
  }>
}

interface SubstitutionRecord {
  id: string
  slotDate: Date
  status: string
  notes: string | null
  declineReason: string | null
  confirmedAt: Date | null
  originalTeacher: { id: string; name: string }
  substituteTeacher: { id: string; name: string }
  slot: {
    id: string
    dayOfWeek: number
    periodName: string
    periodTime: string
    className: string | undefined
    subjectName: string | undefined
    roomName: string | undefined
  }
  absence: { type: string; reason: string | null }
}

export function SubstitutionsContent({
  dictionary,
  termId,
}: SubstitutionsContentProps) {
  const [absences, setAbsences] = useState<Absence[]>([])
  const [records, setRecords] = useState<SubstitutionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState("absences")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [absenceDialogOpen, setAbsenceDialogOpen] = useState(false)
  const { toast } = useToast()

  const t = dictionary?.substitutions || {}

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [absencesResult, recordsResult] = await Promise.all([
        getTeacherAbsences({
          status: statusFilter !== "all" ? statusFilter : undefined,
        }),
        getSubstitutionRecords({
          status: statusFilter !== "all" ? statusFilter : undefined,
        }),
      ])
      setAbsences(absencesResult.absences as Absence[])
      setRecords(recordsResult.records as SubstitutionRecord[])
    } catch {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [statusFilter, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRefresh = useCallback(() => {
    startTransition(() => {
      loadData()
    })
  }, [loadData])

  const filteredAbsences = absences.filter((absence) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      absence.teacherName.toLowerCase().includes(query) ||
      absence.absenceType.toLowerCase().includes(query)
    )
  })

  const filteredRecords = records.filter((record) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      record.originalTeacher.name.toLowerCase().includes(query) ||
      record.substituteTeacher.name.toLowerCase().includes(query) ||
      record.slot.subjectName?.toLowerCase().includes(query)
    )
  })

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PENDING":
        return "outline"
      case "APPROVED":
      case "CONFIRMED":
        return "default"
      case "COMPLETED":
        return "secondary"
      case "DECLINED":
      case "REJECTED":
      case "CANCELLED":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getAbsenceTypeLabel = (type: string) => {
    const typeInfo = ABSENCE_TYPES[type as keyof typeof ABSENCE_TYPES]
    return typeInfo?.label || type
  }

  const formatDateRange = (start: Date, end: Date) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const sameDay = startDate.toDateString() === endDate.toDateString()

    if (sameDay) {
      return startDate.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    }

    return `${startDate.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })} - ${endDate.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })}`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2>{t.title || "Substitution Management"}</h2>
          <p className="text-muted-foreground">
            {t.description ||
              "Manage teacher absences and substitute assignments"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isPending}
          >
            <RefreshCw
              className={`me-2 h-4 w-4 ${isPending ? "animate-spin" : ""}`}
            />
            {t.refresh || "Refresh"}
          </Button>
          <Button onClick={() => setAbsenceDialogOpen(true)}>
            <Plus className="me-2 h-4 w-4" />
            {t.newAbsence || "Report Absence"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder={t.search || "Search teachers or subjects..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t.filterByStatus || "Filter by status"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t.allStatuses || "All Statuses"}
            </SelectItem>
            <SelectItem value="PENDING">{t.pending || "Pending"}</SelectItem>
            <SelectItem value="APPROVED">{t.approved || "Approved"}</SelectItem>
            <SelectItem value="CONFIRMED">
              {t.confirmed || "Confirmed"}
            </SelectItem>
            <SelectItem value="DECLINED">{t.declined || "Declined"}</SelectItem>
            <SelectItem value="COMPLETED">
              {t.completed || "Completed"}
            </SelectItem>
            <SelectItem value="CANCELLED">
              {t.cancelled || "Cancelled"}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="absences" className="flex items-center gap-2">
            <UserMinus className="h-4 w-4" />
            {t.absences || "Absences"}
            {absences.length > 0 && (
              <Badge variant="secondary" className="ms-1">
                {absences.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="records" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t.records || "Substitutions"}
            {records.length > 0 && (
              <Badge variant="secondary" className="ms-1">
                {records.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="absences" className="mt-4">
          {filteredAbsences.length === 0 ? (
            <Card className="py-12 text-center">
              <CardContent>
                <UserMinus className="text-muted-foreground mx-auto h-12 w-12" />
                <h3 className="mt-4">{t.noAbsences || "No Absences"}</h3>
                <p className="text-muted-foreground mt-2">
                  No teacher absences have been reported yet
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredAbsences.map((absence) => (
                <Card key={absence.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {absence.teacherName}
                          <Badge
                            variant={getStatusBadgeVariant(absence.status)}
                          >
                            {absence.status}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {getAbsenceTypeLabel(absence.absenceType)}
                          {absence.reason && ` - ${absence.reason}`}
                        </CardDescription>
                      </div>
                      <div className="text-end">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4" />
                          {formatDateRange(absence.startDate, absence.endDate)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  {absence.substitutions.length > 0 && (
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-muted-foreground text-sm font-medium">
                          Substitutes Assigned: {absence.substitutions.length}
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {absence.substitutions.slice(0, 6).map((sub) => (
                            <div
                              key={sub.id}
                              className="bg-muted flex items-center justify-between rounded-md p-2 text-sm"
                            >
                              <div>
                                <p className="font-medium">{sub.periodName}</p>
                                <p className="text-muted-foreground text-xs">
                                  {sub.substituteName}
                                </p>
                              </div>
                              <Badge
                                variant={getStatusBadgeVariant(sub.status)}
                                className="text-xs"
                              >
                                {sub.status === "CONFIRMED" ? (
                                  <Check className="h-3 w-3" />
                                ) : sub.status === "DECLINED" ? (
                                  <X className="h-3 w-3" />
                                ) : (
                                  <Clock className="h-3 w-3" />
                                )}
                              </Badge>
                            </div>
                          ))}
                        </div>
                        {absence.substitutions.length > 6 && (
                          <p className="text-muted-foreground text-xs">
                            +{absence.substitutions.length - 6} more
                          </p>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="records" className="mt-4">
          <SubstitutionList
            records={filteredRecords}
            onRefresh={loadData}
            dictionary={dictionary}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AbsenceFormDialog
        open={absenceDialogOpen}
        onOpenChange={setAbsenceDialogOpen}
        onSuccess={loadData}
        dictionary={dictionary}
      />
    </div>
  )
}
