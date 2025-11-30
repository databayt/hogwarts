"use client";

import { useMemo, useState, useCallback, useTransition } from "react";
import { DataTable } from "@/components/table/data-table";
import { useDataTable } from "@/components/table/use-data-table";
import { subjectColumns, type SubjectRow } from "./columns";
import { useModal } from "@/components/atom/modal/context";
import Modal from "@/components/atom/modal/modal";
import { SubjectCreateForm } from "@/components/platform/subjects/form";
import { getSubjects, deleteSubject } from "./actions";
import { usePlatformView } from "@/hooks/use-platform-view";
import { usePlatformData } from "@/hooks/use-platform-data";
import {
  PlatformToolbar,
  GridCard,
  GridContainer,
  GridEmptyState,
} from "@/components/platform/shared";
import { BookOpen, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { DeleteToast, ErrorToast, confirmDeleteDialog } from "@/components/atom/toast";

interface SubjectsTableProps {
  initialData: SubjectRow[];
  total: number;
  perPage?: number;
}

// Export CSV function
async function getSubjectsCSV(filters?: Record<string, unknown>): Promise<string> {
  const result = await getSubjects({ page: 1, perPage: 1000, ...filters });
  const rows = result.rows;
  const headers = ["ID", "Subject Name", "Department", "Created At"];
  const csvRows = rows.map((row) =>
    [
      row.id,
      `"${row.subjectName.replace(/"/g, '""')}"`,
      `"${row.departmentName.replace(/"/g, '""')}"`,
      row.createdAt,
    ].join(",")
  );

  return [headers.join(","), ...csvRows].join("\n");
}

export function SubjectsTable({ initialData, total, perPage = 20 }: SubjectsTableProps) {
  const router = useRouter();
  const { openModal } = useModal();
  const [isPending, startTransition] = useTransition();

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
  } = usePlatformData<SubjectRow, { subjectName?: string }>({
    initialData,
    total,
    perPage,
    fetcher: async (params) => {
      const result = await getSubjects(params);
      return { rows: result.rows, total: result.total };
    },
    filters: searchValue ? { subjectName: searchValue } : undefined,
  });

  // Generate columns on the client side
  const columns = useMemo(() => subjectColumns, []);

  // Table instance
  const { table } = useDataTable<SubjectRow>({
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
  const handleDelete = useCallback(async (subject: SubjectRow) => {
    try {
      const ok = await confirmDeleteDialog(`Delete ${subject.subjectName}?`);
      if (!ok) return;

      // Optimistic remove
      optimisticRemove(subject.id);

      const result = await deleteSubject({ id: subject.id });
      if (result.success) {
        DeleteToast();
      } else {
        // Revert on error
        refresh();
        ErrorToast("Failed to delete subject");
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
    router.push(`/subjects/${id}`);
  }, [router]);

  // Toolbar translations
  const toolbarTranslations = {
    search: "Search subjects...",
    create: "Create",
    reset: "Reset",
    export: "Export",
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
        searchPlaceholder="Search subjects..."
        onCreate={() => openModal()}
        getCSV={getSubjectsCSV}
        entityName="subjects"
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
              title="All Subjects"
              description="Add a new subject to your school"
              icon={<BookOpen className="h-12 w-12" />}
            />
          ) : (
            <GridContainer columns={3}>
              {data.map((subject) => {
                const initials = subject.subjectName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase();

                return (
                  <GridCard
                    key={subject.id}
                    title={subject.subjectName}
                    subtitle={subject.departmentName}
                    avatarFallback={initials}
                    metadata={[
                      {
                        label: "Department",
                        value: (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {subject.departmentName}
                          </span>
                        ),
                      },
                      { label: "Created", value: new Date(subject.createdAt).toLocaleDateString() },
                    ]}
                    actions={[
                      { label: "View", onClick: () => handleView(subject.id) },
                      { label: "Edit", onClick: () => handleEdit(subject.id) },
                      {
                        label: "Delete",
                        onClick: () => handleDelete(subject),
                        variant: "destructive",
                      },
                    ]}
                    actionsLabel="Actions"
                    onClick={() => handleView(subject.id)}
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

      <Modal content={<SubjectCreateForm onSuccess={refresh} />} />
    </>
  );
}
