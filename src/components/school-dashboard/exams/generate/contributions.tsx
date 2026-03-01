"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState, useTransition } from "react"
import { CheckCircle2, Clock, FileText, Users, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import type {
  ContributionStats,
  ExamContributionItem,
  TemplateContributionItem,
} from "./actions/contributions"
import {
  getMyExamContributions,
  getMyTemplateContributions,
} from "./actions/contributions"

// ============================================================================
// Status badge styles
// ============================================================================

const STATUS_STYLES: Record<string, string> = {
  PENDING:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
}

// ============================================================================
// Stats Cards
// ============================================================================

function StatsCards({ stats }: { stats: ContributionStats }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total</CardTitle>
          <FileText className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Approved</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats.approved}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
          <Clock className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            {stats.pending}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          <XCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {stats.rejected}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// Exam Contribution List
// ============================================================================

function ExamContributionList({ items }: { items: ExamContributionItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex min-h-[20vh] flex-col items-center justify-center gap-2 py-12">
        <FileText className="text-muted-foreground h-10 w-10" />
        <p className="text-muted-foreground">No exam contributions yet</p>
        <p className="text-muted-foreground text-sm">
          Contribute exams from the generation page to see them here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="flex items-start justify-between gap-4 pt-6">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="truncate font-medium">{item.title}</h4>
                <Badge variant="outline" className="shrink-0">
                  {item.examType}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                {item.subjectName}
              </p>
              <div className="text-muted-foreground flex flex-wrap gap-3 text-xs">
                <span>{item.questionCount} questions</span>
                {item.totalMarks != null && (
                  <span>{item.totalMarks} marks</span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {item.adoptedCount} adopted
                </span>
                <span>
                  {item.createdAt.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              {item.approvalStatus === "REJECTED" && item.rejectionReason && (
                <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                  <strong>Reason:</strong> {item.rejectionReason}
                </div>
              )}
            </div>
            <Badge
              variant="secondary"
              className={STATUS_STYLES[item.approvalStatus] || ""}
            >
              {STATUS_LABELS[item.approvalStatus] || item.approvalStatus}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ============================================================================
// Template Contribution List
// ============================================================================

function TemplateContributionList({
  items,
}: {
  items: TemplateContributionItem[]
}) {
  if (items.length === 0) {
    return (
      <div className="flex min-h-[20vh] flex-col items-center justify-center gap-2 py-12">
        <FileText className="text-muted-foreground h-10 w-10" />
        <p className="text-muted-foreground">No template contributions yet</p>
        <p className="text-muted-foreground text-sm">
          Contribute exam templates to see them here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="flex items-start justify-between gap-4 pt-6">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="truncate font-medium">{item.name}</h4>
                <Badge variant="outline" className="shrink-0">
                  {item.examType}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                {item.subjectName}
              </p>
              <div className="text-muted-foreground flex flex-wrap gap-3 text-xs">
                <span>{item.duration} min</span>
                <span>{item.totalMarks} marks</span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {item.adoptedCount} adopted
                </span>
                <span>
                  {item.createdAt.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              {item.approvalStatus === "REJECTED" && item.rejectionReason && (
                <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                  <strong>Reason:</strong> {item.rejectionReason}
                </div>
              )}
            </div>
            <Badge
              variant="secondary"
              className={STATUS_STYLES[item.approvalStatus] || ""}
            >
              {STATUS_LABELS[item.approvalStatus] || item.approvalStatus}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ============================================================================
// Loading State
// ============================================================================

function ContributionsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-16" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-64" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export default function ExamContributionsContent() {
  const [isPending, startTransition] = useTransition()
  const [examItems, setExamItems] = useState<ExamContributionItem[]>([])
  const [templateItems, setTemplateItems] = useState<
    TemplateContributionItem[]
  >([])
  const [examStats, setExamStats] = useState<ContributionStats>({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    adoptedCount: 0,
  })
  const [templateStats, setTemplateStats] = useState<ContributionStats>({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    adoptedCount: 0,
  })
  const [activeTab, setActiveTab] = useState("exams")
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    startTransition(async () => {
      const [examResult, templateResult] = await Promise.all([
        getMyExamContributions(),
        getMyTemplateContributions(),
      ])

      // Server dates come serialized -- ensure they are Date objects
      setExamItems(
        examResult.items.map((i) => ({
          ...i,
          createdAt: new Date(i.createdAt),
        }))
      )
      setExamStats(examResult.stats)
      setTemplateItems(
        templateResult.items.map((i) => ({
          ...i,
          createdAt: new Date(i.createdAt),
        }))
      )
      setTemplateStats(templateResult.stats)
      setLoaded(true)
    })
  }, [])

  if (!loaded || isPending) {
    return <ContributionsSkeleton />
  }

  const currentStats = activeTab === "exams" ? examStats : templateStats

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">My Contributions</h2>
        <p className="text-muted-foreground text-sm">
          Track exams and templates you contributed to the global catalog.
        </p>
      </div>

      <StatsCards stats={currentStats} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="exams">Exams ({examStats.total})</TabsTrigger>
          <TabsTrigger value="templates">
            Templates ({templateStats.total})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exams" className="mt-4">
          <ExamContributionList items={examItems} />
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <TemplateContributionList items={templateItems} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
