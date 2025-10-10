"use client";

/**
 * All domains view component
 *
 * Displays a grid or list of all domain requests with filtering and sorting options.
 */

import { useState } from "react";
import { DomainCard, DomainCompactCard } from "./card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Grid3x3, List, SlidersHorizontal, Globe } from "lucide-react";
import type { DomainRequestWithSchool, DomainFilters, DomainStatus } from "./types";
import { DOMAIN_STATUSES } from "./config";
import { sortDomains } from "./util";

interface AllDomainsProps {
  domains: DomainRequestWithSchool[];
  defaultView?: "grid" | "list";
  showFilters?: boolean;
  onDomainClick?: (domainId: string) => void;
  onApprove?: (domainId: string) => void;
  onReject?: (domainId: string) => void;
  onVerify?: (domainId: string) => void;
}

/**
 * All domains view with filtering and layout options
 */
export function AllDomains({
  domains,
  defaultView = "grid",
  showFilters = true,
  onDomainClick,
  onApprove,
  onReject,
  onVerify,
}: AllDomainsProps) {
  const [view, setView] = useState<"grid" | "list">(defaultView);
  const [filters, setFilters] = useState<DomainFilters>({
    search: "",
    domain: "",
    schoolName: "",
    status: "",
  });
  const [sortField, setSortField] = useState<"domain" | "schoolName" | "status" | "createdAt" | "verifiedAt">("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Filter domains
  const filteredDomains = domains.filter((domainReq) => {
    // Global search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        domainReq.domain.toLowerCase().includes(searchLower) ||
        domainReq.school.name.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Domain filter
    if (filters.domain && !domainReq.domain.toLowerCase().includes(filters.domain.toLowerCase())) {
      return false;
    }

    // School name filter
    if (filters.schoolName && !domainReq.school.name.toLowerCase().includes(filters.schoolName.toLowerCase())) {
      return false;
    }

    // Status filter
    if (filters.status && domainReq.status !== filters.status) {
      return false;
    }

    // Verified only filter
    if (filters.verifiedOnly && domainReq.status !== "verified") {
      return false;
    }

    return true;
  });

  // Sort domains
  const sortedDomains = sortDomains(
    filteredDomains.map((d) => ({
      ...d,
      schoolName: d.school.name,
    })),
    sortField,
    sortDirection
  );

  return (
    <div className="space-y-4">
      {/* Header with view toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3>All Domains</h3>
          <span className="rounded-full bg-muted px-2 py-1">
            <small>{sortedDomains.length}</small>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={view === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("grid")}
          >
            <Grid3x3 className="size-4" />
          </Button>
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("list")}
          >
            <List className="size-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="grid gap-4 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search domains..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-9"
            />
          </div>

          <Select
            value={filters.status}
            onValueChange={(value) => setFilters({ ...filters, status: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              {DOMAIN_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Filter by school..."
            value={filters.schoolName}
            onChange={(e) => setFilters({ ...filters, schoolName: e.target.value })}
          />

          <Select
            value={`${sortField}-${sortDirection}`}
            onValueChange={(value) => {
              const [field, direction] = value.split("-") as [
                "domain" | "schoolName" | "status" | "createdAt" | "verifiedAt",
                "asc" | "desc"
              ];
              setSortField(field);
              setSortDirection(direction);
            }}
          >
            <SelectTrigger>
              <SlidersHorizontal className="mr-2 size-4" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="domain-asc">Domain (A-Z)</SelectItem>
              <SelectItem value="domain-desc">Domain (Z-A)</SelectItem>
              <SelectItem value="schoolName-asc">School (A-Z)</SelectItem>
              <SelectItem value="schoolName-desc">School (Z-A)</SelectItem>
              <SelectItem value="status-asc">Status (A-Z)</SelectItem>
              <SelectItem value="status-desc">Status (Z-A)</SelectItem>
              <SelectItem value="createdAt-asc">Oldest first</SelectItem>
              <SelectItem value="createdAt-desc">Newest first</SelectItem>
              <SelectItem value="verifiedAt-desc">Recently verified</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Empty state */}
      {sortedDomains.length === 0 && (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8">
          <div className="flex size-20 items-center justify-center rounded-full bg-muted">
            <Globe className="size-10 text-muted-foreground" />
          </div>
          <h4 className="mt-4">No domains found</h4>
          <p className="muted mt-2 text-center max-w-sm">
            {filters.search || filters.schoolName || filters.status
              ? "Try adjusting your filters to find what you're looking for."
              : "Domain requests will appear here once they are submitted."}
          </p>
          {(filters.search || filters.schoolName || filters.status) && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setFilters({ search: "", domain: "", schoolName: "", status: "" })}
            >
              Clear filters
            </Button>
          )}
        </div>
      )}

      {/* Grid view */}
      {view === "grid" && sortedDomains.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedDomains.map((domainReq) => (
            <DomainCard
              key={domainReq.id}
              domain={domainReq}
              showActions
              onApprove={onApprove}
              onReject={onReject}
              onVerify={onVerify}
              onViewDetails={onDomainClick}
            />
          ))}
        </div>
      )}

      {/* List view */}
      {view === "list" && sortedDomains.length > 0 && (
        <div className="space-y-2">
          {sortedDomains.map((domainReq) => (
            <div key={domainReq.id} onClick={() => onDomainClick?.(domainReq.id)} className="cursor-pointer">
              <DomainCompactCard domain={domainReq} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
