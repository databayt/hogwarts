"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Ellipsis } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useModal } from "@/components/atom/modal/context";
import { deleteStudent } from "@/components/platform/students/actions";
import { DeleteToast, ErrorToast, confirmDeleteDialog } from "@/components/atom/toast";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";

export type StudentRow = {
  id: string;
  userId: string | null;
  name: string;
  className: string;
  status: string;
  createdAt: string;
};

export const getStudentColumns = (dictionary?: Dictionary['school']['students'], lang?: Locale): ColumnDef<StudentRow>[] => {
  const t = {
    name: dictionary?.fullName || (lang === 'ar' ? 'الاسم' : 'Name'),
    class: dictionary?.class || (lang === 'ar' ? 'الفصل' : 'Class'),
    status: dictionary?.status || (lang === 'ar' ? 'الحالة' : 'Status'),
    created: dictionary?.created || (lang === 'ar' ? 'تاريخ الإنشاء' : 'Created'),
    actions: lang === 'ar' ? 'إجراءات' : 'Actions',
    view: lang === 'ar' ? 'عرض' : 'View',
    edit: lang === 'ar' ? 'تعديل' : 'Edit',
    delete: lang === 'ar' ? 'حذف' : 'Delete',
    active: dictionary?.active || (lang === 'ar' ? 'نشط' : 'Active'),
    inactive: dictionary?.inactive || (lang === 'ar' ? 'غير نشط' : 'Inactive'),
  };

  return [
  {
    accessorKey: "name",
    id: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title={t.name} />,
    meta: { label: t.name, variant: "text" },
    enableColumnFilter: true
  },
  {
    accessorKey: "className",
    id: 'className',
    header: ({ column }) => <DataTableColumnHeader column={column} title={t.class} />,
    meta: { label: t.class, variant: "text" }
  },
  {
    accessorKey: "status",
    id: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title={t.status} />,
    meta: {
      label: t.status,
      variant: "select",
      options: [
        { label: t.active, value: 'active' },
        { label: t.inactive, value: 'inactive' }
      ]
    },
    enableColumnFilter: true
  },
  {
    accessorKey: "createdAt",
    id: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title={t.created} />,
    cell: ({ getValue }) => <span className="text-xs tabular-nums text-muted-foreground">{new Date(getValue<string>()).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}</span>,
    meta: { label: t.created, variant: "text" }
  },
  {
    id: "actions",
    header: () => <span className="sr-only">{t.actions}</span>,
    cell: ({ row }) => {
      const student = row.original;
      const { openModal } = useModal();
      const onView = () => {
        if (!student.userId) {
          ErrorToast(lang === 'ar' ? 'هذا الطالب ليس لديه حساب مستخدم' : 'This student does not have a user account');
          return;
        }
        const qs = typeof window !== 'undefined' ? (window.location.search || "") : "";
        window.location.href = `/profile/${student.userId}${qs}`;
      };
      const onEdit = () => openModal(student.id);
      const onDelete = async () => {
        try {
          const deleteMsg = lang === 'ar' ? `حذف ${student.name}؟` : `Delete ${student.name}?`;
          const ok = await confirmDeleteDialog(deleteMsg);
          if (!ok) return;
          await deleteStudent({ id: student.id });
          DeleteToast();
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

// NOTE: Do NOT export pre-generated columns. Always use getStudentColumns()
// inside useMemo in client components to avoid SSR hook issues.



