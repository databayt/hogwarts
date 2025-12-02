"use client";

import { useMemo, useState, useCallback, useDeferredValue } from "react";
import { DataTable } from "@/components/table/data-table";
import { useDataTable } from "@/components/table/use-data-table";
import type { CampaignRow } from "./campaigns-columns";
import { getCampaignColumns } from "./campaigns-columns";
import { useModal } from "@/components/atom/modal/context";
import Modal from "@/components/atom/modal/modal";
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
import { Briefcase, Calendar, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { getCampaigns } from "./actions";

interface CampaignsTableProps {
  initialData: CampaignRow[];
  total: number;
  dictionary: Dictionary["school"]["admission"];
  lang: Locale;
  perPage?: number;
}

export function CampaignsTable({
  initialData,
  total,
  dictionary,
  lang,
  perPage = 20,
}: CampaignsTableProps) {
  const t = dictionary;
  const router = useRouter();
  const { openModal } = useModal();

  const { view, toggleView } = usePlatformView({ defaultView: "table" });
  const [searchInput, setSearchInput] = useState("");
  const deferredSearch = useDeferredValue(searchInput);

  const filters = useMemo(() => {
    const f: Record<string, unknown> = {};
    if (deferredSearch) f.name = deferredSearch;
    return f;
  }, [deferredSearch]);

  const {
    data,
    total: dataTotal,
    isLoading,
    hasMore,
    loadMore,
    refresh,
  } = usePlatformData<CampaignRow, Record<string, unknown>>({
    initialData,
    total,
    perPage,
    fetcher: async (params) => {
      const result = await getCampaigns({
        ...params,
        name: deferredSearch || undefined,
      });
      if (result.success) {
        return { rows: result.data.rows as CampaignRow[], total: result.data.total };
      }
      return { rows: [], total: 0 };
    },
    filters,
  });

  const columns = useMemo(() => getCampaignColumns(t, lang), [t, lang]);

  const { table } = useDataTable<CampaignRow>({
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
      router.push(`/admission/campaigns/${id}`);
    },
    [router]
  );

  const getStatusBadge = (status: string) => {
    const label = t?.status?.[status as keyof typeof t.status] || status;
    const variant =
      status === "OPEN"
        ? "default"
        : status === "DRAFT"
        ? "outline"
        : "secondary";
    return { label, variant: variant as "default" | "outline" | "secondary" };
  };

  const toolbarTranslations = {
    search: t?.campaigns?.campaignName || "Campaign name",
    create: t?.campaigns?.createCampaign || "Create Campaign",
    reset: "Reset",
    tableView: "Table",
    gridView: "Grid",
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
        searchValue={searchInput}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t?.campaigns?.campaignName || "Search campaigns..."}
        onCreate={() => openModal()}
        entityName="campaigns"
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
              title={t?.campaigns?.title || "Campaigns"}
              description={t?.campaigns?.createCampaign || "Create a campaign to get started"}
              icon={<Briefcase className="h-12 w-12" />}
            />
          ) : (
            <GridContainer columns={3}>
              {data.map((campaign) => {
                const statusBadge = getStatusBadge(campaign.status);
                return (
                  <GridCard
                    key={campaign.id}
                    title={campaign.name}
                    subtitle={campaign.academicYear}
                    avatarFallback={campaign.name.substring(0, 2).toUpperCase()}
                    status={statusBadge}
                    metadata={[
                      {
                        label: t?.nav?.applications || "Applications",
                        value: String(campaign.applicationsCount),
                      },
                      {
                        label: t?.campaigns?.totalSeats || "Seats",
                        value: String(campaign.totalSeats),
                      },
                    ]}
                    actions={[
                      {
                        label: t?.campaigns?.overview || "View",
                        onClick: () => handleView(campaign.id),
                      },
                    ]}
                    actionsLabel={t?.columns?.actions || "Actions"}
                    onClick={() => handleView(campaign.id)}
                  >
                    <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(campaign.startDate).toLocaleDateString()} -{" "}
                      {new Date(campaign.endDate).toLocaleDateString()}
                    </div>
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
                {isLoading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </>
      )}

      <Modal
        content={
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">
              {t?.campaigns?.createCampaign || "Create Campaign"}
            </h2>
            <p className="text-muted-foreground">
              Campaign creation form will be implemented here.
            </p>
          </div>
        }
      />
    </>
  );
}
