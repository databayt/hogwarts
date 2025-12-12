"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Ellipsis } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useModal } from "@/components/atom/modal/context";
import { Badge } from "@/components/ui/badge";
import { ExamRow } from "./types";

export type { ExamRow };

export interface ExamColumnCallbacks {
  onDelete?: (row: ExamRow) => void;
}

const getStatusBadge = (status: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    PLANNED: "default",
    IN_PROGRESS: "secondary",
    COMPLETED: "outline",
    CANCELLED: "destructive",
  };
  
  return (
    <Badge variant={variants[status] || "default"}>
      {status.replace('_', ' ')}
    </Badge>
  );
};

// Short labels for exam types - keep badges compact
const examTypeLabels: Record<string, string> = {
  MIDTERM: "Mid",
  FINAL: "Final",
  QUIZ: "Quiz",
  TEST: "Test",
  ASSIGNMENT: "HW",
  HOMEWORK: "HW",
  PROJECT: "Proj",
  PRACTICAL: "Prac",
};

const getExamTypeBadge = (type: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    MIDTERM: "default",
    FINAL: "secondary",
    QUIZ: "outline",
    TEST: "outline",
    ASSIGNMENT: "destructive",
    HOMEWORK: "destructive",
    PROJECT: "default",
    PRACTICAL: "default",
  };

  return (
    <Badge variant={variants[type] || "default"}>
      {examTypeLabels[type] || type}
    </Badge>
  );
};

export const getExamColumns = (callbacks?: ExamColumnCallbacks): ColumnDef<ExamRow>[] => [
  { 
    accessorKey: "title", 
    id: 'title', 
    header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />, 
    meta: { label: "Title", variant: "text" }, 
    enableColumnFilter: true 
  },
  { 
    accessorKey: "className", 
    id: 'className', 
    header: ({ column }) => <DataTableColumnHeader column={column} title="Class" />, 
    meta: { label: "Class", variant: "text" }, 
    enableColumnFilter: true 
  },
  { 
    accessorKey: "subjectName", 
    id: 'subjectName', 
    header: ({ column }) => <DataTableColumnHeader column={column} title="Subject" />, 
    meta: { label: "Subject", variant: "text" }, 
    enableColumnFilter: true 
  },
  { 
    accessorKey: "examType", 
    id: 'examType', 
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />, 
    cell: ({ getValue }) => getExamTypeBadge(getValue<string>()), 
    meta: { 
      label: "Type", 
      variant: "select", 
      options: [
        { label: 'Midterm', value: 'MIDTERM' }, 
        { label: 'Final', value: 'FINAL' }, 
        { label: 'Quiz', value: 'QUIZ' },
        { label: 'Assignment', value: 'ASSIGNMENT' },
        { label: 'Project', value: 'PROJECT' }
      ] 
    }, 
    enableColumnFilter: true 
  },
  { 
    accessorKey: "examDate", 
    id: 'examDate', 
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />, 
    cell: ({ getValue }) => <span className="text-xs tabular-nums text-muted-foreground">{new Date(getValue<string>()).toLocaleDateString()}</span>, 
    meta: { label: "Date", variant: "text" } 
  },
  { 
    accessorKey: "startTime", 
    id: 'startTime', 
    header: ({ column }) => <DataTableColumnHeader column={column} title="Start Time" />, 
    cell: ({ getValue }) => <span className="text-xs tabular-nums">{getValue<string>()}</span>, 
    meta: { label: "Start Time", variant: "text" } 
  },
  { 
    accessorKey: "duration", 
    id: 'duration', 
    header: ({ column }) => <DataTableColumnHeader column={column} title="Duration" />, 
    cell: ({ getValue }) => <span className="text-xs tabular-nums">{getValue<number>()} min</span>, 
    meta: { label: "Duration", variant: "text" } 
  },
  { 
    accessorKey: "totalMarks", 
    id: 'totalMarks', 
    header: ({ column }) => <DataTableColumnHeader column={column} title="Total Marks" />, 
    cell: ({ getValue }) => <span className="text-xs tabular-nums font-medium">{getValue<number>()}</span>, 
    meta: { label: "Total Marks", variant: "text" } 
  },
  { 
    accessorKey: "status", 
    id: 'status', 
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />, 
    cell: ({ getValue }) => getStatusBadge(getValue<string>()), 
    meta: { 
      label: "Status", 
      variant: "select", 
      options: [
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
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => {
      const exam = row.original;
      const { openModal } = useModal();

      const onView = () => {
        const qs = typeof window !== 'undefined' ? (window.location.search || "") : "";
        window.location.href = `/exams/${exam.id}${qs}`;
      };

      const onEdit = () => openModal(exam.id);

      const onDelete = () => {
        callbacks?.onDelete?.(exam);
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <Ellipsis className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onView}>View</DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
    enableColumnFilter: false,
  },
];

// NOTE: Do NOT export pre-generated columns. Always use getExamColumns()
// inside useMemo in client components to avoid SSR hook issues.
