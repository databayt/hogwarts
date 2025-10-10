"use client";

/**
 * All tenants view component
 *
 * Displays a grid or list of all tenants with filtering and sorting options.
 */

import { useState } from "react";
import { TenantCard, TenantCompactCard } from "./card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Grid3x3, List, SlidersHorizontal } from "lucide-react";
import type { Tenant, TenantMetrics, TenantFilters } from "./types";
import { PLAN_TYPES, TENANT_STATUSES } from "./config";
import { sortTenants, getTenantStatus } from "./util";

interface AllTenantsProps {
  tenants: Tenant[];
  metrics?: Record<string, TenantMetrics>;
  defaultView?: "grid" | "list";
  showFilters?: boolean;
  onTenantClick?: (tenantId: string) => void;
}

/**
 * All tenants view with filtering and layout options
 */
export function AllTenants({
  tenants,
  metrics,
  defaultView = "grid",
  showFilters = true,
  onTenantClick,
}: AllTenantsProps) {
  const [view, setView] = useState<"grid" | "list">(defaultView);
  const [filters, setFilters] = useState<TenantFilters>({
    search: "",
    planType: "",
    status: "",
  });
  const [sortField, setSortField] = useState<"name" | "domain" | "createdAt">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Filter tenants
  const filteredTenants = tenants.filter((tenant) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        tenant.name.toLowerCase().includes(searchLower) ||
        tenant.domain.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Plan type filter
    if (filters.planType && tenant.planType !== filters.planType) {
      return false;
    }

    // Status filter
    if (filters.status) {
      const tenantStatus = getTenantStatus(tenant.isActive, tenant.trialEndsAt);
      if (tenantStatus !== filters.status) {
        return false;
      }
    }

    return true;
  });

  // Sort tenants
  const sortedTenants = sortTenants(filteredTenants, sortField, sortDirection);

  return (
    <div className="space-y-4">
      {/* Header with view toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3>All Tenants</h3>
          <span className="rounded-full bg-muted px-2 py-1">
            <small>{sortedTenants.length}</small>
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
        <div className="grid gap-4 md:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tenants..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-9"
            />
          </div>

          <Select
            value={filters.planType}
            onValueChange={(value) => setFilters({ ...filters, planType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All plans" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All plans</SelectItem>
              {PLAN_TYPES.map((plan) => (
                <SelectItem key={plan} value={plan}>
                  {plan.charAt(0).toUpperCase() + plan.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.status}
            onValueChange={(value) => setFilters({ ...filters, status: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              {TENANT_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={`${sortField}-${sortDirection}`}
            onValueChange={(value) => {
              const [field, direction] = value.split("-") as ["name" | "domain" | "createdAt", "asc" | "desc"];
              setSortField(field);
              setSortDirection(direction);
            }}
          >
            <SelectTrigger>
              <SlidersHorizontal className="mr-2 size-4" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="domain-asc">Domain (A-Z)</SelectItem>
              <SelectItem value="domain-desc">Domain (Z-A)</SelectItem>
              <SelectItem value="createdAt-asc">Oldest first</SelectItem>
              <SelectItem value="createdAt-desc">Newest first</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Empty state */}
      {sortedTenants.length === 0 && (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8">
          <div className="flex size-20 items-center justify-center rounded-full bg-muted">
            <Search className="size-10 text-muted-foreground" />
          </div>
          <h4 className="mt-4">No tenants found</h4>
          <p className="muted mt-2 text-center max-w-sm">
            {filters.search || filters.planType || filters.status
              ? "Try adjusting your filters to find what you're looking for."
              : "Get started by creating your first tenant."}
          </p>
          {(filters.search || filters.planType || filters.status) && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setFilters({ search: "", planType: "", status: "" })}
            >
              Clear filters
            </Button>
          )}
        </div>
      )}

      {/* Grid view */}
      {view === "grid" && sortedTenants.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedTenants.map((tenant) => (
            <TenantCard
              key={tenant.id}
              tenant={tenant}
              metrics={metrics?.[tenant.id]}
              showActions
              onViewDetails={onTenantClick}
            />
          ))}
        </div>
      )}

      {/* List view */}
      {view === "list" && sortedTenants.length > 0 && (
        <div className="space-y-2">
          {sortedTenants.map((tenant) => (
            <div key={tenant.id} onClick={() => onTenantClick?.(tenant.id)} className="cursor-pointer">
              <TenantCompactCard tenant={tenant} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
