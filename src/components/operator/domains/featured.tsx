"use client";

/**
 * Featured domains and domain insights component
 *
 * Displays highlighted domains, pending requests, and domain statistics.
 */

import { DomainCard, DomainStatsCard } from "./card";
import { Globe, CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react";
import type { DomainRequestWithSchool, DomainStatus } from "./types";
import { isPendingApproval, isVerified, isRejected, formatTimeSince, normalizeDomain } from "./util";

interface FeaturedDomainsProps {
  domains: DomainRequestWithSchool[];
  maxItems?: number;
  onDomainClick?: (domainId: string) => void;
  onApprove?: (domainId: string) => void;
  onReject?: (domainId: string) => void;
  onVerify?: (domainId: string) => void;
}

/**
 * Featured domains with quick stats
 */
export function FeaturedDomains({
  domains,
  maxItems = 6,
  onDomainClick,
  onApprove,
  onReject,
  onVerify,
}: FeaturedDomainsProps) {
  const featuredDomains = domains.slice(0, maxItems);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3>Featured Domains</h3>
          <p className="muted">Quick overview of recent domain requests</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {featuredDomains.map((domain) => (
          <DomainCard
            key={domain.id}
            domain={domain}
            showActions
            onApprove={onApprove}
            onReject={onReject}
            onVerify={onVerify}
            onViewDetails={onDomainClick}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Recent domain requests
 */
export function RecentDomains({ domains, maxItems = 5 }: { domains: DomainRequestWithSchool[]; maxItems?: number }) {
  const recentDomains = [...domains]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, maxItems);

  return (
    <div className="space-y-4">
      <h4>Recent Requests</h4>
      <div className="space-y-2">
        {recentDomains.map((domain) => (
          <div
            key={domain.id}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                <Globe className="size-5 text-primary" />
              </div>
              <div>
                <h6>{normalizeDomain(domain.domain)}</h6>
                <small className="muted">{domain.school.name}</small>
              </div>
            </div>
            <small className="muted">{formatTimeSince(domain.createdAt)}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Pending domain requests requiring review
 */
export function PendingDomains({ domains }: { domains: DomainRequestWithSchool[] }) {
  const pendingDomains = domains.filter((d) => isPendingApproval(d.status as DomainStatus));

  if (pendingDomains.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-green-500/10 mx-auto">
          <CheckCircle className="size-6 text-green-600" />
        </div>
        <h5 className="mt-4">All caught up</h5>
        <p className="muted mt-2">No pending domain requests at this time</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="size-5 text-amber-600" />
        <h4>Pending Review</h4>
        <span className="rounded-full bg-amber-500/10 px-2 py-1">
          <small className="text-amber-600">{pendingDomains.length}</small>
        </span>
      </div>

      <div className="space-y-3">
        {pendingDomains.map((domain) => (
          <div
            key={domain.id}
            className="flex items-start justify-between rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/10">
                <Globe className="size-5 text-amber-600" />
              </div>
              <div>
                <h6>{normalizeDomain(domain.domain)}</h6>
                <small className="muted">{domain.school.name}</small>
                <div className="mt-2">
                  <small className="text-amber-600">
                    ⏰ Requested {formatTimeSince(domain.createdAt)}
                  </small>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Approved but not verified domains
 */
export function ApprovedNotVerified({ domains, maxItems = 5 }: { domains: DomainRequestWithSchool[]; maxItems?: number }) {
  const approvedNotVerified = domains
    .filter((d) => d.status === "approved")
    .slice(0, maxItems);

  if (approvedNotVerified.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-5 text-blue-600" />
        <h4>Awaiting Verification</h4>
        <span className="rounded-full bg-blue-500/10 px-2 py-1">
          <small className="text-blue-600">{approvedNotVerified.length}</small>
        </span>
      </div>

      <div className="space-y-2">
        {approvedNotVerified.map((domain) => (
          <div
            key={domain.id}
            className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50/50 dark:bg-blue-950/10 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-blue-500/10">
                <Globe className="size-5 text-blue-600" />
              </div>
              <div>
                <h6>{normalizeDomain(domain.domain)}</h6>
                <small className="muted">{domain.school.name}</small>
              </div>
            </div>
            <small className="text-blue-600">Needs DNS verification</small>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Rejected domains
 */
export function RejectedDomains({ domains, maxItems = 3 }: { domains: DomainRequestWithSchool[]; maxItems?: number }) {
  const rejectedDomains = domains
    .filter((d) => isRejected(d.status as DomainStatus))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, maxItems);

  if (rejectedDomains.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <XCircle className="size-5 text-red-600" />
        <h4>Recently Rejected</h4>
      </div>

      <div className="space-y-2">
        {rejectedDomains.map((domain) => (
          <div
            key={domain.id}
            className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50/50 dark:bg-red-950/10 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-red-500/10">
                <Globe className="size-5 text-red-600" />
              </div>
              <div>
                <h6>{normalizeDomain(domain.domain)}</h6>
                <small className="muted">{domain.school.name}</small>
                {domain.notes && <p className="muted line-clamp-1 mt-1">{domain.notes}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Domain overview statistics
 */
export function DomainOverviewStats({ domains }: { domains: DomainRequestWithSchool[] }) {
  const totalDomains = domains.length;
  const verifiedCount = domains.filter((d) => isVerified(d.status as DomainStatus)).length;
  const pendingCount = domains.filter((d) => isPendingApproval(d.status as DomainStatus)).length;
  const rejectedCount = domains.filter((d) => isRejected(d.status as DomainStatus)).length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <DomainStatsCard
        title="Total Requests"
        value={totalDomains}
        icon={Globe}
        description={`${verifiedCount} verified`}
      />
      <DomainStatsCard
        title="Verified Domains"
        value={verifiedCount}
        icon={CheckCircle}
        description={`${Math.round((verifiedCount / totalDomains) * 100) || 0}% of total`}
      />
      <DomainStatsCard
        title="Pending Review"
        value={pendingCount}
        icon={Clock}
        description={pendingCount > 0 ? "Requires action" : "All reviewed"}
      />
      <DomainStatsCard
        title="Rejected"
        value={rejectedCount}
        icon={XCircle}
        description={`${Math.round((rejectedCount / totalDomains) * 100) || 0}% of total`}
      />
    </div>
  );
}

/**
 * Comprehensive domain lab
 */
export function DomainDashboard({ domains }: { domains: DomainRequestWithSchool[] }) {
  return (
    <div className="space-y-6">
      <DomainOverviewStats domains={domains} />

      <div className="grid gap-6 lg:grid-cols-2">
        <PendingDomains domains={domains} />
        <div className="space-y-6">
          <ApprovedNotVerified domains={domains} />
          <RejectedDomains domains={domains} />
        </div>
      </div>

      <RecentDomains domains={domains} />
    </div>
  );
}
