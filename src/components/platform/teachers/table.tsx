"use client";

import { useMemo, useState, useCallback, useTransition } from "react";
import { DataTable } from "@/components/table/data-table";
import { useDataTable } from "@/components/table/use-data-table";
import { getTeacherColumns, type TeacherRow } from "./columns";
import { useModal } from "@/components/atom/modal/context";
import Modal from "@/components/atom/modal/modal";
import { TeacherCreateForm } from "@/components/platform/teachers/form";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import { getTeachers, getTeachersCSV, deleteTeacher } from "./actions";
import { usePlatformView } from "@/hooks/use-platform-view";
import { usePlatformData } from "@/hooks/use-platform-data";
import {
  PlatformToolbar,
  GridCard,
  GridContainer,
  GridEmptyState,
} from "@/components/platform/shared";
import { Badge } from "@/components/ui/badge";
import { Users, User, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { DeleteToast, ErrorToast, confirmDeleteDialog } from "@/components/atom/toast";

interface TeachersTableProps {
  initialData: TeacherRow[];
  total: number;
  dictionary?: Dictionary['school']['teachers'];
  perPage?: number;
}

export function TeachersTable({ initialData, total, dictionary, perPage = 20 }: TeachersTableProps) {
  const router = useRouter();
  const { openModal } = useModal();
  const [isPending, startTransition] = useTransition();

  // Default translations - safely access dictionary or use fallbacks
  const t = {
    fullName: dictionary?.fullName || "Name",
    email: dictionary?.email || "Email",
    status: "Status",
    created: "Created",
    actions: "Actions",
    editTeacher: dictionary?.editTeacher || "Pencil Teacher",
    deleteTeacher: dictionary?.deleteTeacher || "Delete Teacher",
    viewTeacher: "View Teacher",
    createTeacher: "Create Teacher",
    allTeachers: dictionary?.allTeachers || "All Teachers",
    noTeachers: "No teachers found",
    addNewTeacher: "Add a new teacher to your school",
    active: "Active",
    inactive: "Inactive",
    search: "Search teachers...",
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
  } = usePlatformData<TeacherRow, { name?: string }>({
    initialData,
    total,
    perPage,
    fetcher: async (params) => {
      const result = await getTeachers(params);
      return { rows: result.rows as TeacherRow[], total: result.total };
    },
    filters: searchValue ? { name: searchValue } : undefined,
  });

  // Generate columns on the client side with hooks
  const columns = useMemo(() => getTeacherColumns(dictionary), [dictionary]);

  // Table instance
  const { table } = useDataTable<TeacherRow>({
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
  const handleDelete = useCallback(async (teacher: TeacherRow) => {
    try {
      const ok = await confirmDeleteDialog(`Delete ${teacher.name}?`);
      if (!ok) return;

      // Optimistic remove
      optimisticRemove(teacher.id);

      const result = await deleteTeacher({ id: teacher.id });
      if (result.success) {
        DeleteToast();
      } else {
        // Revert on error
        refresh();
        ErrorToast("Failed to delete teacher");
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
  const handleView = useCallback((teacher: TeacherRow) => {
    if (!teacher.userId) {
      ErrorToast("This teacher does not have a user account");
      return;
    }
    router.push(`/profile/${teacher.userId}`);
  }, [router]);

  // Get status badge
  const getStatusBadge = (status: string) => {
    return status === "active"
      ? { label: t.active || "Active", variant: "default" as const }
      : { label: t.inactive || "Inactive", variant: "outline" as const };
  };

  // Export CSV wrapper
  const handleExportCSV = useCallback(async (filters?: Record<string, unknown>) => {
    return getTeachersCSV(filters);
  }, []);

  // Toolbar translations
  const toolbarTranslations = {
    search: t.search || "Search teachers...",
    create: t.create || "Create",
    reset: t.reset || "Reset",
    export: t.export || "Export",
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
        searchPlaceholder={t.search || "Search teachers..."}
        onCreate={() => openModal()}
        getCSV={handleExportCSV}
        entityName="teachers"
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
              title={t.allTeachers || "All Teachers"}
              description={t.addNewTeacher || "Add a new teacher to your school"}
              icon={<Users className="h-12 w-12" />}
            />
          ) : (
            <GridContainer columns={3}>
              {data.map((teacher) => {
                const statusBadge = getStatusBadge(teacher.status);
                const initials = teacher.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase();

                return (
                  <GridCard
                    key={teacher.id}
                    title={teacher.name}
                    subtitle={teacher.emailAddress !== "-" ? teacher.emailAddress : undefined}
                    avatarFallback={initials}
                    status={statusBadge}
                    metadata={[
                      { label: t.email || "Email", value: teacher.emailAddress },
                      { label: t.created || "Created", value: new Date(teacher.createdAt).toLocaleDateString() },
                    ]}
                    actions={[
                      ...(teacher.userId
                        ? [{ label: t.viewTeacher || "View", onClick: () => handleView(teacher) }]
                        : []),
                      { label: t.editTeacher || "Pencil", onClick: () => handleEdit(teacher.id) },
                      {
                        label: t.deleteTeacher || "Delete",
                        onClick: () => handleDelete(teacher),
                        variant: "destructive" as const,
                      },
                    ]}
                    actionsLabel={t.actions || "Actions"}
                    onClick={() => teacher.userId && handleView(teacher)}
                  >
                    <div className="flex flex-col gap-1 mt-2">
                      {teacher.emailAddress !== "-" && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{teacher.emailAddress}</span>
                        </div>
                      )}
                      {!teacher.userId && (
                        <Badge variant="outline" className="gap-1 text-xs w-fit">
                          <User className="h-3 w-3" />
                          No Account
                        </Badge>
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

      <Modal content={<TeacherCreateForm onSuccess={refresh} />} />
    </>
  );
}
