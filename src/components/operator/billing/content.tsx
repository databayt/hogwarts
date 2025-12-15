import { db } from "@/lib/db"
import { formatCurrency, formatDateRange } from "@/lib/i18n-format"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import { EmptyState } from "@/components/operator/common/empty-state"
import { Shell as PageContainer } from "@/components/table/shell"

import type { InvoiceRow } from "./columns"
import { ExportButton } from "./export-button"
import { InvoicesTable } from "./table"

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
  searchParams?: {
    page?: string
    limit?: string
    status?: string
    search?: string
  }
}

async function getInvoicesData(searchParams: Props["searchParams"]) {
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
              stripeInvoiceId: {
                contains: searchParams.search,
                mode: "insensitive" as const,
              },
            },
            {
              school: {
                name: {
                  contains: searchParams.search,
                  mode: "insensitive" as const,
                },
              },
            },
          ],
        }
      : {}),
  }

  const [invoices, total] = await Promise.all([
    db.invoice.findMany({
      where,
      include: {
        school: {
          select: {
            id: true,
            name: true,
          },
        },
        receipts: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    }),
    db.invoice.count({ where }),
  ])

  const rows: InvoiceRow[] = invoices.map((invoice) => ({
    id: invoice.id,
    number: invoice.stripeInvoiceId, // Use stripe invoice ID as the number
    tenantName: invoice.school.name,
    periodStart: invoice.periodStart?.toISOString() || null,
    periodEnd: invoice.periodEnd?.toISOString() || null,
    amount: invoice.amountDue, // Already in cents, convert in display
    status: invoice.status as "open" | "paid" | "void" | "uncollectible",
    createdAt: invoice.createdAt.toISOString(),
  }))

  return {
    rows,
    total,
    limit,
    pageCount: Math.ceil(total / limit),
  }
}

async function getBillingStats() {
  const [
    totalInvoices,
    paidInvoices,
    openInvoices,
    totalRevenue,
    pendingReceipts,
  ] = await Promise.all([
    db.invoice.count(),
    db.invoice.count({ where: { status: "paid" } }),
    db.invoice.count({ where: { status: "open" } }),
    db.invoice.aggregate({
      where: { status: "paid" },
      _sum: { amountPaid: true },
    }),
    db.receipt.count({ where: { status: "pending" } }),
  ])

  return {
    totalInvoices,
    paidInvoices,
    openInvoices,
    totalRevenue: (totalRevenue._sum?.amountPaid || 0) / 100,
    pendingReceipts,
    paymentRate:
      totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 0,
  }
}

export async function BillingContent({
  dictionary,
  lang,
  searchParams,
}: Props) {
  const [invoiceData, stats] = await Promise.all([
    getInvoicesData(searchParams),
    getBillingStats(),
  ])

  const t = dictionary.operator

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-6">
        <div>
          <h2>{t.billing.title}</h2>
          <p className="muted">{t.billing.overview}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t.billing.totalRevenue}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalRevenue, lang)}
              </div>
              <p className="text-muted-foreground text-xs">
                {t.billing.fromPaidInvoices.replace(
                  "{count}",
                  stats.paidInvoices.toString()
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t.billing.paymentRate}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.paymentRate}%</div>
              <p className="text-muted-foreground text-xs">
                {t.billing.ofInvoices
                  .replace("{paid}", stats.paidInvoices.toString())
                  .replace("{total}", stats.totalInvoices.toString())}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t.billing.openInvoices}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.openInvoices}</div>
              <p className="text-muted-foreground text-xs">
                {t.billing.awaitingPayment}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t.billing.pendingReceipts}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingReceipts}</div>
              <p className="text-muted-foreground text-xs">
                {t.billing.awaitingReview}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Invoices and Receipts */}
        <Tabs defaultValue="invoices" className="space-y-4">
          <TabsList>
            <TabsTrigger value="invoices">{t.billing.title}</TabsTrigger>
            <TabsTrigger value="receipts">{t.billing.receipts}</TabsTrigger>
          </TabsList>

          <TabsContent value="invoices" className="space-y-4">
            <div className="flex justify-end">
              <ExportButton
                filters={{
                  status: searchParams?.status,
                  search: searchParams?.search,
                }}
              />
            </div>
            {invoiceData.rows.length > 0 ? (
              <InvoicesTable
                initialData={invoiceData.rows}
                total={invoiceData.total}
                perPage={invoiceData.limit}
                lang={lang}
              />
            ) : (
              <EmptyState
                title={t.billing.noInvoices}
                description={t.billing.invoicesWillAppear}
              />
            )}
          </TabsContent>

          <TabsContent value="receipts" className="space-y-4">
            <EmptyState
              title={t.billing.receipts}
              description={t.billing.receiptsDescription}
            />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  )
}
