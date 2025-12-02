"use client";

import { useMemo, useState, useCallback, useTransition } from "react";
import { DataTable } from "@/components/table/data-table";
import { useDataTable } from "@/components/table/use-data-table";
import { getClassColumns, type ClassRow } from "./columns";
import { useModal } from "@/components/atom/modal/context";
import Modal from "@/components/atom/modal/modal";
import { ClassCreateForm } from "@/components/platform/classes/form";
import { getClasses, getClassesCSV, deleteClass } from "./actions";
import { usePlatformView } from "@/hooks/use-platform-view";
import { usePlatformData } from "@/hooks/use-platform-data";
import {
  PlatformToolbar,
  GridCard,
  GridContainer,
  GridEmptyState,
} from "@/components/platform/shared";
import { BookOpen, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { DeleteToast, ErrorToast, confirmDeleteDialog } from "@/components/atom/toast";

interface ClassesTableProps {
  initialData: ClassRow[];
  total: number;
  perPage?: number;
}

export function ClassesTable({ initialData, total, perPage = 20 }: ClassesTableProps) {
  const router = useRouter();
  const { openModal } = useModal();
  const [isPending, startTransition] = useTransition();

  // Translations
  const t = {
    className: "Class Name",
    subject: "Subject",
    teacher: "Teacher",
    term: "Term",
    enrolled: "Enrolled",
    actions: "Actions",
    editClass: "Edit Class",
    deleteClass: "Delete Class",
    viewClass: "View Class",
    createClass: "Create Class",
    allClasses: "All Classes",
    noClasses: "No classes found",
    addNewClass: "Add a new class to your school",
    search: "Search classes...",
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
  } = usePlatformData<ClassRow, { name?: string }>({
    initialData,
    total,
    perPage,
    fetcher: async (params) => {
      const result = await getClasses(params);
      return { rows: result.rows as ClassRow[], total: result.total };
    },
    filters: searchValue ? { name: searchValue } : undefined,
  });

  // Generate columns on the client side with hooks
  const columns = useMemo(() => getClassColumns(), []);

  // Table instance
  const { table } = useDataTable<ClassRow>({
    data,
    columns,
    pageCount: 1,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: data.length || perPage,
      },
      columnVisibility: {
        // Default visible: name, subjectName, teacherName, enrolledStudents
        termName: false,
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
  const handleDelete = useCallback(async (classItem: ClassRow) => {
    try {
      const ok = await confirmDeleteDialog(`Delete ${classItem.name}?`);
      if (!ok) return;

      // Optimistic remove
      optimisticRemove(classItem.id);

      const result = await deleteClass({ id: classItem.id });
      if (result.success) {
        DeleteToast();
      } else {
        // Revert on error
        refresh();
        ErrorToast("Failed to delete class");
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
    router.push(`/classes/${id}`);
  }, [router]);

  // Export CSV wrapper
  const handleExportCSV = useCallback(async (filters?: Record<string, unknown>) => {
    return getClassesCSV(filters);
  }, []);

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
        entityName="classes"
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
              title={t.allClasses}
              description={t.addNewClass}
              icon={<BookOpen className="h-12 w-12" />}
            />
          ) : (
            <GridContainer columns={3}>
              {data.map((classItem) => {
                const initials = classItem.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase();

                return (
                  <GridCard
                    key={classItem.id}
                    title={classItem.name}
                    subtitle={classItem.subjectName}
                    avatarFallback={initials}
                    metadata={[
                      { label: t.teacher, value: classItem.teacherName },
                      { label: t.term, value: classItem.termName },
                      {
                        label: t.enrolled,
                        value: (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {classItem.enrolledStudents}/{classItem.maxCapacity}
                          </span>
                        ),
                      },
                    ]}
                    actions={[
                      { label: t.viewClass, onClick: () => handleView(classItem.id) },
                      { label: t.editClass, onClick: () => handleEdit(classItem.id) },
                      {
                        label: t.deleteClass,
                        onClick: () => handleDelete(classItem),
                        variant: "destructive",
                      },
                    ]}
                    actionsLabel={t.actions}
                    onClick={() => handleView(classItem.id)}
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

      <Modal content={<ClassCreateForm onSuccess={refresh} />} />
    </>
  );
}
