import { Upload } from "lucide-react"

import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import { EmptyState } from "@/components/operator/common/empty-state"
import { FileUploader } from "@/components/operator/file-uploader"
import { Shell as PageContainer } from "@/components/table/shell"

import { getReceiptColumns, type ReceiptRow } from "./columns"
import { ReceiptsTable } from "./table"

interface Props {
  dictionary: any
  lang: Locale
  searchParams?: {
    page?: string
    limit?: string
    status?: string
    search?: string
  }
}

async function getReceiptsData(searchParams: Props["searchParams"]) {
  const page = Number(searchParams?.page) || 1
  const limit = Number(searchParams?.limit) || 10
  const offset = (page - 1) * limit

  const where = {
    ...(searchParams?.status && searchParams.status !== "all"
      ? { status: searchParams.status }
      : {}),
    ...(searchParams?.search
      ? {
          OR: [
            {
              invoice: {
                stripeInvoiceId: {
                  contains: searchParams.search,
                  mode: "insensitive" as const,
                },
              },
            },
            {
              invoice: {
                school: {
                  name: {
                    contains: searchParams.search,
                    mode: "insensitive" as const,
                  },
                },
              },
            },
          ],
        }
      : {}),
  }

  const [receipts, total] = await Promise.all([
    db.receipt.findMany({
      where,
      include: {
        invoice: {
          select: {
            id: true,
            stripeInvoiceId: true,
            school: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    }),
    db.receipt.count({ where }),
  ])

  const rows: ReceiptRow[] = receipts.map((receipt) => ({
    id: receipt.id,
    schoolName: receipt.invoice.school.name,
    invoiceNumber: receipt.invoice.stripeInvoiceId,
    amount: receipt.amount,
    fileUrl: receipt.fileUrl,
    fileName: receipt.fileName,
    status: receipt.status as "pending" | "approved" | "rejected",
    uploadedAt: receipt.createdAt.toISOString(),
    reviewedAt: receipt.reviewedAt?.toISOString() || null,
    notes: receipt.notes,
  }))

  return {
    rows,
    total,
    limit,
    pageCount: Math.ceil(total / limit),
  }
}

async function getReceiptStats() {
  const [total, pending, approved, rejected] = await Promise.all([
    db.receipt.count(),
    db.receipt.count({ where: { status: "pending" } }),
    db.receipt.count({ where: { status: "approved" } }),
    db.receipt.count({ where: { status: "rejected" } }),
  ])

  return {
    total,
    pending,
    approved,
    rejected,
    approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
  }
}

export async function ReceiptsContent({
  dictionary,
  lang,
  searchParams,
}: Props) {
  const [receiptData, stats] = await Promise.all([
    getReceiptsData(searchParams),
    getReceiptStats(),
  ])

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2>{dictionary?.title || "Payment Receipts"}</h2>
            <p className="muted">
              {dictionary?.description ||
                "Review and approve manual payment receipts"}
            </p>
          </div>
          <Button>
            <Upload className="me-2 h-4 w-4" />
            Upload Receipt
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Receipts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-muted-foreground text-xs">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-muted-foreground text-xs">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approved}</div>
              <p className="text-muted-foreground text-xs">Processed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Approval Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approvalRate}%</div>
              <p className="text-muted-foreground text-xs">
                {stats.approved} of {stats.total}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Receipts Table */}
        <div className="space-y-4">
          {receiptData.rows.length > 0 ? (
            <ReceiptsTable
              initialData={receiptData.rows}
              columns={getReceiptColumns(lang)}
              total={receiptData.total}
              perPage={receiptData.limit}
            />
          ) : (
            <EmptyState
              title="No receipts"
              description="Upload payment receipts for manual review and approval."
            />
          )}
        </div>
      </div>
    </PageContainer>
  )
}
