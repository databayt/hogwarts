"use client";

/**
 * Featured tenants component
 *
 * Displays highlighted or featured tenants for the operator dashboard.
 */

import { TenantCard, TenantStatsCard, TenantBillingCard } from "./card";
import { Building2, Users, TrendingUp, AlertCircle } from "lucide-react";
import type { Tenant, TenantMetrics, TenantBilling } from "./types";
import { getTenantHealth, isTenantOnTrial, getTrialDaysRemaining } from "./util";

interface FeaturedTenantsProps {
  tenants: Tenant[];
  metrics?: Record<string, TenantMetrics>;
  billing?: Record<string, TenantBilling>;
  maxItems?: number;
  onTenantClick?: (tenantId: string) => void;
}

/**
 * Featured tenants with quick stats
 */
export function FeaturedTenants({
  tenants,
  metrics,
  billing,
  maxItems = 6,
  onTenantClick,
}: FeaturedTenantsProps) {
  const featuredTenants = tenants.slice(0, maxItems);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3>Featured Tenants</h3>
          <p className="muted">Quick overview of your most important tenants</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {featuredTenants.map((tenant) => (
          <TenantCard
            key={tenant.id}
            tenant={tenant}
            metrics={metrics?.[tenant.id]}
            billing={billing?.[tenant.id]}
            showActions
            onViewDetails={onTenantClick}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Recently created tenants
 */
export function RecentTenants({ tenants, maxItems = 5 }: { tenants: Tenant[]; maxItems?: number }) {
  const recentTenants = [...tenants]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, maxItems);

  return (
    <div className="space-y-4">
      <h4>Recent Tenants</h4>
      <div className="space-y-2">
        {recentTenants.map((tenant) => (
          <div
            key={tenant.id}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                <Building2 className="size-5 text-primary" />
              </div>
              <div>
                <h6>{tenant.name}</h6>
                <small className="muted">{tenant.domain}</small>
              </div>
            </div>
            <small className="muted">
              {new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
                Math.ceil(
                  (new Date(tenant.createdAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                ),
                "day"
              )}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Tenants requiring attention (trial ending, overdue, etc.)
 */
export function TenantsRequiringAttention({
  tenants,
  billing,
}: {
  tenants: Tenant[];
  billing?: Record<string, TenantBilling>;
}) {
  // Filter tenants that need attention
  const attentionTenants = tenants.filter((tenant) => {
    const tenantBilling = billing?.[tenant.id];
    const health = getTenantHealth(tenant.isActive, tenantBilling);
    const trialEndingSoon = tenantBilling?.trialEndsAt
      ? isTenantOnTrial(tenantBilling.trialEndsAt) && getTrialDaysRemaining(tenantBilling.trialEndsAt) <= 3
      : false;

    return health !== "healthy" || trialEndingSoon;
  });

  if (attentionTenants.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-green-500/10 mx-auto">
          <TrendingUp className="size-6 text-green-600" />
        </div>
        <h5 className="mt-4">All systems operational</h5>
        <p className="muted mt-2">No tenants require immediate attention</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertCircle className="size-5 text-amber-600" />
        <h4>Requires Attention</h4>
        <span className="rounded-full bg-amber-500/10 px-2 py-1">
          <small className="text-amber-600">{attentionTenants.length}</small>
        </span>
      </div>

      <div className="space-y-3">
        {attentionTenants.map((tenant) => {
          const tenantBilling = billing?.[tenant.id];
          const health = getTenantHealth(tenant.isActive, tenantBilling);
          const trialDays = tenantBilling?.trialEndsAt ? getTrialDaysRemaining(tenantBilling.trialEndsAt) : 0;

          return (
            <div
              key={tenant.id}
              className="flex items-start justify-between rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/10">
                  <Building2 className="size-5 text-amber-600" />
                </div>
                <div>
                  <h6>{tenant.name}</h6>
                  <small className="muted">{tenant.domain}</small>
                  <div className="mt-2 space-y-1">
                    {health === "critical" && (
                      <small className="text-red-600">⚠ Tenant suspended</small>
                    )}
                    {health === "warning" && (
                      <small className="text-amber-600">⚠ Billing overdue</small>
                    )}
                    {trialDays > 0 && trialDays <= 3 && (
                      <small className="text-amber-600">
                        ⏰ Trial ends in {trialDays} {trialDays === 1 ? "day" : "days"}
                      </small>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Top tenants by usage
 */
export function TopTenantsByUsage({
  tenants,
  metrics,
  maxItems = 5,
}: {
  tenants: Tenant[];
  metrics: Record<string, TenantMetrics>;
  maxItems?: number;
}) {
  const tenantsWithMetrics = tenants
    .map((tenant) => ({
      tenant,
      metrics: metrics[tenant.id],
      totalUsers: (metrics[tenant.id]?.students || 0) + (metrics[tenant.id]?.teachers || 0),
    }))
    .filter((item) => item.metrics)
    .sort((a, b) => b.totalUsers - a.totalUsers)
    .slice(0, maxItems);

  return (
    <div className="space-y-4">
      <h4>Top Tenants by Usage</h4>
      <div className="space-y-3">
        {tenantsWithMetrics.map(({ tenant, metrics: tenantMetrics, totalUsers }) => (
          <div
            key={tenant.id}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                <Users className="size-5 text-primary" />
              </div>
              <div>
                <h6>{tenant.name}</h6>
                <small className="muted">
                  {tenantMetrics.students} students • {tenantMetrics.teachers} teachers
                </small>
              </div>
            </div>
            <div className="font-semibold tabular-nums">{totalUsers}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Tenant overview stats
 */
export function TenantOverviewStats({ tenants, metrics }: {
  tenants: Tenant[];
  metrics: Record<string, TenantMetrics>;
}) {
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter((t) => t.isActive).length;
  const totalStudents = Object.values(metrics).reduce((sum, m) => sum + (m?.students || 0), 0);
  const totalTeachers = Object.values(metrics).reduce((sum, m) => sum + (m?.teachers || 0), 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <TenantStatsCard
        title="Total Tenants"
        value={totalTenants}
        icon={Building2}
        description={`${activeTenants} active`}
      />
      <TenantStatsCard
        title="Active Tenants"
        value={activeTenants}
        icon={TrendingUp}
        description={`${Math.round((activeTenants / totalTenants) * 100)}% of total`}
      />
      <TenantStatsCard
        title="Total Students"
        value={totalStudents.toLocaleString()}
        icon={Users}
        description="Across all tenants"
      />
      <TenantStatsCard
        title="Total Teachers"
        value={totalTeachers.toLocaleString()}
        icon={Users}
        description="Across all tenants"
      />
    </div>
  );
}
