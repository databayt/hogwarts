"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Play, Square } from "lucide-react"

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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"

import { closeQuickAssessment, launchQuickAssessment } from "./actions"
import type { QuickAssessmentSummary } from "./actions/types"

interface QuickAssessmentListProps {
  assessments: QuickAssessmentSummary[]
  canManage: boolean
}

export function QuickAssessmentList({
  assessments,
  canManage,
}: QuickAssessmentListProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleLaunch = async (id: string) => {
    setIsLoading(id)
    try {
      const result = await launchQuickAssessment(id)
      if (result.success) {
        toast({
          title: "Success",
          description: "Assessment launched successfully",
        })
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to launch assessment",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(null)
    }
  }

  const handleClose = async (id: string) => {
    setIsLoading(id)
    try {
      const result = await closeQuickAssessment(id)
      if (result.success) {
        toast({
          title: "Success",
          description: "Assessment closed successfully",
        })
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to close assessment",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      DRAFT: "secondary",
      ACTIVE: "default",
      CLOSED: "destructive",
      ARCHIVED: "secondary",
    }

    return (
      <Badge variant={variants[status] || "secondary"}>
        {status.toLowerCase().replace("_", " ")}
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      EXIT_TICKET: "Exit Ticket",
      POLL: "Poll",
      WARM_UP: "Warm-Up",
      CHECK_IN: "Check-In",
    }

    return (
      <Badge variant="outline">
        {labels[type] || type.toLowerCase().replace("_", " ")}
      </Badge>
    )
  }

  if (assessments.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-[200px] items-center justify-center">
          <p className="text-muted-foreground">
            No quick assessments found. Create your first assessment to get
            started.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {assessments.map((assessment) => (
        <Card key={assessment.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-1">
                <CardTitle className="line-clamp-1">
                  {assessment.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  {getTypeBadge(assessment.type)}
                  {getStatusBadge(assessment.status)}
                </CardDescription>
              </div>
              {canManage && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(`/exams/quick/${assessment.id}`)
                      }
                    >
                      View Details
                    </DropdownMenuItem>
                    {assessment.status === "DRAFT" && (
                      <DropdownMenuItem
                        onClick={() => handleLaunch(assessment.id)}
                        disabled={isLoading === assessment.id}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Launch
                      </DropdownMenuItem>
                    )}
                    {assessment.status === "ACTIVE" && (
                      <DropdownMenuItem
                        onClick={() => handleClose(assessment.id)}
                        disabled={isLoading === assessment.id}
                      >
                        <Square className="mr-2 h-4 w-4" />
                        Close
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-muted-foreground grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">Class:</span>{" "}
                {assessment.className}
              </div>
              <div>
                <span className="font-medium">Subject:</span>{" "}
                {assessment.subjectName}
              </div>
              <div>
                <span className="font-medium">Questions:</span>{" "}
                {assessment.questionCount}
              </div>
              <div>
                <span className="font-medium">Duration:</span>{" "}
                {assessment.duration}m
              </div>
              <div className="col-span-2">
                <span className="font-medium">Responses:</span>{" "}
                {assessment.responseCount}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
