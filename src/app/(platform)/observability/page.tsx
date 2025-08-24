import { type AuditRow } from "@/components/platform/operator/observability/logs-table/columns";
import { ObservabilityContent } from "@/components/platform/operator/observability/content";
import { createSearchParamsCache, parseAsInteger, parseAsString } from "nuqs/server";
import { fetchLogs } from "@/components/platform/operator/observability/provider";

export const metadata = {
  title: "Operator: Observability",
};

const auditSearchParams = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(50),
  action: parseAsString.withDefault(""),
  ip: parseAsString.withDefault(""),
  // date range could be two timestamps
  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),
  level: parseAsString.withDefault(""),
  requestId: parseAsString.withDefault(""),
});

export default async function ObservabilityPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await auditSearchParams.parse(await searchParams);
  const page = sp.page;
  const take = sp.perPage;
  const skip = (page - 1) * take;
  // DB filtering is applied inside fetchLogs; keep local mapping typed in provider.

  const { rows: unifiedRows } = await fetchLogs({
    page,
    perPage: take,
    action: sp.action || undefined,
    ip: sp.ip || undefined,
    from: sp.from || undefined,
    to: sp.to || undefined,
    level: sp.level || undefined,
    requestId: sp.requestId || undefined,
    tenantId: undefined,
  });

  const rows: AuditRow[] = unifiedRows.map((l) => ({
    id: l.id,
    createdAt: l.createdAt.toISOString(),
    userEmail: l.userEmail ?? "-",
    schoolName: l.schoolName ?? null,
    action: l.action,
    reason: l.reason ?? null,
    ip: l.ip ?? null,
    level: l.level ?? null,
    requestId: l.requestId ?? null,
  }));

  return <ObservabilityContent rows={rows} />;
}


