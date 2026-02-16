import { CheckCircle2, Clock, Layers, XCircle } from "lucide-react"

import { db } from "@/lib/db"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import { Shell as PageContainer } from "@/components/table/shell"

import { ApprovalTable } from "./approval-table"

export interface PendingItem {
  id: string
  contentType:
    | "CatalogQuestion"
    | "CatalogMaterial"
    | "CatalogAssignment"
    | "LessonVideo"
  title: string
  description: string | null
  contributedBy: string | null
  createdAt: Date
}

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
}

export async function ApprovalContent({ lang }: Props) {
  const [
    pendingQuestions,
    pendingMaterials,
    pendingAssignments,
    pendingVideos,
  ] = await Promise.all([
    db.catalogQuestion.findMany({
      where: { approvalStatus: "PENDING" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        questionText: true,
        contributedBy: true,
        createdAt: true,
      },
    }),
    db.catalogMaterial.findMany({
      where: { approvalStatus: "PENDING" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        contributedBy: true,
        createdAt: true,
      },
    }),
    db.catalogAssignment.findMany({
      where: { approvalStatus: "PENDING" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        contributedBy: true,
        createdAt: true,
      },
    }),
    db.lessonVideo.findMany({
      where: { approvalStatus: "PENDING" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        userId: true,
        createdAt: true,
      },
    }),
  ])

  const items: PendingItem[] = [
    ...pendingQuestions.map((q) => ({
      id: q.id,
      contentType: "CatalogQuestion" as const,
      title:
        q.questionText.length > 100
          ? q.questionText.slice(0, 100) + "..."
          : q.questionText,
      description: null,
      contributedBy: q.contributedBy,
      createdAt: q.createdAt,
    })),
    ...pendingMaterials.map((m) => ({
      id: m.id,
      contentType: "CatalogMaterial" as const,
      title: m.title,
      description: m.description,
      contributedBy: m.contributedBy,
      createdAt: m.createdAt,
    })),
    ...pendingAssignments.map((a) => ({
      id: a.id,
      contentType: "CatalogAssignment" as const,
      title: a.title,
      description: a.description,
      contributedBy: a.contributedBy,
      createdAt: a.createdAt,
    })),
    ...pendingVideos.map((v) => ({
      id: v.id,
      contentType: "LessonVideo" as const,
      title: v.title,
      description: v.description,
      contributedBy: v.userId,
      createdAt: v.createdAt,
    })),
  ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

  const totalPending = items.length
  const questionCount = pendingQuestions.length
  const materialCount = pendingMaterials.length
  const assignmentCount = pendingAssignments.length
  const videoCount = pendingVideos.length

  return (
    <PageContainer>
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalPending}</p>
            <CardDescription>Items awaiting review</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions</CardTitle>
            <Layers className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{questionCount}</p>
            <CardDescription>Pending questions</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Materials & Assignments
            </CardTitle>
            <CheckCircle2 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {materialCount + assignmentCount}
            </p>
            <CardDescription>
              {materialCount} materials, {assignmentCount} assignments
            </CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Videos</CardTitle>
            <XCircle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{videoCount}</p>
            <CardDescription>Pending videos</CardDescription>
          </CardContent>
        </Card>
      </div>

      <ApprovalTable data={items} />
    </PageContainer>
  )
}
