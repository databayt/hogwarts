"use client";

import { useMemo, useState, useCallback } from "react";
import { DataTable } from "@/components/table/data-table";
import { DataTableToolbar } from "@/components/table/data-table-toolbar";
import { useDataTable } from "@/components/table/use-data-table";
import type { AnnouncementRow } from "./columns";
import { getAnnouncementColumns } from "./columns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useModal } from "@/components/atom/modal/context";
import Modal from "@/components/atom/modal/modal";
import { AnnouncementCreateForm } from "@/components/platform/announcements/form";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import { getAnnouncements } from "./actions";

interface AnnouncementsTableProps {
  initialData: AnnouncementRow[];
  total: number;
  dictionary: Dictionary['school']['announcements'];
  lang: Locale;
  perPage?: number;
}

export function AnnouncementsTable({
  initialData,
  total,
  dictionary,
  lang,
  perPage = 20
}: AnnouncementsTableProps) {
  const columns = useMemo(() => getAnnouncementColumns(dictionary), [dictionary]);

  // State for incremental loading
  const [data, setData] = useState<AnnouncementRow[]>(initialData);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const hasMore = data.length < total;

  const handleLoadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const nextPage = currentPage + 1;
      const result = await getAnnouncements({ page: nextPage, perPage });

      if (result.success && result.data.rows.length > 0) {
        setData(prev => [...prev, ...result.data.rows as any]);
        setCurrentPage(nextPage);
      }
    } catch (error) {
      console.error('Failed to load more announcements:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, perPage, isLoading, hasMore]);

  // Use pageCount of 1 since we're handling all data client-side
  const { table } = useDataTable<AnnouncementRow>({
    data,
    columns,
    pageCount: 1,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: data.length, // Show all loaded data
      }
    }
  });

  const { openModal } = useModal();
  const t = dictionary;

  return (
    <DataTable
      table={table}
      paginationMode="load-more"
      hasMore={hasMore}
      isLoading={isLoading}
      onLoadMore={handleLoadMore}
    >
      <DataTableToolbar table={table}>
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
      </DataTableToolbar>
      <Modal content={<AnnouncementCreateForm dictionary={dictionary} lang={lang} />} />
    </DataTable>
  );
}


