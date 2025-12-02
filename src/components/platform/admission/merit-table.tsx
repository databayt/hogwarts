"use client";

import { useMemo, useState, useCallback, useDeferredValue, useTransition } from "react";
import { DataTable } from "@/components/table/data-table";
import { useDataTable } from "@/components/table/use-data-table";
import type { MeritRow } from "./merit-columns";
import { getMeritColumns } from "./merit-columns";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Users, Clock, TrendingUp, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { getMeritListData, generateMeritList } from "./actions";

interface MeritTableProps {
  initialData: MeritRow[];
  total: number;
  dictionary: Dictionary["school"]["admission"];
  lang: Locale;
  perPage?: number;
  campaignId?: string;
  stats: {
    totalRanked: number;
    selected: number;
    waitlisted: number;
    avgScore: number;
  };
}

export function MeritTable({
  initialData,
  total,
  dictionary,
  lang,
  perPage = 20,
  campaignId,
  stats,
}: MeritTableProps) {
  const t = dictionary;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { view, toggleView } = usePlatformView({ defaultView: "table" });
  const [searchInput, setSearchInput] = useState("");
  const deferredSearch = useDeferredValue(searchInput);

  const filters = useMemo(() => {
    const f: Record<string, unknown> = {};
    if (campaignId) f.campaignId = campaignId;
    return f;
  }, [campaignId]);

  const {
    data,
    total: dataTotal,
    isLoading,
    hasMore,
    loadMore,
    refresh,
  } = usePlatformData<MeritRow, Record<string, unknown>>({
    initialData,
    total,
    perPage,
    fetcher: async (params) => {
      const result = await getMeritListData({
        ...params,
        campaignId: campaignId || undefined,
      });
      if (result.success) {
        return { rows: result.data.rows as MeritRow[], total: result.data.total };
      }
      return { rows: [], total: 0 };
    },
    filters,
  });

  const columns = useMemo(() => getMeritColumns(t, lang), [t, lang]);

  const { table } = useDataTable<MeritRow>({
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

  const handleGenerateMeritList = useCallback(() => {
    if (!campaignId) return;
    startTransition(async () => {
      await generateMeritList({ campaignId });
      refresh();
    });
  }, [campaignId, refresh]);

  const getStatusBadge = (status: string) => {
    const label = t?.status?.[status as keyof typeof t.status] || status;
    const variant =
      status === "SELECTED"
        ? "default"
        : status === "WAITLISTED"
        ? "secondary"
        : status === "REJECTED"
        ? "destructive"
        : "outline";
    return { label, variant: variant as any };
  };

  const toolbarTranslations = {
    search: t?.columns?.applicant || "Search applicants...",
    create: "",
    reset: "Reset",
    tableView: "Table",
    gridView: "Grid",
    export: "Export",
    exportCSV: "Export CSV",
    exporting: "Exporting...",
  };

  return (
    <>
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t?.meritList?.totalRanked || "Total Ranked"}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRanked}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t?.meritList?.selected || "Selected"}
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.selected}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t?.meritList?.waitlisted || "Waitlisted"}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.waitlisted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t?.meritList?.avgScore || "Avg Score"}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgScore.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Generate Merit List Button */}
      {campaignId && (
        <div className="flex justify-end">
          <Button onClick={handleGenerateMeritList} disabled={isPending}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isPending ? "animate-spin" : ""}`} />
            {isPending
              ? t?.meritList?.generating || "Generating..."
              : t?.meritList?.generateMeritList || "Generate Merit List"}
          </Button>
        </div>
      )}

      <PlatformToolbar
        table={view === "table" ? table : undefined}
        view={view}
        onToggleView={toggleView}
        searchValue={searchInput}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t?.columns?.applicant || "Search applicants..."}
        entityName="merit"
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
              title={t?.meritList?.noRankedApplications || "No ranked applications"}
              description={t?.meritList?.noRankedDescription || "Generate a merit list to see ranked applications"}
              icon={<Award className="h-12 w-12" />}
            />
          ) : (
            <GridContainer columns={3}>
              {data.map((merit) => {
                const statusBadge = getStatusBadge(merit.status);
                return (
                  <GridCard
                    key={merit.id}
                    title={merit.applicantName}
                    subtitle={`#${merit.meritRank} - ${merit.applicationNumber}`}
                    avatarFallback={`#${merit.meritRank}`}
                    status={statusBadge}
                    metadata={[
                      {
                        label: t?.columns?.score || "Score",
                        value: merit.meritScore
                          ? parseFloat(merit.meritScore).toFixed(2)
                          : "-",
                      },
                      {
                        label: t?.columns?.category || "Category",
                        value: merit.category || "-",
                      },
                    ]}
                    actions={[
                      {
                        label: t?.meritList?.viewApplication || "View",
                        onClick: () => handleView(merit.id),
                      },
                    ]}
                    actionsLabel={t?.columns?.actions || "Actions"}
                    onClick={() => handleView(merit.id)}
                  >
                    <div className="flex gap-2 mt-2">
                      {merit.entranceScore && (
                        <Badge variant="outline" className="text-xs">
                          Entrance: {parseFloat(merit.entranceScore).toFixed(1)}
                        </Badge>
                      )}
                      {merit.interviewScore && (
                        <Badge variant="outline" className="text-xs">
                          Interview: {parseFloat(merit.interviewScore).toFixed(1)}
                        </Badge>
                      )}
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
    </>
  );
}
