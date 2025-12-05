"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Ellipsis } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useModal } from "@/components/atom/modal/context";
import { deleteEvent } from "@/components/platform/events/actions";
import { DeleteToast, ErrorToast, confirmDeleteDialog } from "@/components/atom/toast";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { EventRow } from "./types";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";

export type { EventRow };

const getStatusBadge = (status: string, lang?: Locale) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    PLANNED: "default",
    IN_PROGRESS: "secondary",
    COMPLETED: "outline",
    CANCELLED: "destructive",
  };

  const labels: Record<string, { en: string; ar: string }> = {
    PLANNED: { en: 'Planned', ar: 'مخطط' },
    IN_PROGRESS: { en: 'In Progress', ar: 'قيد التنفيذ' },
    COMPLETED: { en: 'Completed', ar: 'مكتمل' },
    CANCELLED: { en: 'Cancelled', ar: 'ملغي' },
  };

  const label = labels[status]?.[lang || 'en'] || status.replace('_', ' ');

  return (
    <Badge variant={variants[status] || "default"}>
      {label}
    </Badge>
  );
};

const getEventTypeBadge = (type: string, lang?: Locale) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    ACADEMIC: "default",
    SPORTS: "secondary",
    CULTURAL: "outline",
    PARENT_MEETING: "destructive",
    CELEBRATION: "default",
    WORKSHOP: "secondary",
    OTHER: "outline",
  };

  const labels: Record<string, { en: string; ar: string }> = {
    ACADEMIC: { en: 'Academic', ar: 'أكاديمي' },
    SPORTS: { en: 'Sports', ar: 'رياضي' },
    CULTURAL: { en: 'Cultural', ar: 'ثقافي' },
    PARENT_MEETING: { en: 'Parent Meeting', ar: 'اجتماع أولياء الأمور' },
    CELEBRATION: { en: 'Celebration', ar: 'احتفال' },
    WORKSHOP: { en: 'Workshop', ar: 'ورشة عمل' },
    OTHER: { en: 'Other', ar: 'أخرى' },
  };

  const label = labels[type]?.[lang || 'en'] || type.replace('_', ' ');

  return (
    <Badge variant={variants[type] || "default"}>
      {label}
    </Badge>
  );
};

