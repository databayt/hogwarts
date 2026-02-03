"use client"

import { useCallback, useTransition } from "react"
import {
  ArrowRight,
  Calendar,
  Check,
  Clock,
  MapPin,
  MoreVertical,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { cancelSubstitution, respondToSubstitution } from "../actions"

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

interface SubstitutionListProps {
  records: SubstitutionRecord[]
  onRefresh: () => void
  dictionary?: {
    substitutions?: {
      noRecords?: string
      confirm?: string
      decline?: string
      cancel?: string
      viewDetails?: string
      pending?: string
      confirmed?: string
      declined?: string
      completed?: string
      cancelled?: string
    }
  }
}

export function SubstitutionList({
  records,
  onRefresh,
  dictionary,
}: SubstitutionListProps) {
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const t = dictionary?.substitutions || {}

  const handleConfirm = useCallback(
    (record: SubstitutionRecord) => {
      startTransition(async () => {
        try {
          await respondToSubstitution({
            id: record.id,
            response: "CONFIRMED",
          })
          toast({
            title: "Confirmed",
            description: "Substitution has been confirmed",
          })
          onRefresh()
        } catch {
          toast({
            title: "Error",
            description: "Failed to confirm substitution",
            variant: "destructive",
          })
        }
      })
    },
    [onRefresh, toast]
  )

  const handleDecline = useCallback(
    (record: SubstitutionRecord) => {
      const reason = prompt("Please provide a reason for declining:")
      if (reason === null) return

      startTransition(async () => {
        try {
          await respondToSubstitution({
            id: record.id,
            response: "DECLINED",
            declineReason: reason || undefined,
          })
          toast({
            title: "Declined",
            description: "Substitution has been declined",
          })
          onRefresh()
        } catch {
          toast({
            title: "Error",
            description: "Failed to decline substitution",
            variant: "destructive",
          })
        }
      })
    },
    [onRefresh, toast]
  )

  const handleCancel = useCallback(
    (record: SubstitutionRecord) => {
      if (!confirm("Are you sure you want to cancel this substitution?")) {
        return
      }

      startTransition(async () => {
        try {
          await cancelSubstitution({ id: record.id })
          toast({
            title: "Cancelled",
            description: "Substitution has been cancelled",
          })
          onRefresh()
        } catch {
          toast({
            title: "Error",
            description: "Failed to cancel substitution",
            variant: "destructive",
          })
        }
      })
    },
    [onRefresh, toast]
  )

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PENDING":
        return "outline"
      case "CONFIRMED":
        return "default"
      case "COMPLETED":
        return "secondary"
      case "DECLINED":
      case "CANCELLED":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "CONFIRMED":
      case "COMPLETED":
        return <Check className="h-3 w-3" />
      case "DECLINED":
      case "CANCELLED":
        return <X className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const getDayName = (dayOfWeek: number) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    return days[dayOfWeek] || ""
  }

  if (records.length === 0) {
    return (
      <Card className="py-12 text-center">
        <CardContent>
          <Calendar className="text-muted-foreground mx-auto h-12 w-12" />
          <h3 className="mt-4">{t.noRecords || "No Substitution Records"}</h3>
          <p className="text-muted-foreground mt-2">
            No substitutions have been assigned yet
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {records.map((record) => (
        <Card key={record.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {/* Teacher Arrow */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">
                    {record.originalTeacher.name}
                  </span>
                  <ArrowRight className="text-muted-foreground h-4 w-4" />
                  <span className="font-medium text-green-600">
                    {record.substituteTeacher.name}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusBadgeVariant(record.status)}>
                  {getStatusIcon(record.status)}
                  <span className="ms-1">{record.status}</span>
                </Badge>

                {(record.status === "PENDING" ||
                  record.status === "CONFIRMED") && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={isPending}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {record.status === "PENDING" && (
                        <>
                          <DropdownMenuItem
                            onClick={() => handleConfirm(record)}
                          >
                            <Check className="me-2 h-4 w-4 text-green-600" />
                            {t.confirm || "Confirm"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDecline(record)}
                          >
                            <X className="me-2 h-4 w-4 text-red-600" />
                            {t.decline || "Decline"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem
                        onClick={() => handleCancel(record)}
                        className="text-destructive"
                      >
                        {t.cancel || "Cancel Substitution"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
            <CardDescription className="mt-2 flex flex-wrap gap-4">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(record.slotDate)} (
                {getDayName(record.slot.dayOfWeek)})
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {record.slot.periodName}
              </span>
              {record.slot.roomName && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {record.slot.roomName}
                </span>
              )}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="flex flex-wrap gap-2">
              {record.slot.subjectName && (
                <Badge variant="secondary">{record.slot.subjectName}</Badge>
              )}
              {record.slot.className && (
                <Badge variant="outline">{record.slot.className}</Badge>
              )}
              <Badge variant="outline">{record.absence.type}</Badge>
            </div>

            {record.notes && (
              <p className="text-muted-foreground mt-2 text-sm">
                {record.notes}
              </p>
            )}

            {record.declineReason && (
              <p className="mt-2 text-sm text-red-600">
                Decline reason: {record.declineReason}
              </p>
            )}

            {record.confirmedAt && (
              <p className="text-muted-foreground mt-2 text-xs">
                Confirmed on {new Date(record.confirmedAt).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
