"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useModal } from "@/components/atom/modal/context";
import { deleteEvent } from "@/components/platform/events/actions";
import { DeleteToast, ErrorToast, confirmDeleteDialog } from "@/components/atom/toast";
import { Badge } from "@/components/ui/badge";
import { EventRow } from "./types";

export type { EventRow };

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

const getEventTypeBadge = (type: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    ACADEMIC: "default",
    SPORTS: "secondary",
    CULTURAL: "outline",
    PARENT_MEETING: "destructive",
    CELEBRATION: "default",
    WORKSHOP: "secondary",
    OTHER: "outline",
  };
  
  return (
    <Badge variant={variants[type] || "default"}>
      {type.replace('_', ' ')}
    </Badge>
  );
};

export const eventColumns: ColumnDef<EventRow>[] = [
  { 
    accessorKey: "title", 
    id: 'title', 
    header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />, 
    meta: { label: "Title", variant: "text" }, 
    enableColumnFilter: true 
  },
  { 
    accessorKey: "eventType", 
    id: 'eventType', 
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />, 
    cell: ({ getValue }) => getEventTypeBadge(getValue<string>()), 
    meta: { 
      label: "Type", 
      variant: "select", 
      options: [
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
    accessorKey: "location", 
    id: 'location', 
    header: ({ column }) => <DataTableColumnHeader column={column} title="Location" />, 
    cell: ({ getValue }) => <span className="text-xs">{getValue<string>()}</span>, 
    meta: { label: "Location", variant: "text" },
    enableColumnFilter: true 
  },
  { 
    accessorKey: "organizer", 
    id: 'organizer', 
    header: ({ column }) => <DataTableColumnHeader column={column} title="Organizer" />, 
    cell: ({ getValue }) => <span className="text-xs">{getValue<string>()}</span>, 
    meta: { label: "Organizer", variant: "text" } 
  },
  { 
    accessorKey: "targetAudience", 
    id: 'targetAudience', 
    header: ({ column }) => <DataTableColumnHeader column={column} title="Audience" />, 
    cell: ({ getValue }) => <span className="text-xs">{getValue<string>()}</span>, 
    meta: { label: "Audience", variant: "text" } 
  },
  { 
    accessorKey: "currentAttendees", 
    id: 'currentAttendees', 
    header: ({ column }) => <DataTableColumnHeader column={column} title="Attendees" />, 
    cell: ({ row }) => {
      const current = row.original.currentAttendees;
      const max = row.original.maxAttendees;
      return (
        <span className="text-xs tabular-nums">
          {current}{max ? `/${max}` : ''}
        </span>
      );
    }, 
    meta: { label: "Attendees", variant: "text" } 
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
      const event = row.original;
      const { openModal } = useModal();
      
      const onView = () => {
        const qs = typeof window !== 'undefined' ? (window.location.search || "") : "";
        window.location.href = `/events/${event.id}${qs}`;
      };
      
      const onEdit = () => openModal(event.id);
      
      const onDelete = async () => {
        try {
          const ok = await confirmDeleteDialog(`Delete event "${event.title}"?`);
          if (!ok) return;
          await deleteEvent({ id: event.id });
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
