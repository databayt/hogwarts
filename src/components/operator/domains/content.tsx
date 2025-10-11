import { Shell as PageContainer } from "@/components/table/shell";
import { DomainsTable } from "./table";
import { domainColumns, type DomainRow } from "./columns";
import { EmptyState } from "@/components/operator/common/empty-state";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";

interface Props {
  dictionary: any; // TODO: Add proper operator dictionary types
  lang: Locale;
  searchParams?: {
    page?: string;
    limit?: string;
    status?: string;
    search?: string;
  };
}

async function getDomainRequests(searchParams: Props["searchParams"]) {
  const page = Number(searchParams?.page) || 1;
  const limit = Number(searchParams?.limit) || 10;
  const offset = (page - 1) * limit;

  const where = {
    ...(searchParams?.status && searchParams.status !== "all"
      ? { status: searchParams.status }
      : {}),
    ...(searchParams?.search
      ? {
          OR: [
            { domain: { contains: searchParams.search, mode: "insensitive" as const } },
            { school: { name: { contains: searchParams.search, mode: "insensitive" as const } } }
          ]
        }
      : {})
  };

  const [requests, total] = await Promise.all([
    db.domainRequest.findMany({
      where,
      include: {
        school: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit
    }),
    db.domainRequest.count({ where })
  ]);

  const rows: DomainRow[] = requests.map(request => ({
    id: request.id,
    schoolName: request.school.name,
    domain: request.domain,
    status: request.status as "pending" | "approved" | "rejected" | "verified",
    createdAt: request.createdAt.toISOString(),
    notes: request.notes
  }));

  return {
    rows,
    pageCount: Math.ceil(total / limit)
  };
}

async function getDomainStats() {
  const [
    totalRequests,
    pendingRequests,
    approvedRequests,
    verifiedRequests,
    rejectedRequests
  ] = await Promise.all([
    db.domainRequest.count(),
    db.domainRequest.count({ where: { status: "pending" } }),
    db.domainRequest.count({ where: { status: "approved" } }),
    db.domainRequest.count({ where: { status: "verified" } }),
    db.domainRequest.count({ where: { status: "rejected" } })
  ]);

  return {
    totalRequests,
    pendingRequests,
    approvedRequests,
    verifiedRequests,
    rejectedRequests,
    approvalRate: totalRequests > 0
      ? Math.round(((approvedRequests + verifiedRequests) / totalRequests) * 100)
      : 0
  };
}

export async function DomainsContent({ dictionary, lang, searchParams }: Props) {
  const [domainData, stats] = await Promise.all([
    getDomainRequests(searchParams),
    getDomainStats()
  ]);

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-6">
        <div>
          <h2>{dictionary?.title || "Domain Requests"}</h2>
          <p className="muted">{dictionary?.description || "Manage custom domain requests for schools"}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRequests}</div>
              <p className="text-xs text-muted-foreground">
                All time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Badge variant="default">Action Required</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingRequests}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approvedRequests}</div>
              <p className="text-xs text-muted-foreground">
                Ready for DNS setup
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified</CardTitle>
              <Badge variant="outline" className="text-green-600">Active</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.verifiedRequests}</div>
              <p className="text-xs text-muted-foreground">
                DNS configured
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approvalRate}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.approvedRequests + stats.verifiedRequests} of {stats.totalRequests}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Domain Requests Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              {dictionary?.table?.title || "Domain Requests"}
            </h3>
            {stats.pendingRequests > 0 && (
              <Badge variant="default">
                {stats.pendingRequests} pending review
              </Badge>
            )}
          </div>

          {domainData.rows.length > 0 ? (
            <DomainsTable
              data={domainData.rows}
              columns={domainColumns}
              pageCount={domainData.pageCount}
            />
          ) : (
            <EmptyState
              title="No domain requests"
              description="New domain requests from schools will appear here."
            />
          )}
        </div>

        {/* DNS Configuration Help */}
        {stats.approvedRequests > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">DNS Configuration Required</CardTitle>
              <CardDescription>
                {stats.approvedRequests} domain(s) are approved and waiting for DNS configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-2">
                <p>For each approved domain, configure the following DNS records:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>A record pointing to our IP address</li>
                  <li>CNAME record for www subdomain</li>
                  <li>TXT record for domain verification</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}


