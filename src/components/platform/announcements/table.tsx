"use client";

import { useMemo, useState, useCallback, useTransition, useDeferredValue, useEffect } from "react";
import { DataTable } from "@/components/table/data-table";
import { useDataTable } from "@/components/table/use-data-table";
import type { AnnouncementRow } from "./columns";
import { getAnnouncementColumns } from "./columns";
import { useModal } from "@/components/atom/modal/context";
import Modal from "@/components/atom/modal/modal";
import { AnnouncementCreateForm } from "@/components/platform/announcements/form";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import { getAnnouncements } from "./actions";
import { usePlatformView } from "@/hooks/use-platform-view";
import { usePlatformData } from "@/hooks/use-platform-data";
import {
  PlatformToolbar,
  GridCard,
  GridContainer,
  GridEmptyState,
} from "@/components/platform/shared";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Pin, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteAnnouncement, toggleAnnouncementPublish } from "./actions";
import { DeleteToast, ErrorToast, confirmDeleteDialog } from "@/components/atom/toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AnnouncementsTableProps {
  initialData: AnnouncementRow[];
  total: number;
  dictionary: Dictionary['school']['announcements'];
  lang: Locale;
  perPage?: number;
}

// Export CSV function
async function getAnnouncementsCSV(filters?: Record<string, unknown>): Promise<string> {
  // Get all announcements without pagination for export
  const result = await getAnnouncements({ page: 1, perPage: 1000, ...filters });
  if (!result.success || !result.data.rows) return "";

  const rows = result.data.rows;
  const headers = ["ID", "Title", "Scope", "Published", "Created At", "Created By"];
  const csvRows = rows.map((row) =>
    [
      row.id,
      `"${row.title.replace(/"/g, '""')}"`,
      row.scope,
      row.published ? "Yes" : "No",
      row.createdAt,
      row.createdBy || "",
    ].join(",")
  );

  return [headers.join(","), ...csvRows].join("\n");
}

// Filter options
const SCOPE_OPTIONS = [
  { value: "all", label: "All Scopes" },
  { value: "school", label: "School-wide" },
  { value: "class", label: "Class-specific" },
  { value: "role", label: "Role-specific" },
];

const PUBLISHED_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
];

