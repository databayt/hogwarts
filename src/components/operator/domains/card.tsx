"use client";

/**
 * Domain card components for displaying domain request information
 *
 * Reusable card components for showing domain details in various layouts.
 */

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, Check, X, AlertCircle, Clock, ExternalLink } from "lucide-react";
import type { DomainRequestWithSchool, DomainStatus, DNSRecord } from "./types";
import {
  getDomainStatusLabel,
  formatDomainStatus,
  normalizeDomain,
  getDomainHealth,
  formatTimeSince,
} from "./util";
import { DOMAIN_STATUS_VARIANTS } from "./config";

interface DomainCardProps {
  domain: DomainRequestWithSchool;
  showActions?: boolean;
  onApprove?: (domainId: string) => void;
  onReject?: (domainId: string) => void;
  onVerify?: (domainId: string) => void;
  onViewDetails?: (domainId: string) => void;
}

/**
 * Basic domain card with essential information
 */
export function DomainCard({
  domain,
  showActions = false,
  onApprove,
  onReject,
  onVerify,
  onViewDetails,
}: DomainCardProps) {
  const normalized = normalizeDomain(domain.domain);
  const health = getDomainHealth(domain.status as DomainStatus);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Globe className="size-4" />
              {normalized}
            </CardTitle>
            <CardDescription>{domain.school.name}</CardDescription>
          </div>
          <Badge variant={DOMAIN_STATUS_VARIANTS[domain.status as DomainStatus]}>
            {getDomainStatusLabel(domain.status as DomainStatus)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <small className="muted">Requested</small>
          <div className="font-medium">{formatTimeSince(domain.createdAt)}</div>
        </div>
        {domain.verifiedAt && (
          <div className="flex items-center justify-between">
            <small className="muted">Verified</small>
            <div className="font-medium">{new Date(domain.verifiedAt).toLocaleDateString()}</div>
          </div>
        )}
        {domain.notes && (
          <div>
            <small className="muted">Notes</small>
            <p className="muted line-clamp-2">{domain.notes}</p>
          </div>
        )}
      </CardContent>

      {showActions && (
        <CardFooter className="gap-2">
          {domain.status === "pending" && (
            <>
              <Button variant="outline" size="sm" onClick={() => onReject?.(domain.id)} className="flex-1">
                <X className="mr-2 size-4" />
                Reject
              </Button>
              <Button size="sm" onClick={() => onApprove?.(domain.id)} className="flex-1">
                <Check className="mr-2 size-4" />
                Approve
              </Button>
            </>
          )}
          {domain.status === "approved" && (
            <Button size="sm" onClick={() => onVerify?.(domain.id)} className="w-full">
              <Check className="mr-2 size-4" />
              Verify Domain
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => onViewDetails?.(domain.id)} className="w-full">
            View Details
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

/**
 * Compact domain card for list views
 */
export function DomainCompactCard({ domain }: { domain: DomainRequestWithSchool }) {
  const normalized = normalizeDomain(domain.domain);

  return (
    <Card className="flex items-center justify-between p-4">
      <div className="flex items-center gap-4">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
          <Globe className="size-5 text-primary" />
        </div>
        <div>
          <h6>{normalized}</h6>
          <small className="muted">{domain.school.name}</small>
        </div>
      </div>
      <Badge variant={DOMAIN_STATUS_VARIANTS[domain.status as DomainStatus]}>
        {domain.status}
      </Badge>
    </Card>
  );
}

/**
 * Domain statistics card
 */
export function DomainStatsCard({
  title,
  value,
  icon: Icon,
  description,
}: {
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
 * DNS configuration card
 */
export function DNSConfigCard({ records }: { records: DNSRecord[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>DNS Configuration</CardTitle>
        <CardDescription>Add these records to your DNS provider</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {records.map((record, index) => (
            <div key={index} className="rounded-lg border p-3 bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline">{record.type}</Badge>
                {record.ttl && <small className="muted">TTL: {record.ttl}</small>}
              </div>
              <div className="space-y-1">
                <div>
                  <small className="muted">Name</small>
                  <div className="font-mono">{record.name}</div>
                </div>
                <div>
                  <small className="muted">Value</small>
                  <div className="font-mono break-all">{record.value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Domain verification status card
 */
export function DomainVerificationCard({
  domain,
  isVerified,
  onVerify,
}: {
  domain: string;
  isVerified: boolean;
  onVerify?: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Domain Verification</CardTitle>
        <CardDescription>{normalizeDomain(domain)}</CardDescription>
      </CardHeader>
      <CardContent>
        {isVerified ? (
          <div className="flex items-center gap-3 rounded-lg bg-green-50 dark:bg-green-950/10 p-4">
            <Check className="size-5 text-green-600" />
            <div>
              <div className="font-medium text-green-600">Domain Verified</div>
              <small className="muted">This domain is active and verified</small>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-amber-50 dark:bg-amber-950/10 p-4">
              <Clock className="size-5 text-amber-600" />
              <div>
                <div className="font-medium text-amber-600">Pending Verification</div>
                <small className="muted">DNS records may take up to 24 hours to propagate</small>
              </div>
            </div>
            {onVerify && (
              <Button onClick={onVerify} className="w-full">
                <Check className="mr-2 size-4" />
                Verify Now
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Domain health indicator card
 */
export function DomainHealthCard({ domain }: { domain: DomainRequestWithSchool }) {
  const health = getDomainHealth(domain.status as DomainStatus);
  const healthConfig = {
    healthy: {
      icon: Check,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950/10",
      label: "Verified and Active",
    },
    warning: {
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950/10",
      label: domain.status === "pending" ? "Pending Review" : "Awaiting Verification",
    },
    critical: {
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-950/10",
      label: "Rejected",
    },
  };

  const config = healthConfig[health];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-3 rounded-lg ${config.bg} p-4`}>
      <Icon className={`size-5 ${config.color}`} />
      <div>
        <div className={`font-medium ${config.color}`}>{config.label}</div>
        <small className="muted">{formatDomainStatus(domain.status as DomainStatus, domain.verifiedAt)}</small>
      </div>
    </div>
  );
}

/**
 * Domain info card with metadata
 */
export function DomainInfoCard({ domain }: { domain: DomainRequestWithSchool }) {
  const normalized = normalizeDomain(domain.domain);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Domain Information</CardTitle>
        <CardDescription>{domain.school.name}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="size-4 text-muted-foreground" />
          <div>
            <small className="muted">Domain</small>
            <div className="font-medium">
              <a
                href={`https://${normalized}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline inline-flex items-center gap-1"
              >
                {normalized}
                <ExternalLink className="size-3" />
              </a>
            </div>
          </div>
        </div>
        <div>
          <small className="muted">Status</small>
          <div className="font-medium">{formatDomainStatus(domain.status as DomainStatus, domain.verifiedAt)}</div>
        </div>
        <div>
          <small className="muted">Requested</small>
          <div className="font-medium">{formatTimeSince(domain.createdAt)}</div>
        </div>
        {domain.notes && (
          <div>
            <small className="muted">Notes</small>
            <p className="muted">{domain.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
