"use client";

import { useMemo } from "react";
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
import { getAssignments } from "./actions";
import { usePlatformData } from "@/hooks/use-platform-data";
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

  const columns = useMemo(() => getAssignmentColumns(dictionary, lang), [dictionary, lang]);

  // Data management with optimistic updates
  const {
    data,
    total: dataTotal,
    isLoading,
    hasMore,
    loadMore,
    refresh,
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