export function AnnouncementsTable({
  initialData,
  total,
  dictionary,
  lang,
  perPage = 20
}: AnnouncementsTableProps) {
  const t = dictionary;
  const router = useRouter();
  const { openModal } = useModal();
  const [isPending, startTransition] = useTransition();

  // View mode (table/grid)
  const { view, toggleView } = usePlatformView({ defaultView: "table" });

  // Search state with debouncing
  const [searchInput, setSearchInput] = useState("");
  const deferredSearch = useDeferredValue(searchInput);

  // Filter state
  const [scopeFilter, setScopeFilter] = useState("all");
  const [publishedFilter, setPublishedFilter] = useState("all");

  // Build filters object
  const filters = useMemo(() => {
    const f: Record<string, unknown> = {};
    if (deferredSearch) f.title = deferredSearch;
    if (scopeFilter !== "all") f.scope = scopeFilter;
    if (publishedFilter !== "all") f.published = publishedFilter;
    return Object.keys(f).length > 0 ? f : undefined;
  }, [deferredSearch, scopeFilter, publishedFilter]);

  // Data management with optimistic updates
  const {
    data,
    total: dataTotal,
    isLoading,
    hasMore,
    loadMore,
    refresh,
    optimisticUpdate,
    optimisticRemove,
    setData,
  } = usePlatformData<AnnouncementRow, Record<string, unknown>>({
    initialData,
    total,
    perPage,
    fetcher: async (params) => {
      const result = await getAnnouncements({
        ...params,
        title: deferredSearch || undefined,
        scope: scopeFilter !== "all" ? scopeFilter : undefined,
        published: publishedFilter !== "all" ? publishedFilter : undefined,
      });
      if (result.success) {
        return { rows: result.data.rows as AnnouncementRow[], total: result.data.total };
      }
      return { rows: [], total: 0 };
    },
    filters,
  });

  // Generate columns with dictionary
  const columns = useMemo(() => getAnnouncementColumns(t), [t]);

  // Table instance (for table view)
  const { table } = useDataTable<AnnouncementRow>({
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

  // Handle search (debounced via useDeferredValue)
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  // Handle filter reset
  const handleResetFilters = useCallback(() => {
    setSearchInput("");
    setScopeFilter("all");
    setPublishedFilter("all");
  }, []);

  // Handle delete with optimistic update
  const handleDelete = useCallback(async (announcement: AnnouncementRow) => {
    try {
      const ok = await confirmDeleteDialog(t.confirmDelete.replace('{title}', announcement.title));
      if (!ok) return;

      // Optimistic remove
      optimisticRemove(announcement.id);

      const result = await deleteAnnouncement({ id: announcement.id });
      if (result.success) {
        DeleteToast();
      } else {
        // Revert on error
        refresh();
        ErrorToast(result.error || t.failedToDelete);
      }
    } catch (e) {
      refresh();
      ErrorToast(e instanceof Error ? e.message : t.failedToDelete);
    }
  }, [t, optimisticRemove, refresh]);

  // Handle toggle publish with optimistic update
  const handleTogglePublish = useCallback(async (announcement: AnnouncementRow) => {
    try {
      // Optimistic update
      optimisticUpdate(announcement.id, (item) => ({
        ...item,
        published: !item.published,
      }));

      const result = await toggleAnnouncementPublish({
        id: announcement.id,
        publish: !announcement.published,
      });

      if (!result.success) {
        // Revert on error
        refresh();
        ErrorToast(result.error || t.failedToTogglePublish);
      }
    } catch (e) {
      refresh();
      ErrorToast(e instanceof Error ? e.message : t.failedToTogglePublish);
    }
  }, [t, optimisticUpdate, refresh]);

  // Handle edit
  const handleEdit = useCallback((id: string) => {
    openModal(id);
  }, [openModal]);

  // Handle view
  const handleView = useCallback((id: string) => {
    router.push(`/announcements/${id}`);
  }, [router]);

  // Get scope badge variant
  const getScopeBadge = (scope: string) => {
    switch (scope) {
      case "school":
        return { label: t.schoolWide, variant: "default" as const };
      case "class":
        return { label: t.classSpecific, variant: "secondary" as const };
      case "role":
        return { label: t.roleSpecific, variant: "outline" as const };
      default:
        return { label: scope, variant: "outline" as const };
    }
  };

  // Translations for toolbar
  const toolbarTranslations = {
    search: t.announcementTitle,
    create: t.create,
    reset: t.cancel,
    tableView: t.title,
    gridView: t.title,
    export: "Export",
    exportCSV: "Export CSV",
    exporting: "Exporting...",
  };

  // Filter dropdowns for toolbar (py-1 to match Input padding)
  const filterDropdowns = (
    <>
      <Select value={scopeFilter} onValueChange={setScopeFilter}>
        <SelectTrigger className="h-9 w-32 py-1">
          <SelectValue placeholder="Scope" />
        </SelectTrigger>
        <SelectContent>
          {SCOPE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={publishedFilter} onValueChange={setPublishedFilter}>
        <SelectTrigger className="h-9 w-32 py-1">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {PUBLISHED_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );

  return (
    <>
      <PlatformToolbar
        table={view === "table" ? table : undefined}
        view={view}
        onToggleView={toggleView}
        searchValue={searchInput}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t.announcementTitle}
        onCreate={() => openModal()}
        getCSV={getAnnouncementsCSV}
        entityName="announcements"
        translations={toolbarTranslations}
        additionalActions={filterDropdowns}
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
              title={t.allAnnouncements}
              description={t.createNewAnnouncement}
              icon={<Megaphone className="h-12 w-12" />}
            />
          ) : (
            <GridContainer columns={3}>
              {data.map((announcement) => {
                const scopeBadge = getScopeBadge(announcement.scope);
                return (
                  <GridCard
                    key={announcement.id}
                    title={announcement.title}
                    subtitle={new Date(announcement.createdAt).toLocaleDateString()}
                    avatarFallback={announcement.title.substring(0, 2).toUpperCase()}
                    status={{
                      label: announcement.published ? t.published : t.draft,
                      variant: announcement.published ? "default" : "outline",
                    }}
                    badges={[
                      scopeBadge,
                      ...(announcement.pinned ? [{ label: "Pinned", variant: "secondary" as const }] : []),
                      ...(announcement.featured ? [{ label: "Featured", variant: "default" as const }] : []),
                    ]}
                    metadata={[
                      { label: t.scope, value: scopeBadge.label },
                      { label: t.created, value: new Date(announcement.createdAt).toLocaleDateString() },
                    ]}
                    actions={[
                      { label: t.view, onClick: () => handleView(announcement.id) },
                      { label: t.editAnnouncement, onClick: () => handleEdit(announcement.id) },
                      {
                        label: announcement.published ? t.unpublish : t.publish,
                        onClick: () => handleTogglePublish(announcement),
                      },
                      {
                        label: t.deleteAnnouncement,
                        onClick: () => handleDelete(announcement),
                        variant: "destructive",
                      },
                    ]}
                    actionsLabel={t.actions}
                    onClick={() => handleView(announcement.id)}
                  >
                    {(announcement.pinned || announcement.featured) && (
                      <div className="flex gap-2 mt-2">
                        {announcement.pinned && (
                          <Badge variant="secondary" className="gap-1">
                            <Pin className="h-3 w-3" />
                            Pinned
                          </Badge>
                        )}
                        {announcement.featured && (
                          <Badge variant="default" className="gap-1">
                            <Star className="h-3 w-3" />
                            Featured
                          </Badge>
                        )}
                      </div>
                    )}
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

      <Modal content={<AnnouncementCreateForm dictionary={t} lang={lang} onSuccess={refresh} />} />
    </>
  );
}
