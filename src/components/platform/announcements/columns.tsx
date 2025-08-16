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

export type AnnouncementRow = {
  id: string;
  title: string;
  scope: string;
  published: boolean;
  createdAt: string;
};

export const announcementColumns: ColumnDef<AnnouncementRow>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
    meta: { label: "Title", variant: "text" },
    id: 'title',
    enableColumnFilter: true,
  },
  {
    accessorKey: "scope",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Scope" />,
    meta: {
      label: "Scope",
      variant: "select",
      options: [
        { label: "School", value: "school" },
        { label: "Class", value: "class" },
        { label: "Role", value: "role" },
      ],
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: "published",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ getValue }) => {
      const is = getValue<boolean>();
      return <Badge variant={is ? "default" : "outline"}>{is ? "Published" : "Draft"}</Badge>;
    },
    meta: {
      label: "Published",
      variant: "select",
      options: [
        { label: "Published", value: "true" },
        { label: "Draft", value: "false" },
      ],
    },
    id: 'published',
    enableColumnFilter: true,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    meta: { label: "Created", variant: "text" },
    cell: ({ getValue }) => (
      <span className="text-xs tabular-nums text-muted-foreground">{new Date(getValue<string>()).toLocaleDateString()}</span>
    ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
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
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onView}>View</DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={onToggle}>
              {announcement.published ? "Unpublish" : "Publish"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
    enableColumnFilter: false,
  },
];



