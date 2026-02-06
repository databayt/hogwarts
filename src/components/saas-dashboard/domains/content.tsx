import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import { EmptyState } from "@/components/saas-dashboard/common/empty-state"
import { Shell as PageContainer } from "@/components/table/shell"

import { domainColumns, type DomainRow } from "./columns"
import { DomainsTable } from "./table"

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

async function getDomainRequestsData(searchParams: Props["searchParams"]) {
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
              domain: {
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

  const [requests, total] = await Promise.all([
    db.domainRequest.findMany({
      where,
      include: {
        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    }),
    db.domainRequest.count({ where }),
  ])

  const rows: DomainRow[] = requests.map((request) => ({
    id: request.id,
    schoolName: request.school.name,
    domain: request.domain,
    status: request.status as "pending" | "approved" | "rejected" | "verified",
    createdAt: request.createdAt.toISOString(),
    notes: request.notes,
  }))

  return {
    rows,
    total,
    limit,
    pageCount: Math.ceil(total / limit),
  }
}

async function getDomainStats() {
  const [
    totalRequests,
    pendingRequests,
    approvedRequests,
    verifiedRequests,
    rejectedRequests,
  ] = await Promise.all([
    db.domainRequest.count(),
    db.domainRequest.count({ where: { status: "pending" } }),
    db.domainRequest.count({ where: { status: "approved" } }),
    db.domainRequest.count({ where: { status: "verified" } }),
    db.domainRequest.count({ where: { status: "rejected" } }),
  ])

  return {
    totalRequests,
    pendingRequests,
    approvedRequests,
    verifiedRequests,
    rejectedRequests,
    approvalRate:
      totalRequests > 0
        ? Math.round(
            ((approvedRequests + verifiedRequests) / totalRequests) * 100
          )
        : 0,
  }
}

export async function DomainsContent({
  dictionary,
  lang,
  searchParams,
}: Props) {
  const t = dictionary?.operator?.domains

  const [domainData, stats] = await Promise.all([
    getDomainRequestsData(searchParams),
    getDomainStats(),
  ])

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-6">
        <div>
          <h2>{t?.title || "Domain Requests"}</h2>
          <p className="muted">
            {t?.description || "Manage custom domain requests for schools"}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t?.totalRequests || "Total Requests"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRequests}</div>
              <p className="text-muted-foreground text-xs">
                {t?.allTime || "All time"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t?.pendingReview || "Pending Review"}
              </CardTitle>
              <Badge variant="default">
                {t?.actionRequired || "Action Required"}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingRequests}</div>
              <p className="text-muted-foreground text-xs">
                {t?.awaitingApproval || "Awaiting approval"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t?.approved || "Approved"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approvedRequests}</div>
              <p className="text-muted-foreground text-xs">
                {t?.readyForDNS || "Ready for DNS setup"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t?.verified || "Verified"}
              </CardTitle>
              <Badge variant="outline" className="text-green-600">
                {dictionary?.operator?.common?.status?.active || "Active"}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.verifiedRequests}</div>
              <p className="text-muted-foreground text-xs">
                {t?.dnsConfigured || "DNS configured"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t?.approvalRate || "Approval Rate"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approvalRate}%</div>
              <p className="text-muted-foreground text-xs">
                {stats.approvedRequests + stats.verifiedRequests}{" "}
                {dictionary?.operator?.tenants?.of || "of"}{" "}
                {stats.totalRequests}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Domain Requests Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              {t?.domainRequests || "Domain Requests"}
            </h3>
            {stats.pendingRequests > 0 && (
              <Badge variant="default">
                {stats.pendingRequests}{" "}
                {t?.pendingReview?.toLowerCase() || "pending review"}
              </Badge>
            )}
          </div>

          {domainData.rows.length > 0 ? (
            <DomainsTable
              initialData={domainData.rows}
              columns={domainColumns}
              total={domainData.total}
              perPage={domainData.limit}
            />
          ) : (
            <EmptyState
              title={t?.noDomainRequests || "No domain requests"}
              description={
                t?.domainRequestsWillAppear ||
                "New domain requests from schools will appear here."
              }
            />
          )}
        </div>

        {/* DNS Configuration Help */}
        {stats.approvedRequests > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t?.dnsConfigRequired || "DNS Configuration Required"}
              </CardTitle>
              <CardDescription>
                {stats.approvedRequests}{" "}
                {t?.dnsConfigDescription
                  ? t.dnsConfigDescription.replace(
                      "{count}",
                      String(stats.approvedRequests)
                    )
                  : "domain(s) are approved and waiting for DNS configuration"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>
                  {t?.configureDNS ||
                    "For each approved domain, configure the following DNS records:"}
                </p>
                <ul className="text-muted-foreground list-inside list-disc space-y-1">
                  <li>{t?.aRecord || "A record pointing to our IP address"}</li>
                  <li>{t?.cnameRecord || "CNAME record for www subdomain"}</li>
                  <li>
                    {t?.txtRecord || "TXT record for domain verification"}
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  )
}
