"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Ellipsis } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useModal } from "@/components/atom/modal/context";
import { ErrorToast } from "@/components/atom/toast";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";

export type ParentRow = {
  id: string;
  userId: string | null;
  name: string;
  emailAddress: string;
  status: string;
  createdAt: string;
};

export interface ParentColumnCallbacks {
  onDelete?: (row: ParentRow) => void;
}

export const getParentColumns = (dictionary?: Dictionary['school']['parents'], lang?: Locale, callbacks?: ParentColumnCallbacks): ColumnDef<ParentRow>[] => {
  const t = {
    name: dictionary?.name || (lang === 'ar' ? 'الاسم' : 'Name'),
    email: dictionary?.email || (lang === 'ar' ? 'البريد الإلكتروني' : 'Email'),
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
    accessorKey: "emailAddress",
    id: 'emailAddress',
    header: ({ column }) => <DataTableColumnHeader column={column} title={t.email} />,
    meta: { label: t.email, variant: "text" },
    enableColumnFilter: true
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
      const parent = row.original;
      const { openModal } = useModal();
      const onView = () => {
        if (!parent.userId) {
          ErrorToast(lang === 'ar' ? 'هذا الوالد ليس لديه حساب مستخدم' : 'This parent does not have a user account');
          return;
        }
        const qs = typeof window !== 'undefined' ? (window.location.search || "") : "";
        window.location.href = `/profile/${parent.userId}${qs}`;
      };
      const onEdit = () => openModal(parent.id);
      const onDelete = () => {
        callbacks?.onDelete?.(parent);
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

// NOTE: Do NOT export pre-generated columns. Always use getParentColumns()
// inside useMemo in client components to avoid SSR hook issues.
