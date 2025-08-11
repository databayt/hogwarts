"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/table/data-table/data-table-column-header";
import { TenantDetail } from "./detail";
import { SuccessToast, ErrorToast } from "@/components/atom/toast";

export type TenantRow = {
  id: string;
  name: string;
  domain: string;
  isActive: boolean;
  planType: string;
  createdAt: string;
  trialEndsAt?: string | null;
};

export const tenantColumns: ColumnDef<TenantRow>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    meta: { label: "Name", variant: "text", placeholder: "Search name" },
  },
  {
    accessorKey: "domain",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Domain" />
    ),
    meta: { label: "Domain", variant: "text", placeholder: "Search domain" },
  },
  {
    accessorKey: "planType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Plan" />
    ),
    meta: {
      label: "Plan",
      variant: "select",
      placeholder: "Plan type",
      options: [
        { label: "Basic", value: "basic" },
        { label: "Pro", value: "pro" },
        { label: "Enterprise", value: "enterprise" },
      ],
    },
  },
  {
    accessorKey: "isActive",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ getValue }) => (
      <span className="text-xs font-medium">
        {getValue<boolean>() ? "Active" : "Inactive"}
      </span>
    ),
    meta: {
      label: "Status",
      variant: "select",
      placeholder: "Active/Inactive",
      options: [
        { label: "Active", value: "true" },
        { label: "Inactive", value: "false" },
      ],
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ getValue }) => (
      <span className="text-xs tabular-nums text-muted-foreground">
        {new Date(getValue<string>()).toLocaleDateString()}
      </span>
    ),
    meta: { label: "Created", variant: "text" },
  },
  {
    accessorKey: "trialEndsAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Trial Ends" />
    ),
    cell: ({ getValue }) => (
      <span className="text-xs tabular-nums text-muted-foreground">
        {(() => {
          const v = getValue<string | null | undefined>();
          return v ? new Date(v).toLocaleDateString() : "-";
        })()}
      </span>
    ),
    enableSorting: false,
    meta: { label: "Trial Ends", variant: "text" },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => {
      const tenant = row.original as TenantRow
      const onStartImpersonation = async () => {
        try {
          const reason = prompt(`Reason to impersonate ${tenant.name}?`) || "";
          const res = await fetch(`/operator/actions/impersonation/${tenant.id}/start`, {
            method: "POST",
            body: (() => { const fd = new FormData(); fd.set("reason", reason); return fd; })(),
          });
          if (!res.ok) throw new Error("Failed to start impersonation");
          SuccessToast();
        } catch (e) {
          ErrorToast(e instanceof Error ? e.message : "Failed to start impersonation");
        }
      };
      const onToggleActive = async () => {
        try {
          const reason = prompt(`Reason to ${tenant.isActive ? "suspend" : "activate"} ${tenant.name}?`) || "";
          const res = await fetch(`/operator/actions/tenants/${tenant.id}/toggle-active`, {
            method: "POST",
            body: (() => { const fd = new FormData(); fd.set("reason", reason); return fd; })(),
          });
          if (!res.ok) throw new Error("Failed to toggle status");
          SuccessToast();
        } catch (e) {
          ErrorToast(e instanceof Error ? e.message : "Failed to toggle status");
        }
      };
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href={`/operator/tenants?impersonate=${tenant.id}`}>Impersonate</a>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onStartImpersonation}>
              Start impersonation
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggleActive}>
              {tenant.isActive ? "Suspend" : "Activate"}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <div className="px-0">
                <TenantDetail
                  tenantId={tenant.id}
                  name={tenant.name}
                  domain={tenant.domain}
                  planType={tenant.planType}
                  isActive={tenant.isActive}
                />
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
];


