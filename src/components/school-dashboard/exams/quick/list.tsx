"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
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
import { useDictionary } from "@/components/internationalization/use-dictionary"

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
  const { dictionary } = useDictionary()
  const t = dictionary?.school?.exams?.quick
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleLaunch = async (id: string) => {
    setIsLoading(id)
    try {
      const result = await launchQuickAssessment(id)
      if (result.success) {
        toast({
          title: t?.toast?.success ?? "Success",
          description: t?.toast?.launched ?? "Assessment launched successfully",
        })
        router.refresh()
      } else {
        toast({
          title: t?.toast?.error ?? "Error",
          description: result.error || "Failed to launch assessment",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: t?.toast?.error ?? "Error",
        description: t?.toast?.unexpected ?? "An unexpected error occurred",
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
          title: t?.toast?.success ?? "Success",
          description: t?.toast?.closed ?? "Assessment closed successfully",
        })
        router.refresh()
      } else {
        toast({
          title: t?.toast?.error ?? "Error",
          description: result.error || "Failed to close assessment",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: t?.toast?.error ?? "Error",
        description: t?.toast?.unexpected ?? "An unexpected error occurred",
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
      <Badge
        variant={variants[status] || "secondary"}
        className={
          (variants[status] || "secondary") === "secondary"
            ? "max-md:bg-background"
            : undefined
        }
      >
        {status.toLowerCase().replace("_", " ")}
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      EXIT_TICKET: t?.form?.types?.exitTicket ?? "Exit Ticket",
      POLL: t?.form?.types?.poll ?? "Poll",
      WARM_UP: t?.form?.types?.warmUp ?? "Warm-Up",
      CHECK_IN: t?.form?.types?.checkIn ?? "Check-In",
    }

    return (
      <Badge variant="outline">
        {labels[type] || type.toLowerCase().replace("_", " ")}
      </Badge>
    )
  }

  if (assessments.length === 0) {
    return (
      <Card className="max-md:bg-muted max-md:border-0">
        <CardContent className="flex min-h-[200px] items-center justify-center">
          <p className="text-muted-foreground">
            {t?.content?.noAssessments ??
              "No quick assessments found. Create your first assessment to get started."}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 max-md:grid-cols-2 max-md:gap-3 md:grid-cols-2 lg:grid-cols-3">
      {assessments.map((assessment) => (
        <Card key={assessment.id} className="max-md:bg-muted max-md:border-0">
          <CardHeader className="max-md:p-4 max-md:pb-2">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-1">
                <CardTitle className="line-clamp-1 max-md:text-sm max-md:leading-5">
                  {assessment.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 max-md:flex-wrap">
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
                      {t?.content?.viewDetails ?? "View Details"}
                    </DropdownMenuItem>
                    {assessment.status === "DRAFT" && (
                      <DropdownMenuItem
                        onClick={() => handleLaunch(assessment.id)}
                        disabled={isLoading === assessment.id}
                      >
                        <Play className="me-2 h-4 w-4" />
                        {t?.content?.launch ?? "Launch"}
                      </DropdownMenuItem>
                    )}
                    {assessment.status === "ACTIVE" && (
                      <DropdownMenuItem
                        onClick={() => handleClose(assessment.id)}
                        disabled={isLoading === assessment.id}
                      >
                        <Square className="me-2 h-4 w-4" />
                        {t?.content?.close ?? "Close"}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2 max-md:px-4 max-md:pb-4">
            <div className="text-muted-foreground grid grid-cols-2 gap-2 text-sm max-md:grid-cols-1 max-md:gap-1 max-md:text-xs">
              <div>
                <span className="font-medium">
                  {t?.list?.class ?? "Class:"}
                </span>{" "}
                {assessment.className}
              </div>
              <div>
                <span className="font-medium">
                  {t?.list?.subject ?? "Subject:"}
                </span>{" "}
                {assessment.name}
              </div>
              <div>
                <span className="font-medium">
                  {t?.list?.questions ?? "Questions:"}
                </span>{" "}
                {assessment.questionCount}
              </div>
              <div>
                <span className="font-medium">
                  {t?.list?.duration ?? "Duration:"}
                </span>{" "}
                {assessment.duration}m
              </div>
              <div className="col-span-2 max-md:col-span-1">
                <span className="font-medium">
                  {t?.list?.responses ?? "Responses:"}
                </span>{" "}
                {assessment.responseCount}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
