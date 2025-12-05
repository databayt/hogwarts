"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Ellipsis } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useModal } from "@/components/atom/modal/context";
import { deleteLesson } from "@/components/platform/lessons/actions";
import { DeleteToast, ErrorToast, confirmDeleteDialog } from "@/components/atom/toast";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";

export type LessonRow = {
  id: string;
  title: string;
  className: string;
  teacherName: string;
  subjectName: string;
  lessonDate: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
};

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

export const getLessonColumns = (dictionary?: Dictionary['school']['lessons'], lang?: Locale): ColumnDef<LessonRow>[] => {
  const t = {
    title: dictionary?.title || (lang === 'ar' ? 'العنوان' : 'Title'),
    class: dictionary?.class || (lang === 'ar' ? 'الفصل' : 'Class'),
    teacher: dictionary?.teacher || (lang === 'ar' ? 'المعلم' : 'Teacher'),
    subject: dictionary?.subject || (lang === 'ar' ? 'المادة' : 'Subject'),
    date: dictionary?.date || (lang === 'ar' ? 'التاريخ' : 'Date'),
    startTime: dictionary?.startTime || (lang === 'ar' ? 'وقت البدء' : 'Start Time'),
    endTime: dictionary?.endTime || (lang === 'ar' ? 'وقت الانتهاء' : 'End Time'),
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
    accessorKey: "className",
    id: 'className',
    header: ({ column }) => <DataTableColumnHeader column={column} title={t.class} />,
    meta: { label: t.class, variant: "text" },
    enableColumnFilter: true
  },
  {
    accessorKey: "teacherName",
    id: 'teacherName',
    header: ({ column }) => <DataTableColumnHeader column={column} title={t.teacher} />,
    meta: { label: t.teacher, variant: "text" },
    enableColumnFilter: true
  },
  {
    accessorKey: "subjectName",
    id: 'subjectName',
    header: ({ column }) => <DataTableColumnHeader column={column} title={t.subject} />,
    meta: { label: t.subject, variant: "text" },
    enableColumnFilter: true
  },
  {
    accessorKey: "lessonDate",
    id: 'lessonDate',
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
    accessorKey: "endTime",
    id: 'endTime',
    header: ({ column }) => <DataTableColumnHeader column={column} title={t.endTime} />,
    cell: ({ getValue }) => <span className="text-xs tabular-nums">{getValue<string>()}</span>,
    meta: { label: t.endTime, variant: "text" }
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
      const lesson = row.original;
      const { openModal } = useModal();
      const router = useRouter();

      const onView = () => {
        const qs = typeof window !== 'undefined' ? (window.location.search || "") : "";
        window.location.href = `/lessons/${lesson.id}${qs}`;
      };

      const onEdit = () => openModal(lesson.id);

      const onDelete = async () => {
        try {
          const deleteMsg = lang === 'ar' ? `حذف الدرس "${lesson.title}"؟` : `Delete lesson "${lesson.title}"?`;
          const ok = await confirmDeleteDialog(deleteMsg);
          if (!ok) return;
          await deleteLesson({ id: lesson.id });
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

// NOTE: Do NOT export pre-generated columns. Always use getLessonColumns()
// inside useMemo in client components to avoid SSR hook issues.
