"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useModal } from "@/components/atom/modal/context";
import { deleteAnnouncement, toggleAnnouncementPublish } from "@/components/platform/announcements/actions";
import { DeleteToast, ErrorToast, confirmDeleteDialog } from "@/components/atom/toast";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import { useRouter, useSearchParams } from "next/navigation";

export type AnnouncementRow = {
  id: string;
  title: string;
  language: string;
  scope: string;
  published: boolean;
  createdAt: string;
  createdBy: string | null;
  priority: string;
  pinned: boolean;
  featured: boolean;
};

export const getAnnouncementColumns = (dictionary: Dictionary['school']['announcements']): ColumnDef<AnnouncementRow>[] => {
  const t = dictionary;

  // Map dictionary keys to column structure for easier access
  const columns = {
    title: t.announcementTitle,
    scope: t.scope,
    status: t.status,
    created: t.created,
    actions: t.actions
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
        { label: t.schoolWide, value: "school" },
        { label: t.classSpecific, value: "class" },
        { label: t.roleSpecific, value: "role" },
      ],
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: "published",
    header: ({ column }) => <DataTableColumnHeader column={column} title={columns.status} />,
    cell: ({ getValue }) => {
      const is = getValue<boolean>();
      return <Badge variant={is ? "default" : "outline"}>{is ? t.published : t.draft}</Badge>;
    },
    meta: {
      label: columns.status,
      variant: "select",
      options: [
        { label: t.published, value: "true" },
        { label: t.draft, value: "false" },
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
      const router = useRouter();
      const searchParams = useSearchParams();

      const onView = () => {
        const qs = searchParams.toString();
        router.push(`/announcements/${announcement.id}${qs ? `?${qs}` : ''}`);
      };
      const onEdit = () => openModal(announcement.id);
      const onToggle = async () => {
        try {
          await toggleAnnouncementPublish({ id: announcement.id, publish: !announcement.published });
          // Success toast will be handled by the action
        } catch (e) {
          ErrorToast(e instanceof Error ? e.message : t.failedToTogglePublish);
        }
      };
      const onDelete = async () => {
        try {
          const ok = await confirmDeleteDialog(t.confirmDelete.replace('{title}', announcement.title));
          if (!ok) return;
          await deleteAnnouncement({ id: announcement.id });
          DeleteToast();
        } catch (e) {
          ErrorToast(e instanceof Error ? e.message : t.failedToDelete);
        }
      };
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">{t.openMenu}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{columns.actions}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onView}>{t.view}</DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>{t.editAnnouncement}</DropdownMenuItem>
            <DropdownMenuItem onClick={onToggle}>
              {announcement.published ? t.unpublish : t.publish}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete}>{t.deleteAnnouncement}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
    enableColumnFilter: false,
  },
  ];
}



