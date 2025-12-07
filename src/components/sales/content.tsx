import { LeadsTable } from "@/components/sales/table";
import { type LeadRow } from "@/components/sales/columns";
import { SearchParams } from "nuqs/server";
import { salesSearchParams } from "@/components/sales/list-params";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import type { Lead, LeadStatus, LeadSource, LeadPriority, LeadType } from "@prisma/client";

interface Props {
  searchParams: Promise<SearchParams>;
  dictionary?: Dictionary["sales"];
  lang: Locale;
}

export default async function SalesContent({
  searchParams,
  dictionary,
  lang,
}: Props) {
  const sp = await salesSearchParams.parse(await searchParams);
  const { schoolId } = await getTenantContext();

  let data: LeadRow[] = [];
  let total = 0;

  if (schoolId) {
    // Build where clause
    const where: Record<string, unknown> = { schoolId };

    if (sp.search) {
      where.OR = [
        { name: { contains: sp.search, mode: "insensitive" } },
        { email: { contains: sp.search, mode: "insensitive" } },
        { company: { contains: sp.search, mode: "insensitive" } },
      ];
    }

    if (sp.status) where.status = sp.status;
    if (sp.source) where.source = sp.source;
    if (sp.priority) where.priority = sp.priority;
    if (sp.leadType) where.leadType = sp.leadType;

    const skip = (sp.page - 1) * sp.perPage;
    const take = sp.perPage;

    // Build order by
    const orderBy =
      sp.sort && Array.isArray(sp.sort) && sp.sort.length
        ? sp.sort.map((s: string) => {
            const [field, direction] = s.split(":");
            return { [field]: direction === "desc" ? "desc" : "asc" };
          })
        : [{ createdAt: "desc" }];

    const [rows, count] = await Promise.all([
      db.lead.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
      db.lead.count({ where }),
    ]);

    // Map to LeadRow type
    data = rows.map((lead: Lead) => ({
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
    }));

    total = count;
  }

  return (
    <LeadsTable
      initialData={data}
      total={total}
      dictionary={dictionary}
      lang={lang}
      perPage={sp.perPage}
    />
  );
}
