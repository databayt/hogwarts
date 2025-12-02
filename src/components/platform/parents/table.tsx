"use client";

import { useMemo, useState, useCallback, useTransition } from "react";
import { DataTable } from "@/components/table/data-table";
import { useDataTable } from "@/components/table/use-data-table";
import { getParentColumns, type ParentRow } from "./columns";
import { useModal } from "@/components/atom/modal/context";
import Modal from "@/components/atom/modal/modal";
import { ParentCreateForm } from "@/components/platform/parents/form";
import { getParents, getParentsCSV, deleteParent } from "./actions";
import { usePlatformView } from "@/hooks/use-platform-view";
import { usePlatformData } from "@/hooks/use-platform-data";
import {
  PlatformToolbar,
  GridCard,
  GridContainer,
  GridEmptyState,
} from "@/components/platform/shared";
import { Users, Mail, CircleCheck, CircleX } from "lucide-react";
import { useRouter } from "next/navigation";
import { DeleteToast, ErrorToast, confirmDeleteDialog } from "@/components/atom/toast";
import { Badge } from "@/components/ui/badge";

interface ParentsTableProps {
  initialData: ParentRow[];
  total: number;
  perPage?: number;
}

export function ParentsTable({ initialData, total, perPage = 20 }: ParentsTableProps) {
  const router = useRouter();
  const { openModal } = useModal();
  const [isPending, startTransition] = useTransition();

  // Translations
  const t = {
    name: "Name",
    email: "Email",
    status: "Status",
    actions: "Actions",
    editParent: "Edit Parent",
    deleteParent: "Delete Parent",
    viewParent: "View Profile",
    createParent: "Create Parent",
    allParents: "All Parents",
    noParents: "No parents found",
    addNewParent: "Add a new parent to your school",
    search: "Search parents...",
    create: "Create",
    export: "Export",
    reset: "Reset",
    active: "Active",
    inactive: "Inactive",
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
  } = usePlatformData<ParentRow, { name?: string }>({
    initialData,
    total,
    perPage,
    fetcher: async (params) => {
      const result = await getParents(params);
      return { rows: result.rows as ParentRow[], total: result.total };
    },
    filters: searchValue ? { name: searchValue } : undefined,
  });

  // Generate columns on the client side
  const columns = useMemo(() => getParentColumns(), []);

  // Table instance
  const { table } = useDataTable<ParentRow>({
    data,
    columns,
    pageCount: 1,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: data.length || perPage,
      }
    }
  });

  // Handle search
  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  // Handle delete with optimistic update
  const handleDelete = useCallback(async (parent: ParentRow) => {
    try {
      const ok = await confirmDeleteDialog(`Delete ${parent.name}?`);
      if (!ok) return;

      // Optimistic remove
      optimisticRemove(parent.id);

      const result = await deleteParent({ id: parent.id });
      if (result.success) {
        DeleteToast();
      } else {
        // Revert on error
        refresh();
        ErrorToast("Failed to delete parent");
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
  const handleView = useCallback((parent: ParentRow) => {
    if (!parent.userId) {
      ErrorToast("This parent does not have a user account");
      return;
    }
    router.push(`/profile/${parent.userId}`);
  }, [router]);

  // Export CSV wrapper
  const handleExportCSV = useCallback(async (filters?: Record<string, unknown>) => {
    return getParentsCSV(filters);
  }, []);

  // Get status badge
  const getStatusBadge = (status: string) => {
    return {
      label: status === "active" ? t.active : t.inactive,
      variant: status === "active" ? "default" as const : "secondary" as const,
    };
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
        entityName="parents"
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
              title={t.allParents}
              description={t.addNewParent}
              icon={<Users className="h-12 w-12" />}
            />
          ) : (
            <GridContainer columns={3}>
              {data.map((parent) => {
                const initials = parent.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase();
                const statusBadge = getStatusBadge(parent.status);

                return (
                  <GridCard
                    key={parent.id}
                    title={parent.name}
                    subtitle={parent.emailAddress}
                    avatarFallback={initials}
                    status={statusBadge}
                    metadata={[
                      {
                        label: t.email,
                        value: (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {parent.emailAddress}
                          </span>
                        ),
                      },
                      {
                        label: t.status,
                        value: (
                          <span className="flex items-center gap-1">
                            {parent.status === "active" ? (
                              <CircleCheck className="h-3 w-3 text-green-500" />
                            ) : (
                              <CircleX className="h-3 w-3 text-muted-foreground" />
                            )}
                            {parent.status === "active" ? t.active : t.inactive}
                          </span>
                        ),
                      },
                    ]}
                    actions={[
                      { label: t.viewParent, onClick: () => handleView(parent) },
                      { label: t.editParent, onClick: () => handleEdit(parent.id) },
                      {
                        label: t.deleteParent,
                        onClick: () => handleDelete(parent),
                        variant: "destructive",
                      },
                    ]}
                    actionsLabel={t.actions}
                    onClick={() => handleView(parent)}
                  />
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

      <Modal content={<ParentCreateForm onSuccess={refresh} />} />
    </>
  );
}
