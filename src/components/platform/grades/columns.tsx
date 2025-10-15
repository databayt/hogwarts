"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useModal } from "@/components/atom/modal/context";
import { deleteResult } from "@/components/platform/grades/actions";
import { DeleteToast, ErrorToast, confirmDeleteDialog } from "@/components/atom/toast";
import { type Dictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export type ResultRow = {
  id: string;
  studentName: string;
  assignmentTitle: string;
  className: string;
  score: number;
  maxScore: number;
  percentage: number;
  grade: string;
  createdAt: string;
};

export const resultColumns = (dictionary: Dictionary, locale: Locale = 'en'): ColumnDef<ResultRow>[] => [
  {
    accessorKey: "studentName",
    header: ({ column }) => <DataTableColumnHeader column={column} title={dictionary.school.grades.student} />,
    meta: { label: dictionary.school.grades.student, variant: "text" },
    id: 'studentName',
    enableColumnFilter: true,
  },
  {
    accessorKey: "assignmentTitle",
    header: ({ column }) => <DataTableColumnHeader column={column} title={dictionary.school.grades.assignment} />,
    meta: { label: dictionary.school.grades.assignment, variant: "text" },
    id: 'assignmentTitle',
    enableColumnFilter: true,
  },
  {
    accessorKey: "className",
    header: ({ column }) => <DataTableColumnHeader column={column} title={dictionary.school.grades.class} />,
    meta: { label: dictionary.school.grades.class, variant: "text" },
    id: 'className',
    enableColumnFilter: true,
  },
  {
    accessorKey: "score",
    header: ({ column }) => <DataTableColumnHeader column={column} title={dictionary.school.grades.score} />,
    meta: { label: dictionary.school.grades.score, variant: "number" },
    id: 'score',
    enableColumnFilter: true,
  },
  {
    accessorKey: "maxScore",
    header: ({ column }) => <DataTableColumnHeader column={column} title={dictionary.school.grades.maxScore} />,
    meta: { label: dictionary.school.grades.maxScore, variant: "number" },
    id: 'maxScore',
    enableColumnFilter: true,
  },
  {
    accessorKey: "percentage",
    header: ({ column }) => <DataTableColumnHeader column={column} title={dictionary.school.grades.percentage} />,
    meta: { label: dictionary.school.grades.percentage, variant: "number" },
    id: 'percentage',
    cell: ({ getValue }) => {
      const value = getValue<number>() || 0;
      return (
        <small className="tabular-nums">
          {new Intl.NumberFormat(locale, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
          }).format(value)}%
        </small>
      );
    },
  },
  {
    accessorKey: "grade",
    header: ({ column }) => <DataTableColumnHeader column={column} title={dictionary.school.grades.grade} />,
    meta: { label: dictionary.school.grades.grade, variant: "text" },
    id: 'grade',
    enableColumnFilter: true,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title={dictionary.school.grades.created} />,
    meta: { label: dictionary.school.grades.created, variant: "text" },
    cell: ({ getValue }) => (
      <small className="tabular-nums">{new Date(getValue<string>()).toLocaleDateString(locale)}</small>
    ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">{dictionary.school.grades.actions}</span>,
    cell: ({ row }) => {
      const result = row.original;
      const { openModal } = useModal();
      const onView = () => {
        const qs = typeof window !== 'undefined' ? (window.location.search || "") : "";
        window.location.href = `/grades/${result.id}${qs}`;
      };
      const onEdit = () => openModal(result.id);
      const onDelete = async () => {
        try {
          const ok = await confirmDeleteDialog(dictionary.school.grades.deleteResultConfirm.replace('{studentName}', result.studentName));
          if (!ok) return;
          await deleteResult({ id: result.id });
          DeleteToast();
        } catch (e) {
          ErrorToast(e instanceof Error ? e.message : dictionary.school.grades.failedToUpdate);
        }
      };
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">{dictionary.school.grades.openMenu}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{dictionary.school.grades.actions}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onView}>{dictionary.school.common.actions.view}</DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>{dictionary.school.common.actions.edit}</DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete}>{dictionary.school.common.actions.delete}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
    enableColumnFilter: false,
  },
];
