import { AlertTriangle, CheckCircle2, ClipboardList, Star } from "lucide-react"

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

import type { CatalogAssignmentRow } from "./assignment-columns"
import { AssignmentTable } from "./assignment-table"

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
}

export async function AssignmentContent({ lang }: Props) {
  const assignments = await db.catalogAssignment.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      lang: true,
      assignmentType: true,
      totalPoints: true,
      estimatedTime: true,
      approvalStatus: true,
      visibility: true,
      usageCount: true,
      averageRating: true,
      status: true,
      tags: true,
      createdAt: true,
    },
  })

  const totalAssignments = assignments.length
  const approvedCount = assignments.filter(
    (a) => a.approvalStatus === "APPROVED"
  ).length
  const pendingCount = assignments.filter(
    (a) => a.approvalStatus === "PENDING"
  ).length
  const avgRating =
    totalAssignments > 0
      ? (
          assignments.reduce((sum, a) => sum + a.averageRating, 0) /
          totalAssignments
        ).toFixed(1)
      : "0"

  const rows: CatalogAssignmentRow[] = assignments.map((a) => ({
    ...a,
    totalPoints: a.totalPoints ? Number(a.totalPoints) : null,
    approvalStatus: a.approvalStatus as string,
    visibility: a.visibility as string,
    status: a.status as string,
  }))

  return (
    <PageContainer>
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Assignments
            </CardTitle>
            <ClipboardList className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalAssignments}</p>
            <CardDescription>Assignment templates</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{approvedCount}</p>
            <CardDescription>Ready for use</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertTriangle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingCount}</p>
            <CardDescription>Awaiting review</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{avgRating}</p>
            <CardDescription>Community rating</CardDescription>
          </CardContent>
        </Card>
      </div>

      <AssignmentTable data={rows} />
    </PageContainer>
  )
}
