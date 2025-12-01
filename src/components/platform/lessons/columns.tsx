"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useModal } from "@/components/atom/modal/context";
import { deleteLesson } from "@/components/platform/lessons/actions";
import { DeleteToast, ErrorToast, confirmDeleteDialog } from "@/components/atom/toast";
import { Badge } from "@/components/ui/badge";

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

export const getLessonColumns = (): ColumnDef<LessonRow>[] => [
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
    accessorKey: "teacherName", 
    id: 'teacherName', 
    header: ({ column }) => <DataTableColumnHeader column={column} title="Teacher" />, 
    meta: { label: "Teacher", variant: "text" }, 
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
    accessorKey: "lessonDate", 
    id: 'lessonDate', 
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
    accessorKey: "endTime", 
    id: 'endTime', 
    header: ({ column }) => <DataTableColumnHeader column={column} title="End Time" />, 
    cell: ({ getValue }) => <span className="text-xs tabular-nums">{getValue<string>()}</span>, 
    meta: { label: "End Time", variant: "text" } 
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
      const lesson = row.original;
      const { openModal } = useModal();
      
      const onView = () => {
        const qs = typeof window !== 'undefined' ? (window.location.search || "") : "";
        window.location.href = `/lessons/${lesson.id}${qs}`;
      };
      
      const onEdit = () => openModal(lesson.id);
      
      const onDelete = async () => {
        try {
          const ok = await confirmDeleteDialog(`Delete lesson "${lesson.title}"?`);
          if (!ok) return;
          await deleteLesson({ id: lesson.id });
          DeleteToast();
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

// NOTE: Do NOT export pre-generated columns. Always use getLessonColumns()
// inside useMemo in client components to avoid SSR hook issues.
