import { Shell as PageContainer } from "@/components/table/shell";
import { TenantsTable } from "./table";
import { tenantColumns, type TenantRow } from "./columns";
import { EmptyState } from "@/components/operator/common/empty-state";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  AlertCircle,
  Package,
  TrendingUp,
  DollarSign
} from "lucide-react";
import Link from "next/link";
import type { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";

interface Props {
  dictionary: any; // TODO: Add proper operator dictionary types
  lang: Locale;
  searchParams?: {
    page?: string;
    limit?: string;
    status?: string;
    plan?: string;
    search?: string;
  };
}

async function getTenants(searchParams: Props["searchParams"]) {
  const page = Number(searchParams?.page) || 1;
  const limit = Number(searchParams?.limit) || 10;
  const offset = (page - 1) * limit;

  const where = {
    ...(searchParams?.status && searchParams.status !== "all"
      ? { isActive: searchParams.status === "active" }
      : {}),
    ...(searchParams?.plan && searchParams.plan !== "all"
      ? { planType: searchParams.plan }
      : {}),
    ...(searchParams?.search
      ? {
          OR: [
            { name: { contains: searchParams.search, mode: "insensitive" as const } },
            { domain: { contains: searchParams.search, mode: "insensitive" as const } }
          ]
        }
      : {})
  };

  const [tenants, total] = await Promise.all([
    db.school.findMany({
      where,
      select: {
        id: true,
        name: true,
        domain: true,
        isActive: true,
        planType: true,
        createdAt: true,
        _count: {
          select: {
            students: true,
            teachers: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit
    }),
    db.school.count({ where })
  ]);

  const rows: TenantRow[] = tenants.map(tenant => ({
    id: tenant.id,
    name: tenant.name,
    subdomain: tenant.domain,
    isActive: tenant.isActive,
    planType: tenant.planType as "TRIAL" | "BASIC" | "PREMIUM" | "ENTERPRISE",
    studentCount: tenant._count.students,
    teacherCount: tenant._count.teachers,
    createdAt: tenant.createdAt.toISOString(),
    trialEndsAt: undefined
  }));

  return {
    rows,
    pageCount: Math.ceil(total / limit)
  };
}

async function getTenantStats() {
  const [
    totalTenants,
    activeTenants,
    inactiveTenants,
    trialTenants,
    basicTenants,
    premiumTenants,
    enterpriseTenants,
    totalStudents,
    totalTeachers
  ] = await Promise.all([
    db.school.count(),
    db.school.count({ where: { isActive: true } }),
    db.school.count({ where: { isActive: false } }),
    db.school.count({ where: { planType: "TRIAL" } }),
    db.school.count({ where: { planType: "BASIC" } }),
    db.school.count({ where: { planType: "PREMIUM" } }),
    db.school.count({ where: { planType: "ENTERPRISE" } }),
    db.student.count(),
    db.teacher.count()
  ]);

  const recentSignups = await db.school.count({
    where: {
      createdAt: {
        gte: new Date(new Date().setDate(new Date().getDate() - 30))
      }
    }
  });

  return {
    totalTenants,
    activeTenants,
    inactiveTenants,
    trialTenants,
    basicTenants,
    premiumTenants,
    enterpriseTenants,
    totalStudents,
    totalTeachers,
    recentSignups,
    activeRate: totalTenants > 0 ? Math.round((activeTenants / totalTenants) * 100) : 0,
    growthRate: totalTenants > 0 ? Math.round((recentSignups / totalTenants) * 100) : 0
  };
}

export async function TenantsContent({ dictionary, lang, searchParams }: Props) {
  const [tenantData, stats] = await Promise.all([
    getTenants(searchParams),
    getTenantStats()
  ]);

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-6">
        <div>
          <h2>{dictionary?.title || "Tenants"}</h2>
          <p className="muted">{dictionary?.description || "Manage school tenants and subscriptions"}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTenants}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeTenants} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeRate}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeTenants} of {stats.totalTenants}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Across all schools
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTeachers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Across all schools
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{stats.growthRate}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.recentSignups} new this month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Plan Distribution */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trial</CardTitle>
              <Badge variant="secondary">Free</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.trialTenants}</div>
              <p className="text-xs text-muted-foreground">
                Schools on trial
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Basic</CardTitle>
              <Badge variant="default">$99/mo</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.basicTenants}</div>
              <p className="text-xs text-muted-foreground">
                Basic plan schools
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Premium</CardTitle>
              <Badge variant="default">$299/mo</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.premiumTenants}</div>
              <p className="text-xs text-muted-foreground">
                Premium plan schools
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enterprise</CardTitle>
              <Badge variant="default">Custom</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.enterpriseTenants}</div>
              <p className="text-xs text-muted-foreground">
                Enterprise schools
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tenants Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              {dictionary?.table?.title || "Schools"}
            </h3>
            {stats.inactiveTenants > 0 && (
              <Badge variant="outline" className="text-yellow-600">
                {stats.inactiveTenants} inactive
              </Badge>
            )}
          </div>

          {tenantData.rows.length > 0 ? (
            <TenantsTable
              data={tenantData.rows}
              columns={tenantColumns}
              pageCount={tenantData.pageCount}
            />
          ) : (
            <EmptyState
              title="No schools found"
              description="Schools will appear here once they complete onboarding."
            />
          )}
        </div>

        {/* Trial Expiration Alert */}
        {stats.trialTenants > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Trial Management</CardTitle>
              <CardDescription>
                {stats.trialTenants} schools are currently on trial plans
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-2">
                <p>Monitor trial expirations and convert schools to paid plans:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Schools with expiring trials need follow-up</li>
                  <li>Offer upgrade incentives before trial ends</li>
                  <li>Track conversion rates from trial to paid</li>
                </ul>
                <div className="pt-2">
                  <Link href={`/${lang}/operator/tenants?plan=TRIAL`}>
                    <Button variant="outline" size="sm">
                      View Trial Schools
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}