export const getEventColumns = (dictionary?: Dictionary['school']['events'], lang?: Locale): ColumnDef<EventRow>[] => {
  const t = {
    title: dictionary?.title || (lang === 'ar' ? 'العنوان' : 'Title'),
    type: dictionary?.type || (lang === 'ar' ? 'النوع' : 'Type'),
    date: dictionary?.date || (lang === 'ar' ? 'التاريخ' : 'Date'),
    startTime: dictionary?.startTime || (lang === 'ar' ? 'وقت البدء' : 'Start Time'),
    location: dictionary?.location || (lang === 'ar' ? 'الموقع' : 'Location'),
    organizer: dictionary?.organizer || (lang === 'ar' ? 'المنظم' : 'Organizer'),
    audience: dictionary?.audience || (lang === 'ar' ? 'الجمهور' : 'Audience'),
    attendees: dictionary?.attendees || (lang === 'ar' ? 'الحضور' : 'Attendees'),
    status: dictionary?.status || (lang === 'ar' ? 'الحالة' : 'Status'),
    actions: lang === 'ar' ? 'إجراءات' : 'Actions',
    view: lang === 'ar' ? 'عرض' : 'View',
    edit: lang === 'ar' ? 'تعديل' : 'Edit',
    delete: lang === 'ar' ? 'حذف' : 'Delete',
  };

  return [
  {
    accessorKey: "title",
    id: 'title',
    header: ({ column }) => <DataTableColumnHeader column={column} title={t.title} />,
    meta: { label: t.title, variant: "text" },
    enableColumnFilter: true
  },
  {
    accessorKey: "eventType",
    id: 'eventType',
    header: ({ column }) => <DataTableColumnHeader column={column} title={t.type} />,
    cell: ({ getValue }) => getEventTypeBadge(getValue<string>(), lang),
    meta: {
      label: t.type,
      variant: "select",
      options: lang === 'ar' ? [
        { label: 'أكاديمي', value: 'ACADEMIC' },
        { label: 'رياضي', value: 'SPORTS' },
        { label: 'ثقافي', value: 'CULTURAL' },
        { label: 'اجتماع أولياء الأمور', value: 'PARENT_MEETING' },
        { label: 'احتفال', value: 'CELEBRATION' },
        { label: 'ورشة عمل', value: 'WORKSHOP' },
        { label: 'أخرى', value: 'OTHER' }
      ] : [
        { label: 'Academic', value: 'ACADEMIC' },
        { label: 'Sports', value: 'SPORTS' },
        { label: 'Cultural', value: 'CULTURAL' },
        { label: 'Parent Meeting', value: 'PARENT_MEETING' },
        { label: 'Celebration', value: 'CELEBRATION' },
        { label: 'Workshop', value: 'WORKSHOP' },
        { label: 'Other', value: 'OTHER' }
      ]
    },
    enableColumnFilter: true
  },
  {
    accessorKey: "eventDate",
    id: 'eventDate',
    header: ({ column }) => <DataTableColumnHeader column={column} title={t.date} />,
    cell: ({ getValue }) => <span className="text-xs tabular-nums text-muted-foreground">{new Date(getValue<string>()).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}</span>,
    meta: { label: t.date, variant: "text" }
  },
  {
    accessorKey: "startTime",
    id: 'startTime',
    header: ({ column }) => <DataTableColumnHeader column={column} title={t.startTime} />,
    cell: ({ getValue }) => <span className="text-xs tabular-nums">{getValue<string>()}</span>,
    meta: { label: t.startTime, variant: "text" }
  },
  {
    accessorKey: "location",
    id: 'location',
    header: ({ column }) => <DataTableColumnHeader column={column} title={t.location} />,
    cell: ({ getValue }) => <span className="text-xs">{getValue<string>()}</span>,
    meta: { label: t.location, variant: "text" },
    enableColumnFilter: true
  },
  {
    accessorKey: "organizer",
    id: 'organizer',
    header: ({ column }) => <DataTableColumnHeader column={column} title={t.organizer} />,
    cell: ({ getValue }) => <span className="text-xs">{getValue<string>()}</span>,
    meta: { label: t.organizer, variant: "text" }
  },
  {
    accessorKey: "targetAudience",
    id: 'targetAudience',
    header: ({ column }) => <DataTableColumnHeader column={column} title={t.audience} />,
    cell: ({ getValue }) => <span className="text-xs">{getValue<string>()}</span>,
    meta: { label: t.audience, variant: "text" }
  },
  {
    accessorKey: "currentAttendees",
    id: 'currentAttendees',
    header: ({ column }) => <DataTableColumnHeader column={column} title={t.attendees} />,
    cell: ({ row }) => {
      const current = row.original.currentAttendees;
      const max = row.original.maxAttendees;
      return (
        <span className="text-xs tabular-nums">
          {current}{max ? `/${max}` : ''}
        </span>
      );
    },
    meta: { label: t.attendees, variant: "text" }
  },
  {
    accessorKey: "status",
    id: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title={t.status} />,
    cell: ({ getValue }) => getStatusBadge(getValue<string>(), lang),
    meta: {
      label: t.status,
      variant: "select",
      options: lang === 'ar' ? [
        { label: 'مخطط', value: 'PLANNED' },
        { label: 'قيد التنفيذ', value: 'IN_PROGRESS' },
        { label: 'مكتمل', value: 'COMPLETED' },
        { label: 'ملغي', value: 'CANCELLED' }
      ] : [
        { label: 'Planned', value: 'PLANNED' },
        { label: 'In Progress', value: 'IN_PROGRESS' },
        { label: 'Completed', value: 'COMPLETED' },
        { label: 'Cancelled', value: 'CANCELLED' }
      ]
    },
    enableColumnFilter: true
  },
  {
    id: "actions",
    header: () => <span className="sr-only">{t.actions}</span>,
    cell: ({ row }) => {
      const event = row.original;
      const { openModal } = useModal();
      const router = useRouter();

      const onView = () => {
        const qs = typeof window !== 'undefined' ? (window.location.search || "") : "";
        window.location.href = `/events/${event.id}${qs}`;
      };

      const onEdit = () => openModal(event.id);

      const onDelete = async () => {
        try {
          const deleteMsg = lang === 'ar' ? `حذف الحدث "${event.title}"؟` : `Delete event "${event.title}"?`;
          const ok = await confirmDeleteDialog(deleteMsg);
          if (!ok) return;
          await deleteEvent({ id: event.id });
          DeleteToast();
          router.refresh();
        } catch (e) {
          ErrorToast(e instanceof Error ? e.message : (lang === 'ar' ? 'فشل الحذف' : 'Failed to delete'));
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <Ellipsis className="h-4 w-4" />
              <span className="sr-only">{t.actions}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onView}>{t.view}</DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>{t.edit}</DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete}>{t.delete}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
    enableColumnFilter: false,
  },
  ];
};

// NOTE: Do NOT export pre-generated columns. Always use getEventColumns()
// inside useMemo in client components to avoid SSR hook issues.
