"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ellipsis } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useModal } from "@/components/atom/modal/context";
import { deleteAnnouncement, toggleAnnouncementPublish } from "@/components/platform/announcements/actions";
import { DeleteToast, ErrorToast, confirmDeleteDialog } from "@/components/atom/toast";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import { useRouter, useSearchParams } from "next/navigation";
import type { Locale } from "@/components/internationalization/config";

// Bilingual row type - both language versions
export type AnnouncementRow = {
  id: string;
  titleEn: string | null;
  titleAr: string | null;
  scope: string;
  published: boolean;
  createdAt: string;
  createdBy: string | null;
  priority: string;
  pinned: boolean;
  featured: boolean;
};

/**
 * Get localized title with fallback
 * If preferred locale is missing, falls back to the other language
 */
function getLocalizedTitle(row: AnnouncementRow, locale: Locale): string {
  if (locale === 'ar') {
    return row.titleAr || row.titleEn || '';
  }
  return row.titleEn || row.titleAr || '';
}

export const getAnnouncementColumns = (
  dictionary: Dictionary['school']['announcements'],
  locale: Locale
): ColumnDef<AnnouncementRow>[] => {
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
    // Use a custom accessor that returns localized title
    accessorFn: (row) => getLocalizedTitle(row, locale),
    header: ({ column }) => <DataTableColumnHeader column={column} title={columns.title} />,
    meta: { label: columns.title, variant: "text" },
    id: 'title',
    enableColumnFilter: true,
    // Custom filter that searches both languages
    filterFn: (row, id, filterValue: string) => {
      const titleEn = row.original.titleEn?.toLowerCase() || '';
      const titleAr = row.original.titleAr || '';
      const search = filterValue.toLowerCase();
      return titleEn.includes(search) || titleAr.includes(search);
    },
  },
  {
    accessorKey: "scope",
    header: ({ column }) => <DataTableColumnHeader column={column} title={columns.scope} />,
    cell: ({ getValue }) => {
      const scope = getValue<string>();
      const labels: Record<string, string> = {
        school: t.schoolWide,
        class: t.classSpecific,
        role: t.roleSpecific,
      };
      return <span className="text-sm">{labels[scope] || scope}</span>;
    },
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
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
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
    filterFn: (row, id, value) => value.includes(String(row.getValue(id))),
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

      // Get display title for confirmation dialog
      const displayTitle = getLocalizedTitle(announcement, locale);

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
          const ok = await confirmDeleteDialog(t.confirmDelete.replace('{title}', displayTitle));
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
              <Ellipsis className="h-4 w-4" />
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
