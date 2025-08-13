"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toggleAnnouncementPublish, deleteAnnouncement } from "@/app/(platform)/announcements/actions";
import { SuccessToast, ErrorToast } from "@/components/atom/toast";

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
    meta: { label: "Title", variant: "text", placeholder: "Search title" },
    id: 'title',
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
    header: () => <span className="text-xs uppercase text-muted-foreground">Actions</span>,
    cell: ({ row }) => {
      const isPublished = row.original.published;
      const onToggle = async () => {
        try {
          await toggleAnnouncementPublish({ id: row.original.id, publish: !isPublished });
          SuccessToast();
        } catch (e) {
          ErrorToast(e instanceof Error ? e.message : "Failed");
        }
      };
      const onDelete = async () => {
        try {
          await deleteAnnouncement({ id: row.original.id });
          SuccessToast();
        } catch (e) {
          ErrorToast(e instanceof Error ? e.message : "Failed");
        }
      };
      return (
        <div className="flex items-center gap-2">
          <Button size="sm" variant={isPublished ? "outline" : "default"} onClick={onToggle}>
            {isPublished ? "Unpublish" : "Publish"}
          </Button>
          <Button size="sm" variant="destructive" onClick={onDelete}>Delete</Button>
        </div>
      );
    },
    enableSorting: false,
    enableColumnFilter: false,
  },
];



