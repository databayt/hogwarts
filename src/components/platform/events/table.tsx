"use client";

import { useMemo, useState, useCallback, useTransition } from "react";
import { DataTable } from "@/components/table/data-table";
import { useDataTable } from "@/components/table/use-data-table";
import { getEventColumns, type EventRow } from "./columns";
import { useModal } from "@/components/atom/modal/context";
import Modal from "@/components/atom/modal/modal";
import { EventCreateForm } from "@/components/platform/events/form";
import { getEvents, getEventsCSV, deleteEvent } from "./actions";
import { usePlatformView } from "@/hooks/use-platform-view";
import { usePlatformData } from "@/hooks/use-platform-data";
import {
  PlatformToolbar,
  GridCard,
  GridContainer,
  GridEmptyState,
} from "@/components/platform/shared";
import { Calendar, MapPin, Users } from "@aliimam/icons";
import { useRouter } from "next/navigation";
import { DeleteToast, ErrorToast, confirmDeleteDialog } from "@/components/atom/toast";
import { Badge } from "@/components/ui/badge";

interface EventsTableProps {
  initialData: EventRow[];
  total: number;
  perPage?: number;
}

export function EventsTable({ initialData, total, perPage = 20 }: EventsTableProps) {
  const router = useRouter();
  const { openModal } = useModal();
  const [isPending, startTransition] = useTransition();

  // Translations
  const t = {
    title: "Title",
    type: "Type",
    date: "Date",
    location: "Location",
    organizer: "Organizer",
    attendees: "Attendees",
    status: "Status",
    actions: "Actions",
    editEvent: "Edit Event",
    deleteEvent: "Delete Event",
    viewEvent: "View Event",
    createEvent: "Create Event",
    allEvents: "All Events",
    noEvents: "No events found",
    addNewEvent: "Schedule a new school event",
    search: "Search events...",
    create: "Create",
    export: "Export",
    reset: "Reset",
  };

  // View mode (table/grid)
  const { view, toggleView } = usePlatformView({ defaultView: "table" });

  // Search state
  const [searchValue, setSearchValue] = useState("");

  // Data management with optimistic updates
  const {
    data,
    total: dataTotal,
    isLoading,
    hasMore,
    loadMore,
    refresh,
    optimisticRemove,
  } = usePlatformData<EventRow, { title?: string }>({
    initialData,
    total,
    perPage,
    fetcher: async (params) => {
      const result = await getEvents(params);
      return { rows: result.rows as EventRow[], total: result.total };
    },
    filters: searchValue ? { title: searchValue } : undefined,
  });

  // Generate columns on the client side
  const columns = useMemo(() => getEventColumns(), []);

  // Table instance
  const { table } = useDataTable<EventRow>({
    data,
    columns,
    pageCount: 1,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: data.length || perPage,
      },
      columnVisibility: {
        // Default visible: title, eventType, eventDate, status
        location: false,
        currentAttendees: false,
        maxAttendees: false,
        isPublic: false,
        createdAt: false,
      },
    },
  });

  // Handle search
  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  // Handle delete with optimistic update
  const handleDelete = useCallback(async (event: EventRow) => {
    try {
      const ok = await confirmDeleteDialog(`Delete "${event.title}"?`);
      if (!ok) return;

      // Optimistic remove
      optimisticRemove(event.id);

      const result = await deleteEvent({ id: event.id });
      if (result.success) {
        DeleteToast();
      } else {
        // Revert on error
        refresh();
        ErrorToast("Failed to delete event");
      }
    } catch (e) {
      refresh();
      ErrorToast(e instanceof Error ? e.message : "Failed to delete");
    }
  }, [optimisticRemove, refresh]);

  // Handle edit
  const handleEdit = useCallback((id: string) => {
    openModal(id);
  }, [openModal]);

  // Handle view
  const handleView = useCallback((id: string) => {
    router.push(`/events/${id}`);
  }, [router]);

  // Export CSV wrapper
  const handleExportCSV = useCallback(async (filters?: Record<string, unknown>) => {
    return getEventsCSV(filters);
  }, []);

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      PLANNED: "default",
      IN_PROGRESS: "secondary",
      COMPLETED: "outline",
      CANCELLED: "destructive",
    };
    return { label: status.replace("_", " "), variant: variants[status] || "default" };
  };

  // Toolbar translations
  const toolbarTranslations = {
    search: t.search,
    create: t.create,
    reset: t.reset,
    export: t.export,
    exportCSV: "Export CSV",
    exporting: "Exporting...",
  };

  return (
    <>
      <PlatformToolbar
        table={view === "table" ? table : undefined}
        view={view}
        onToggleView={toggleView}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t.search}
        onCreate={() => openModal()}
        getCSV={handleExportCSV}
        entityName="events"
        translations={toolbarTranslations}
      />

      {view === "table" ? (
        <DataTable
          table={table}
          paginationMode="load-more"
          hasMore={hasMore}
          isLoading={isLoading || isPending}
          onLoadMore={loadMore}
        />
      ) : (
        <>
          {data.length === 0 ? (
            <GridEmptyState
              title={t.allEvents}
              description={t.addNewEvent}
              icon={<Calendar className="h-12 w-12" />}
            />
          ) : (
            <GridContainer columns={3}>
              {data.map((event) => {
                const initials = event.title
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase();
                const statusBadge = getStatusBadge(event.status);

                return (
                  <GridCard
                    key={event.id}
                    title={event.title}
                    subtitle={new Date(event.eventDate).toLocaleDateString()}
                    avatarFallback={initials}
                    status={statusBadge}
                    metadata={[
                      { label: t.type, value: event.eventType.replace("_", " ") },
                      {
                        label: t.location,
                        value: (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </span>
                        ),
                      },
                      {
                        label: t.attendees,
                        value: (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {event.currentAttendees}{event.maxAttendees ? `/${event.maxAttendees}` : ""}
                          </span>
                        ),
                      },
                    ]}
                    actions={[
                      { label: t.viewEvent, onClick: () => handleView(event.id) },
                      { label: t.editEvent, onClick: () => handleEdit(event.id) },
                      {
                        label: t.deleteEvent,
                        onClick: () => handleDelete(event),
                        variant: "destructive",
                      },
                    ]}
                    actionsLabel={t.actions}
                    onClick={() => handleView(event.id)}
                  >
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>{event.startTime} - {event.endTime}</span>
                      {event.isPublic && (
                        <Badge variant="outline" className="text-xs">Public</Badge>
                      )}
                    </div>
                  </GridCard>
                );
              })}
            </GridContainer>
          )}

          {/* Load more for grid view */}
          {hasMore && (
            <div className="flex justify-center mt-4">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="px-4 py-2 text-sm border rounded-md hover:bg-accent disabled:opacity-50"
              >
                {isLoading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </>
      )}

      <Modal content={<EventCreateForm onSuccess={refresh} />} />
    </>
  );
}
