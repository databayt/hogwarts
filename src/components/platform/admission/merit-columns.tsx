"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
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
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";

export type MeritRow = {
  id: string;
  applicationNumber: string;
  applicantName: string;
  firstName: string;
  lastName: string;
  applyingForClass: string;
  category: string | null;
  status: string;
  meritScore: string | null;
  meritRank: number | null;
  entranceScore: string | null;
  interviewScore: string | null;
  campaignName: string;
  campaignId: string;
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case "SELECTED":
      return "default";
    case "WAITLISTED":
      return "secondary";
    case "REJECTED":
      return "destructive";
    default:
      return "outline";
  }
};

export const getMeritColumns = (
  dictionary: Dictionary["school"]["admission"],
  locale: Locale
): ColumnDef<MeritRow>[] => {
  const t = dictionary;

  return [
    {
      accessorKey: "meritRank",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t?.columns?.rank || "Rank"} />
      ),
      cell: ({ getValue }) => {
        const rank = getValue<number | null>();
        return (
          <span className="font-bold text-lg tabular-nums">
            #{rank}
          </span>
        );
      },
    },
    {
      accessorKey: "applicantName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t?.columns?.applicant || "Applicant"} />
      ),
      meta: { label: t?.columns?.applicant || "Applicant", variant: "text" },
      enableColumnFilter: true,
    },
    {
      accessorKey: "applicationNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t?.columns?.applicationNumber || "Application #"} />
      ),
      cell: ({ getValue }) => (
        <span className="font-mono text-sm text-muted-foreground">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: "category",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t?.columns?.category || "Category"} />
      ),
      cell: ({ getValue }) => {
        const category = getValue<string | null>();
        return category ? (
          <Badge variant="outline">{category}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
      meta: {
        label: t?.columns?.category || "Category",
        variant: "select",
        options: [
          { label: "General", value: "General" },
          { label: "OBC", value: "OBC" },
          { label: "SC", value: "SC" },
          { label: "ST", value: "ST" },
        ],
      },
      enableColumnFilter: true,
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "meritScore",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t?.columns?.score || "Merit Score"} />
      ),
      cell: ({ getValue }) => {
        const score = getValue<string | null>();
        return score ? (
          <span className="font-semibold tabular-nums">{parseFloat(score).toFixed(2)}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: "entranceScore",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Entrance" />
      ),
      cell: ({ getValue }) => {
        const score = getValue<string | null>();
        return score ? (
          <span className="text-sm tabular-nums">{parseFloat(score).toFixed(1)}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: "interviewScore",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Interview" />
      ),
      cell: ({ getValue }) => {
        const score = getValue<string | null>();
        return score ? (
          <span className="text-sm tabular-nums">{parseFloat(score).toFixed(1)}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t?.columns?.status || "Status"} />
      ),
      cell: ({ getValue }) => {
        const status = getValue<string>();
        const label = t?.status?.[status as keyof typeof t.status] || status;
        return <Badge variant={getStatusVariant(status)}>{label}</Badge>;
      },
      meta: {
        label: t?.columns?.status || "Status",
        variant: "select",
        options: [
          { label: t?.status?.SHORTLISTED || "Shortlisted", value: "SHORTLISTED" },
          { label: t?.status?.SELECTED || "Selected", value: "SELECTED" },
          { label: t?.status?.WAITLISTED || "Waitlisted", value: "WAITLISTED" },
          { label: t?.status?.REJECTED || "Rejected", value: "REJECTED" },
        ],
      },
      enableColumnFilter: true,
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{t?.columns?.actions || "Actions"}</span>,
      cell: ({ row }) => {
        const merit = row.original;
        const router = useRouter();

        const onView = () => {
          router.push(`/admission/applications/${merit.id}`);
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
              <DropdownMenuLabel>{t?.columns?.actions || "Actions"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onView}>
                {t?.meritList?.viewApplication || "View Application"}
              </DropdownMenuItem>
              <DropdownMenuItem>
                {t?.meritList?.markSelected || "Mark as Selected"}
              </DropdownMenuItem>
              <DropdownMenuItem>
                {t?.meritList?.markWaitlisted || "Mark as Waitlisted"}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                {t?.meritList?.markRejected || "Mark as Rejected"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
      enableColumnFilter: false,
    },
  ];
};
