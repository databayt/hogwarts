"use client";

/**
 * Tenant card components for displaying school information
 *
 * Reusable card components for showing tenant details in various layouts.
 */

import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Calendar, Globe, Users } from "lucide-react";
import type { Tenant, TenantMetrics, TenantBilling } from "./type";
import { formatTenantUrl, getPlanTypeLabel, formatDate, formatTrialStatus, getTenantStatus } from "./util";
import { TENANT_STATUS_VARIANTS } from "./config";

interface TenantCardProps {
  tenant: Tenant;
  metrics?: TenantMetrics;
  billing?: TenantBilling;
  showActions?: boolean;
  onViewDetails?: (tenantId: string) => void;
}

/**
 * Basic tenant card with essential information
 */
export function TenantCard({ tenant, metrics, showActions = false, onViewDetails }: TenantCardProps) {
  const status = getTenantStatus(tenant.isActive, tenant.trialEndsAt);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-4" />
              {tenant.name}
            </CardTitle>
            <CardDescription>{tenant.domain}.schoolapp.com</CardDescription>
          </div>
          <Badge variant={TENANT_STATUS_VARIANTS[status]}>{getPlanTypeLabel(tenant.planType)}</Badge>
        </div>
      </CardHeader>

      {metrics && (
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              <div>
                <small className="muted">Students</small>
                <div className="font-medium">{metrics.students}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              <div>
                <small className="muted">Teachers</small>
                <div className="font-medium">{metrics.teachers}</div>
              </div>
            </div>
          </div>
        </CardContent>
      )}

      {showActions && (
        <CardFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails?.(tenant.id)}
            className="w-full"
          >
            View Details
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

/**
 * Compact tenant card for list views
 */
export function TenantCompactCard({ tenant }: { tenant: Tenant }) {
  const status = getTenantStatus(tenant.isActive, tenant.trialEndsAt);

  return (
    <Card className="flex items-center justify-between p-4">
      <div className="flex items-center gap-4">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
          <Building2 className="size-5 text-primary" />
        </div>
        <div>
          <h5>{tenant.name}</h5>
          <small className="muted">{tenant.domain}</small>
        </div>
      </div>
      <Badge variant={TENANT_STATUS_VARIANTS[status]}>{status}</Badge>
    </Card>
  );
}

/**
 * Tenant card with billing information
 */
export function TenantBillingCard({ tenant, billing }: { tenant: Tenant; billing: TenantBilling }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{tenant.name}</CardTitle>
        <CardDescription>{getPlanTypeLabel(tenant.planType)} Plan</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <small className="muted">Outstanding</small>
            <div className="font-medium tabular-nums">
              ${((billing.outstandingCents || 0) / 100).toFixed(2)}
            </div>
          </div>
          <div>
            <small className="muted">Next Invoice</small>
            <div className="font-medium">{formatDate(billing.nextInvoiceDate)}</div>
          </div>
        </div>
        {tenant.trialEndsAt && (
          <div className="rounded-md bg-muted p-3">
            <small className="muted">Trial Status</small>
            <div className="font-medium">{formatTrialStatus(tenant.trialEndsAt)}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Tenant statistics card
 */
export function TenantStatsCard({ title, value, icon: Icon, description }: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>
          <small>{title}</small>
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <h2 className="font-bold">{value}</h2>
        {description && <small className="muted">{description}</small>}
      </CardContent>
    </Card>
  );
}

/**
 * Tenant info card with metadata
 */
export function TenantInfoCard({ tenant }: { tenant: Tenant }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{tenant.name}</CardTitle>
        <CardDescription>Tenant Information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="size-4 text-muted-foreground" />
          <div>
            <small className="muted">Domain</small>
            <div className="font-medium">
              <Link
                href={formatTenantUrl(tenant.domain)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {tenant.domain}.schoolapp.com
              </Link>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-muted-foreground" />
          <div>
            <small className="muted">Created</small>
            <div className="font-medium">{formatDate(tenant.createdAt)}</div>
          </div>
        </div>
        {tenant.address && (
          <div>
            <small className="muted">Address</small>
            <p className="muted">{tenant.address}</p>
          </div>
        )}
        {tenant.email && (
          <div>
            <small className="muted">Email</small>
            <Link href={`mailto:${tenant.email}`} className="muted hover:underline">
              {tenant.email}
            </Link>
          </div>
        )}
        {tenant.phoneNumber && (
          <div>
            <small className="muted">Phone</small>
            <Link href={`tel:${tenant.phoneNumber}`} className="muted hover:underline">
              {tenant.phoneNumber}
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
