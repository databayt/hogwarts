"use client";

import { useMemo, useCallback } from "react";
import { DataTable } from "@/components/table/data-table";
import { DataTableToolbar } from "@/components/table/data-table-toolbar";
import { useDataTable } from "@/components/table/use-data-table";
import { getAssignmentColumns, type AssignmentRow } from "./columns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useModal } from "@/components/atom/modal/context";
import Modal from "@/components/atom/modal/modal";
import { AssignmentCreateForm } from "@/components/platform/assignments/form";
import { ExportButton } from "./export-button";
import { getAssignments, deleteAssignment } from "./actions";
import { usePlatformData } from "@/hooks/use-platform-data";
import { DeleteToast, ErrorToast, confirmDeleteDialog } from "@/components/atom/toast";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";

interface AssignmentsTableProps {
  initialData: AssignmentRow[];
  total: number;
  dictionary?: Dictionary['school']['assignments'];
  lang: Locale;
  perPage?: number;
}

export function AssignmentsTable({ initialData, total, dictionary, lang, perPage = 20 }: AssignmentsTableProps) {
  // Translations with fallbacks
  const t = {
    create: dictionary?.create || (lang === 'ar' ? 'إنشاء' : 'Create'),
    loading: lang === 'ar' ? 'جاري التحميل...' : 'Loading...',
  };

  // Data management with optimistic updates
  const {
    data,
    total: dataTotal,
    isLoading,
    hasMore,
    loadMore,
    refresh,
    optimisticRemove,
  } = usePlatformData<AssignmentRow, { title?: string }>({
    initialData,
    total,
    perPage,
    fetcher: async (params) => {
      const result = await getAssignments(params);
      if (!result.success || !result.data) {
        return { rows: [], total: 0 };
      }
      return { rows: result.data.rows as AssignmentRow[], total: result.data.total };
    },
  });

  // Handle delete with optimistic update (must be before columns useMemo)
  const handleDelete = useCallback(async (assignment: AssignmentRow) => {
    try {
      const deleteMsg = lang === 'ar' ? `حذف "${assignment.title}"؟` : `Delete "${assignment.title}"?`;
      const ok = await confirmDeleteDialog(deleteMsg);
      if (!ok) return;

      // Optimistic remove
      optimisticRemove(assignment.id);

      const result = await deleteAssignment({ id: assignment.id });
      if (result.success) {
        DeleteToast();
      } else {
        // Revert on error
        refresh();
        ErrorToast(lang === 'ar' ? 'فشل حذف الواجب' : 'Failed to delete assignment');
      }
    } catch (e) {
      refresh();
      ErrorToast(e instanceof Error ? e.message : (lang === 'ar' ? 'فشل الحذف' : 'Failed to delete'));
    }
  }, [optimisticRemove, refresh, lang]);

  // Generate columns on the client side with dictionary, lang, and callbacks
  const columns = useMemo(() => getAssignmentColumns(dictionary, lang, {
    onDelete: handleDelete,
  }), [dictionary, lang, handleDelete]);

  // Use pageCount of 1 since we're handling all data client-side
  const { table } = useDataTable<AssignmentRow>({
    data,
    columns,
    pageCount: 1,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: data.length || perPage,
      },
      columnVisibility: {
        // Default visible: title, className, dueDate, status
        type: false,
        totalPoints: false,
        createdAt: false,
      },
    },
  });

  const { openModal } = useModal();

  return (
    <DataTable
      table={table}
      paginationMode="load-more"
      hasMore={hasMore}
      isLoading={isLoading}
      onLoadMore={loadMore}
    >
      <DataTableToolbar table={table}>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 rounded-full"
            onClick={() => openModal()}
            aria-label={t.create}
            title={t.create}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <ExportButton />
        </div>
      </DataTableToolbar>
      <Modal content={<AssignmentCreateForm onSuccess={refresh} />} />
    </DataTable>
  );
}
