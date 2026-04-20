// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

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
  contentType: "Question" | "Material" | "Assignment" | "Book" | "Video"
  title: string
  description: string | null
  contributedBy: string | null
  createdAt: Date
  // Video-specific fields surfaced to the DEVELOPER approval dialog so it can
  // pre-fill the proposer's suggested visibility/pricing before confirming.
  videoMeta?: {
    visibility: "PRIVATE" | "SCHOOL" | "PUBLIC" | "PAID"
    price: number | null
    currency: string | null
    isFeatured: boolean
    ownerName: string | null
    ownerRole: string | null
  }
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
    pendingBooks,
    pendingVideos,
  ] = await Promise.all([
    db.question.findMany({
      where: { approvalStatus: "PENDING" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        questionText: true,
        contributedBy: true,
        createdAt: true,
      },
    }),
    db.material.findMany({
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
    db.assignment.findMany({
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
    db.book.findMany({
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
    db.video.findMany({
      where: { approvalStatus: "PENDING" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        userId: true,
        createdAt: true,
        visibility: true,
        price: true,
        currency: true,
        isFeatured: true,
        user: {
          select: {
            username: true,
            email: true,
            role: true,
          },
        },
      },
    }),
  ])

  const items: PendingItem[] = [
    ...pendingQuestions.map((q) => ({
      id: q.id,
      contentType: "Question" as const,
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
      contentType: "Material" as const,
      title: m.title,
      description: m.description,
      contributedBy: m.contributedBy,
      createdAt: m.createdAt,
    })),
    ...pendingAssignments.map((a) => ({
      id: a.id,
      contentType: "Assignment" as const,
      title: a.title,
      description: a.description,
      contributedBy: a.contributedBy,
      createdAt: a.createdAt,
    })),
    ...pendingBooks.map((b) => ({
      id: b.id,
      contentType: "Book" as const,
      title: b.title,
      description: b.description,
      contributedBy: b.contributedBy,
      createdAt: b.createdAt,
    })),
    ...pendingVideos.map((v) => ({
      id: v.id,
      contentType: "Video" as const,
      title: v.title,
      description: v.description,
      contributedBy: v.userId,
      createdAt: v.createdAt,
      videoMeta: {
        visibility: v.visibility as "PRIVATE" | "SCHOOL" | "PUBLIC" | "PAID",
        price: v.price,
        currency: v.currency,
        isFeatured: v.isFeatured,
        ownerName: v.user?.username ?? v.user?.email ?? null,
        ownerRole: v.user?.role ?? null,
      },
    })),
  ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

  const totalPending = items.length
  const questionCount = pendingQuestions.length
  const materialCount = pendingMaterials.length
  const assignmentCount = pendingAssignments.length
  const bookCount = pendingBooks.length
  const videoCount = pendingVideos.length

  return (
    <PageContainer>
      <div className="grid gap-4 md:grid-cols-5">
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
            <CardTitle className="text-sm font-medium">Books</CardTitle>
            <CheckCircle2 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{bookCount}</p>
            <CardDescription>Pending books</CardDescription>
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
