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
    columns: {
      title: "Title",
      scope: "Scope",
      status: "Status",
      created: "Created",
      actions: "Actions"
    },
    scope: {
      school: "School",
      class: "Class",
      role: "Role"
    },
    status: {
      published: "Published",
      draft: "Draft"
    },
    actions: {
      view: "View",
      edit: "Edit",
      togglePublish: "Toggle Publish",
      delete: "Delete"
    }
  };

  return [
  {
    accessorKey: "title",
    header: ({ column }) => <DataTableColumnHeader column={column} title={dict.columns.title} />,
    meta: { label: dict.columns.title, variant: "text" },
    id: 'title',
    enableColumnFilter: true,
  },
  {
    accessorKey: "scope",
    header: ({ column }) => <DataTableColumnHeader column={column} title={dict.columns.scope} />,
    meta: {
      label: dict.columns.scope,
      variant: "select",
      options: [
        { label: dict.scope.school, value: "school" },
        { label: dict.scope.class, value: "class" },
        { label: dict.scope.role, value: "role" },
      ],
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: "published",
    header: ({ column }) => <DataTableColumnHeader column={column} title={dict.columns.status} />,
    cell: ({ getValue }) => {
      const is = getValue<boolean>();
      return <Badge variant={is ? "default" : "outline"}>{is ? dict.status.published : dict.status.draft}</Badge>;
    },
    meta: {
      label: dict.columns.status,
      variant: "select",
      options: [
        { label: dict.status.published, value: "true" },
        { label: dict.status.draft, value: "false" },
      ],
    },
    id: 'published',
    enableColumnFilter: true,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title={dict.columns.created} />,
    meta: { label: dict.columns.created, variant: "text" },
    cell: ({ getValue }) => (
      <span className="text-xs tabular-nums text-muted-foreground">{new Date(getValue<string>()).toLocaleDateString()}</span>
    ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">{dict.columns.actions}</span>,
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
            <DropdownMenuLabel>{dict.columns.actions}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onView}>{dict.actions.view}</DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>{dict.actions.edit}</DropdownMenuItem>
            <DropdownMenuItem onClick={onToggle}>
              {announcement.published ? dict.status.draft : dict.status.published}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete}>{dict.actions.delete}</DropdownMenuItem>
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



