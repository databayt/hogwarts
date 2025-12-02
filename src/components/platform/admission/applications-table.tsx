"use client";

import { useMemo, useState, useCallback, useDeferredValue } from "react";
import { DataTable } from "@/components/table/data-table";
import { useDataTable } from "@/components/table/use-data-table";
import type { ApplicationRow } from "./applications-columns";
import { getApplicationColumns } from "./applications-columns";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import { usePlatformView } from "@/hooks/use-platform-view";
import { usePlatformData } from "@/hooks/use-platform-data";
import {
  PlatformToolbar,
  GridCard,
  GridContainer,
  GridEmptyState,
} from "@/components/platform/shared";
import { Badge } from "@/components/ui/badge";
import { FileText, Mail, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { getApplications } from "./actions";

interface ApplicationsTableProps {
  initialData: ApplicationRow[];
  total: number;
  dictionary: Dictionary["school"]["admission"];
  lang: Locale;
  perPage?: number;
  campaignId?: string;
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case "SELECTED":
    case "ADMITTED":
      return "default";
    case "SHORTLISTED":
      return "secondary";
    case "REJECTED":
    case "WITHDRAWN":
      return "destructive";
    default:
      return "outline";
  }
};

export function ApplicationsTable({
  initialData,
  total,
  dictionary,
  lang,
  perPage = 20,
  campaignId,
}: ApplicationsTableProps) {
  const t = dictionary;
  const router = useRouter();

  const { view, toggleView } = usePlatformView({ defaultView: "table" });
  const [searchInput, setSearchInput] = useState("");
  const deferredSearch = useDeferredValue(searchInput);

  const filters = useMemo(() => {
    const f: Record<string, unknown> = {};
    if (deferredSearch) f.search = deferredSearch;
    if (campaignId) f.campaignId = campaignId;
    return f;
  }, [deferredSearch, campaignId]);

  const {
    data,
    total: dataTotal,
    isLoading,
    hasMore,
    loadMore,
    refresh,
  } = usePlatformData<ApplicationRow, Record<string, unknown>>({
    initialData,
    total,
    perPage,
    fetcher: async (params) => {
      const result = await getApplications({
        ...params,
        search: deferredSearch || undefined,
        campaignId: campaignId || undefined,
      });
      if (result.success) {
        return { rows: result.data.rows as ApplicationRow[], total: result.data.total };
      }
      return { rows: [], total: 0 };
    },
    filters,
  });

  const columns = useMemo(() => getApplicationColumns(t, lang), [t, lang]);

  const { table } = useDataTable<ApplicationRow>({
    data,
    columns,
    pageCount: 1,
    enableClientFiltering: true,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: data.length || perPage,
      },
    },
  });

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  const handleView = useCallback(
    (id: string) => {
      router.push(`/admission/applications/${id}`);
    },
    [router]
  );

  const getStatusBadge = (status: string) => {
    const label = t?.status?.[status as keyof typeof t.status] || status;
    return { label, variant: getStatusVariant(status) as any };
  };

  const toolbarTranslations = {
    search: t?.applications?.searchPlaceholder || "Search applications...",
    create: "",
    reset: "Reset",
    tableView: "Table",
    gridView: "Grid",
    export: t?.applications?.export || "Export",
    exportCSV: "Export CSV",
    exporting: "Exporting...",
  };

  return (
    <>
      <PlatformToolbar
        table={view === "table" ? table : undefined}
        view={view}
        onToggleView={toggleView}
        searchValue={searchInput}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t?.applications?.searchPlaceholder || "Search applications..."}
        entityName="applications"
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
        <>
          {data.length === 0 ? (
            <GridEmptyState
              title={t?.applications?.noApplications || "No applications"}
              description={t?.applications?.noApplicationsDescription || "Applications will appear here"}
              icon={<FileText className="h-12 w-12" />}
            />
          ) : (
            <GridContainer columns={3}>
              {data.map((application) => {
                const statusBadge = getStatusBadge(application.status);
                return (
                  <GridCard
                    key={application.id}
                    title={application.applicantName}
                    subtitle={application.applicationNumber}
                    avatarFallback={application.applicantName.substring(0, 2).toUpperCase()}
                    status={statusBadge}
                    metadata={[
                      {
                        label: t?.columns?.class || "Class",
                        value: application.applyingForClass,
                      },
                      {
                        label: t?.columns?.campaign || "Campaign",
                        value: application.campaignName,
                      },
                    ]}
                    actions={[
                      {
                        label: t?.applications?.viewDetails || "View",
                        onClick: () => handleView(application.id),
                      },
                    ]}
                    actionsLabel={t?.columns?.actions || "Actions"}
                    onClick={() => handleView(application.id)}
                  >
                    <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {application.email}
                      </span>
                    </div>
                    {application.meritRank && (
                      <Badge variant="secondary" className="mt-2">
                        {t?.columns?.meritRank || "Rank"}: #{application.meritRank}
                      </Badge>
                    )}
                  </GridCard>
                );
              })}
            </GridContainer>
          )}

          {hasMore && (
            <div className="flex justify-center mt-4">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="px-4 py-2 text-sm border rounded-md hover:bg-accent disabled:opacity-50"
              >
                {isLoading ? t?.applications?.loading || "Loading..." : t?.applications?.loadMore || "Load More"}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
