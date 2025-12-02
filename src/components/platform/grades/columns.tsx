"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ellipsis } from "@aliimam/icons";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useModal } from "@/components/atom/modal/context";
import { deleteResult } from "@/components/platform/grades/actions";
import { DeleteToast, ErrorToast, confirmDeleteDialog } from "@/components/atom/toast";
import { type Dictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

// Helper to extract assignment type badge
function getAssignmentBadge(title: string): { name: string; type: string } {
  const lower = title.toLowerCase();
  if (lower.includes("homework")) return { name: title.replace(/homework\s*/i, "").trim() || "HW", type: "Homework" };
  if (lower.includes("quiz")) return { name: title.replace(/quiz\s*/i, "").trim() || "Quiz", type: "Quiz" };
  if (lower.includes("exam")) return { name: title.replace(/exam\s*/i, "").trim() || "Exam", type: "Exam" };
  if (lower.includes("project")) return { name: title.replace(/project\s*/i, "").trim() || "Project", type: "Project" };
  if (lower.includes("test")) return { name: title.replace(/test\s*/i, "").trim() || "Test", type: "Test" };
  if (lower.includes("midterm")) return { name: "Midterm", type: "Exam" };
  if (lower.includes("final")) return { name: "Final", type: "Exam" };
  return { name: title, type: "Assignment" };
}

// Helper to extract class badge info
function getClassBadge(className: string): { name: string; section?: string } {
  // Extract section like "A", "B", "Week 1" etc.
  const match = className.match(/(.+?)\s*[-–]\s*(.+)/);
  if (match) return { name: match[1].trim(), section: match[2].trim() };
  return { name: className };
}

// Grade color helper
function getGradeVariant(grade: string): "default" | "secondary" | "destructive" | "outline" {
  if (grade.startsWith("A")) return "default";
  if (grade.startsWith("B")) return "secondary";
  if (grade.startsWith("C")) return "outline";
  return "destructive";
}

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

export const resultColumns = (t: Dictionary["school"]["grades"], locale: Locale = 'en'): ColumnDef<ResultRow>[] => [
  {
    accessorKey: "studentName",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t.student} />,
    meta: { label: t.student, variant: "text" },
    id: 'studentName',
    enableColumnFilter: true,
  },
  {
    accessorKey: "assignmentTitle",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t.assignment} />,
    meta: { label: t.assignment, variant: "text" },
    id: 'assignmentTitle',
    enableColumnFilter: true,
    cell: ({ getValue }) => {
      const title = getValue<string>() || "";
      const { name, type } = getAssignmentBadge(title);
      return (
        <div className="flex items-center gap-2">
          <span>{name}</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{type}</Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "className",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t.class} />,
    meta: { label: t.class, variant: "text" },
    id: 'className',
    enableColumnFilter: true,
    cell: ({ getValue }) => {
      const name = getValue<string>() || "";
      const { name: className, section } = getClassBadge(name);
      return (
        <div className="flex items-center gap-2">
          <span>{className}</span>
          {section && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{section}</Badge>}
        </div>
      );
    },
  },
  {
    accessorKey: "score",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t.score} />,
    meta: { label: t.score, variant: "number" },
    id: 'score',
    enableColumnFilter: true,
  },
  {
    accessorKey: "maxScore",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t.maxScore} />,
    meta: { label: t.maxScore, variant: "number" },
    id: 'maxScore',
    enableColumnFilter: true,
  },
  {
    accessorKey: "percentage",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t.percentage} className="justify-center" />,
    meta: { label: t.percentage, variant: "number" },
    id: 'percentage',
    cell: ({ getValue }) => {
      const value = getValue<number>() || 0;
      return (
        <div className="text-center">
          <small className="tabular-nums">
            {new Intl.NumberFormat(locale, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(value)}%
          </small>
        </div>
      );
    },
  },
  {
    accessorKey: "grade",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t.grade} className="justify-center" />,
    meta: { label: t.grade, variant: "text" },
    id: 'grade',
    enableColumnFilter: true,
    cell: ({ getValue }) => {
      const grade = getValue<string>() || "";
      return (
        <div className="text-center">
          <Badge variant={getGradeVariant(grade)}>{grade}</Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t.created} />,
    meta: { label: t.created, variant: "text" },
    cell: ({ getValue }) => (
      <small className="tabular-nums">{new Date(getValue<string>()).toLocaleDateString(locale)}</small>
    ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">{t.actions}</span>,
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
          const ok = await confirmDeleteDialog(t.deleteResultConfirm.replace('{studentName}', result.studentName));
          if (!ok) return;
          await deleteResult({ id: result.id });
          DeleteToast();
        } catch (e) {
          ErrorToast(e instanceof Error ? e.message : t.failedToUpdate);
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
            <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onView}>{t.viewGrade}</DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>{t.editGrade}</DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete}>{t.deleteGrade}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
    enableColumnFilter: false,
  },
];
