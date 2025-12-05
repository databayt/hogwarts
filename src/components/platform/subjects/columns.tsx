"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useModal } from "@/components/atom/modal/context";
import { deleteSubject } from "@/components/platform/subjects/actions";
import { DeleteToast, ErrorToast, confirmDeleteDialog } from "@/components/atom/toast";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";

export type SubjectRow = {
  id: string;
  subjectName: string;
  subjectNameAr: string | null;
  departmentName: string;
  departmentNameAr: string | null;
  createdAt: string;
};

/**
 * Get localized subject name based on locale
 */
export function getLocalizedSubjectName(row: SubjectRow, locale: Locale): string {
  if (locale === 'ar') {
    return row.subjectNameAr || row.subjectName || '';
  }
  return row.subjectName || row.subjectNameAr || '';
}

/**
 * Get localized department name based on locale
 */
export function getLocalizedDepartmentName(row: SubjectRow, locale: Locale): string {
  if (locale === 'ar') {
    return row.departmentNameAr || row.departmentName || '';
  }
  return row.departmentName || row.departmentNameAr || '';
}

export const getSubjectColumns = (dictionary?: Dictionary['school']['subjects'], lang?: Locale): ColumnDef<SubjectRow>[] => {
  const t = {
    subject: dictionary?.subject || (lang === 'ar' ? 'المادة' : 'Subject'),
    department: dictionary?.department || (lang === 'ar' ? 'القسم' : 'Department'),
    created: dictionary?.created || (lang === 'ar' ? 'تاريخ الإنشاء' : 'Created'),
    actions: lang === 'ar' ? 'إجراءات' : 'Actions',
    view: lang === 'ar' ? 'عرض' : 'View',
    edit: lang === 'ar' ? 'تعديل' : 'Edit',
    delete: lang === 'ar' ? 'حذف' : 'Delete',
  };

  return [
  {
    accessorKey: "subjectName",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t.subject} />,
    meta: { label: t.subject, variant: "text" },
    id: 'subjectName',
    cell: ({ row }) => {
      const displayName = lang ? getLocalizedSubjectName(row.original, lang) : row.original.subjectName;
      return <span>{displayName}</span>;
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: "departmentName",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t.department} />,
    meta: { label: t.department, variant: "text" },
    id: 'departmentName',
    cell: ({ row }) => {
      const displayName = lang ? getLocalizedDepartmentName(row.original, lang) : row.original.departmentName;
      return <span>{displayName}</span>;
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t.created} />,
    meta: { label: t.created, variant: "text" },
    cell: ({ getValue }) => (
      <span className="text-xs tabular-nums text-muted-foreground">{new Date(getValue<string>()).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}</span>
    ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">{t.actions}</span>,
    cell: ({ row }) => {
      const subject = row.original;
      const { openModal } = useModal();
      const router = useRouter();
      const displayName = lang ? getLocalizedSubjectName(subject, lang) : subject.subjectName;
      const onView = () => {
        const qs = typeof window !== 'undefined' ? (window.location.search || "") : "";
        window.location.href = `/subjects/${subject.id}${qs}`;
      };
      const onEdit = () => openModal(subject.id);
      const onDelete = async () => {
        try {
          const ok = await confirmDeleteDialog(`${t.delete} ${displayName}?`);
          if (!ok) return;
          await deleteSubject({ id: subject.id });
          DeleteToast();
          router.refresh();
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

// NOTE: Do NOT export pre-generated columns. Always use getSubjectColumns()
// inside useMemo in client components to avoid SSR hook issues.
