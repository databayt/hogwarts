"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useModal } from "@/components/atom/modal/context";
import { deleteAnnouncement, toggleAnnouncementPublish } from "@/components/platform/announcements/actions";
import { DeleteToast, ErrorToast, confirmDeleteDialog } from "@/components/atom/toast";
import type { Dictionary } from "@/components/internationalization/dictionaries";

export type AnnouncementRow = {
  id: string;
  title: string;
  scope: string;
  published: boolean;
  createdAt: string;
};

export const getAnnouncementColumns = (dictionary?: Dictionary['school']['announcements']): ColumnDef<AnnouncementRow>[] => {
  const dict = dictionary || {
    announcementTitle: "Title",
    scope: "Scope",
    published: "Published",
    draft: "Draft",
    schoolWide: "School",
    classSpecific: "Class",
    roleSpecific: "Role",
    publish: "Publish",
    unpublish: "Unpublish",
    edit: "Edit",
    delete: "Delete"
  };

  // Map dictionary keys to column structure for easier access
  const columns = {
    title: dict.announcementTitle || "Title",
    scope: dict.scope || "Scope",
    status: "Status",
    created: "Created",
    actions: "Actions"
  };

  return [
  {
    accessorKey: "title",
    header: ({ column }) => <DataTableColumnHeader column={column} title={columns.title} />,
    meta: { label: columns.title, variant: "text" },
    id: 'title',
    enableColumnFilter: true,
  },
  {
    accessorKey: "scope",
    header: ({ column }) => <DataTableColumnHeader column={column} title={columns.scope} />,
    meta: {
      label: columns.scope,
      variant: "select",
      options: [
        { label: dict.schoolWide || "School", value: "school" },
        { label: dict.classSpecific || "Class", value: "class" },
        { label: dict.roleSpecific || "Role", value: "role" },
      ],
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: "published",
    header: ({ column }) => <DataTableColumnHeader column={column} title={columns.status} />,
    cell: ({ getValue }) => {
      const is = getValue<boolean>();
      return <Badge variant={is ? "default" : "outline"}>{is ? dict.published || "Published" : dict.draft || "Draft"}</Badge>;
    },
    meta: {
      label: columns.status,
      variant: "select",
      options: [
        { label: dict.published || "Published", value: "true" },
        { label: dict.draft || "Draft", value: "false" },
      ],
    },
    id: 'published',
    enableColumnFilter: true,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title={columns.created} />,
    meta: { label: columns.created, variant: "text" },
    cell: ({ getValue }) => (
      <span className="text-xs tabular-nums text-muted-foreground">{new Date(getValue<string>()).toLocaleDateString()}</span>
    ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">{columns.actions}</span>,
    cell: ({ row }) => {
      const announcement = row.original;
      const { openModal } = useModal();
      const onView = () => {
        const qs = typeof window !== 'undefined' ? (window.location.search || "") : "";
        window.location.href = `/announcements/${announcement.id}${qs}`;
      };
      const onEdit = () => openModal(announcement.id);
      const onToggle = async () => {
        try {
          await toggleAnnouncementPublish({ id: announcement.id, publish: !announcement.published });
          // Success toast will be handled by the action
        } catch (e) {
          ErrorToast(e instanceof Error ? e.message : "Failed to toggle publish status");
        }
      };
      const onDelete = async () => {
        try {
          const ok = await confirmDeleteDialog(`Delete ${announcement.title}?`);
          if (!ok) return;
          await deleteAnnouncement({ id: announcement.id });
          DeleteToast();
        } catch (e) {
          ErrorToast(e instanceof Error ? e.message : "Failed to delete");
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
            <DropdownMenuLabel>{columns.actions}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onView}>View</DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>{dict.edit || "Edit"}</DropdownMenuItem>
            <DropdownMenuItem onClick={onToggle}>
              {announcement.published ? dict.unpublish || "Unpublish" : dict.publish || "Publish"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete}>{dict.delete || "Delete"}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
    enableColumnFilter: false,
  },
  ];
}

// Export a default version for backward compatibility
export const announcementColumns = getAnnouncementColumns();



