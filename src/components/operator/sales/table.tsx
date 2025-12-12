"use client";

import { useMemo, useState, useCallback, useTransition } from "react";
import { DataTable } from "@/components/table/data-table";
import { useDataTable } from "@/components/table/use-data-table";
import { getLeadColumns, type LeadRow } from "@/components/sales/columns";
import { useModal } from "@/components/atom/modal/context";
import Modal from "@/components/atom/modal/modal";
import { OperatorLeadForm } from "./form";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import { getOperatorLeads, deleteOperatorLead } from "./actions";
import { usePlatformView } from "@/hooks/use-platform-view";
import { usePlatformData } from "@/hooks/use-platform-data";
import {
  PlatformToolbar,
  GridCard,
  GridContainer,
  GridEmptyState,
} from "@/components/platform/shared";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { DeleteToast, ErrorToast, confirmDeleteDialog } from "@/components/atom/toast";
import { toast } from "sonner";
import {
  STATUS_COLORS,
  PRIORITY_COLORS,
} from "@/components/sales/constants";

interface OperatorSalesTableProps {
  initialData: LeadRow[];
  total: number;
  perPage: number;
  dictionary?: Dictionary["sales"];
  lang: Locale;
}

export function OperatorSalesTable({
  initialData,
  total,
  perPage,
  dictionary,
  lang,
}: OperatorSalesTableProps) {
  const router = useRouter();
  const { openModal } = useModal();
  const [isPending, startTransition] = useTransition();

  // Translations
  const t = {
    search: dictionary?.search || (lang === "ar" ? "بحث في العملاء المحتملين..." : "Search leads..."),
    create: dictionary?.create || (lang === "ar" ? "إنشاء" : "Create"),
    export: dictionary?.export || (lang === "ar" ? "تصدير" : "Export"),
    reset: dictionary?.reset || (lang === "ar" ? "إعادة تعيين" : "Reset"),
    deleteSuccess: dictionary?.messages?.deleteSuccess || "Lead deleted successfully",
    deleteError: dictionary?.messages?.deleteError || "Failed to delete lead",
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
  } = usePlatformData<LeadRow, { search?: string }>({
    initialData,
    total,
    perPage,
    fetcher: async (params) => {
      const result = await getOperatorLeads(
        { search: params.search },
        params.page,
        params.perPage
      );
      if (!result.success || !result.data) {
        return { rows: [], total: 0 };
      }
      return {
        rows: result.data.leads.map((lead) => ({
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          title: lead.title,
          status: lead.status as LeadRow["status"],
          source: lead.source,
          priority: lead.priority as LeadRow["priority"],
          score: lead.score,
          verified: lead.verified,
          createdAt: lead.createdAt.toISOString(),
        })),
        total: result.data.total,
      };
    },
    filters: searchValue ? { search: searchValue } : undefined,
  });

  // Generate columns on the client side
  const columns = useMemo(() => getLeadColumns(dictionary, lang), [dictionary, lang]);

  // Table instance
  const { table } = useDataTable<LeadRow>({
    data,
    columns,
    pageCount: 1,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: data.length || perPage,
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
  const handleDelete = useCallback(async (lead: LeadRow) => {
    try {
      const deleteMsg = lang === "ar" ? `حذف ${lead.name}؟` : `Delete ${lead.name}?`;
      const ok = await confirmDeleteDialog(deleteMsg);
      if (!ok) return;

      // Optimistic remove
      optimisticRemove(lead.id);

      const result = await deleteOperatorLead(lead.id);
      if (result.success) {
        toast.success(t.deleteSuccess);
      } else {
        // Revert on error
        refresh();
        toast.error(result.error || t.deleteError);
      }
    } catch (e) {
      refresh();
      toast.error(e instanceof Error ? e.message : t.deleteError);
    }
  }, [optimisticRemove, refresh, lang, t.deleteSuccess, t.deleteError]);

  // Handle edit
  const handleEdit = useCallback((id: string) => {
    openModal(id);
  }, [openModal]);

  // Get status badge
  const getStatusBadge = (status: LeadRow["status"]) => {
    return {
      label: dictionary?.status?.[status] || status,
      variant: STATUS_COLORS[status] as "default" | "secondary" | "destructive" | "outline",
    };
  };

  // Get priority badge
  const getPriorityBadge = (priority: LeadRow["priority"]) => {
    return {
      label: dictionary?.priority?.[priority] || priority,
      variant: PRIORITY_COLORS[priority] as "default" | "secondary" | "destructive" | "outline",
    };
  };

  // Toolbar translations
  const toolbarTranslations = {
    search: t.search,
    create: t.create,
    reset: t.reset,
    export: t.export,
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
        entityName="leads"
        translations={toolbarTranslations}
      />

      {view === "table" ? (
        <DataTable
          table={table}
          paginationMode="load-more"
          hasMore={hasMore}
          isLoading={isLoading}
          onLoadMore={loadMore}
        />
      ) : (
        <GridContainer>
          {data.length === 0 && !isLoading ? (
            <GridEmptyState
              title={lang === "ar" ? "لا يوجد عملاء محتملين" : "No leads"}
              description={lang === "ar" ? "أنشئ عميلاً محتملاً جديداً" : "Create a new lead to get started"}
            />
          ) : (
            data.map((lead) => (
              <GridCard
                key={lead.id}
                title={lead.name}
                subtitle={lead.company || lead.email || undefined}
                badges={[
                  getStatusBadge(lead.status),
                  getPriorityBadge(lead.priority),
                ]}
                onClick={() => handleEdit(lead.id)}
                actions={[
                  {
                    label: lang === "ar" ? "تعديل" : "Edit",
                    onClick: () => handleEdit(lead.id),
                  },
                  {
                    label: lang === "ar" ? "حذف" : "Delete",
                    onClick: () => handleDelete(lead),
                    variant: "destructive",
                  },
                ]}
                metadata={[
                  { label: dictionary?.table?.score || "Score", value: String(lead.score) },
                  {
                    label: dictionary?.table?.created || "Created",
                    value: new Date(lead.createdAt).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US"),
                  },
                ]}
              />
            ))
          )}
          {hasMore && !isLoading && (
            <button
              onClick={loadMore}
              className="col-span-full py-2 text-center text-sm text-muted-foreground hover:text-foreground"
            >
              {dictionary?.loadMore || "Load More"}
            </button>
          )}
          {isLoading && (
            <div className="col-span-full flex justify-center py-4">
              <span className="text-muted-foreground">
                {dictionary?.loading || "Loading..."}
              </span>
            </div>
          )}
        </GridContainer>
      )}

      <Modal content={<OperatorLeadForm dictionary={dictionary} onSuccess={refresh} />} />
    </>
  );
}
