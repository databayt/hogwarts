import { BarChart3, CheckCircle2, Download, FileText } from "lucide-react"

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

import type { CatalogMaterialRow } from "./material-columns"
import { MaterialTable } from "./material-table"

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
}

export async function MaterialContent({ lang }: Props) {
  const materials = await db.catalogMaterial.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      lang: true,
      fileUrl: true,
      externalUrl: true,
      fileSize: true,
      approvalStatus: true,
      visibility: true,
      usageCount: true,
      downloadCount: true,
      averageRating: true,
      status: true,
      tags: true,
      createdAt: true,
    },
  })

  const totalMaterials = materials.length
  const approvedCount = materials.filter(
    (m) => m.approvalStatus === "APPROVED"
  ).length
  const totalDownloads = materials.reduce((sum, m) => sum + m.downloadCount, 0)
  const avgRating =
    totalMaterials > 0
      ? (
          materials.reduce((sum, m) => sum + m.averageRating, 0) /
          totalMaterials
        ).toFixed(1)
      : "0"

  const rows: CatalogMaterialRow[] = materials.map((m) => ({
    ...m,
    type: m.type as string,
    approvalStatus: m.approvalStatus as string,
    visibility: m.visibility as string,
    status: m.status as string,
  }))

  return (
    <PageContainer>
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Materials
            </CardTitle>
            <FileText className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalMaterials}</p>
            <CardDescription>Resources in catalog</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{approvedCount}</p>
            <CardDescription>Ready for distribution</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
            <Download className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalDownloads}</p>
            <CardDescription>Total downloads</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <BarChart3 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{avgRating}</p>
            <CardDescription>Community rating</CardDescription>
          </CardContent>
        </Card>
      </div>

      <MaterialTable data={rows} />
    </PageContainer>
  )
}
