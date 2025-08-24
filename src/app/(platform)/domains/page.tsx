import { DomainsContent } from "@/components/operator/domains/content";
import { db } from "@/lib/db";
import { domainsSearchParams } from "@/components/operator/domains/validation";
import { SearchParams } from "nuqs/server";
import { CreateDomainRequest } from "@/components/operator/domains/create-request";
import type { Prisma } from "@prisma/client";
// Server actions are wired; enable after Prisma migration
// import { approveDomainRequest } from "@/app/(platform)/operator/actions/domains/approve";
// import { rejectDomainRequest } from "@/app/(platform)/operator/actions/domains/reject";
// import { verifyDomainRequest } from "@/app/(platform)/operator/actions/domains/verify";

export const metadata = {
  title: "Operator: Domains",
};

export default async function DomainsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await domainsSearchParams.parse(await searchParams);
  const where: Prisma.DomainRequestWhereInput = {
    ...(sp.search
      ? {
          OR: [
            { domain: { contains: sp.search, mode: "insensitive" } },
            { school: { name: { contains: sp.search, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(sp.domain ? { domain: { contains: sp.domain, mode: "insensitive" } } : {}),
    ...(sp.schoolName ? { school: { name: { contains: sp.schoolName, mode: "insensitive" } } } : {}),
    ...(sp.status ? { status: sp.status } : {}),
  };
  const page = sp.page;
  const take = sp.perPage;
  const skip = (page - 1) * take;
  const [requests, total, tenants] = await db.$transaction([
    db.domainRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: { school: { select: { name: true } } },
    }),
    db.domainRequest.count({ where }),
    db.school.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const rows = requests.map((r) => ({
    id: r.id,
    schoolName: r.school?.name ?? "-",
    domain: r.domain,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <>
      <div className="mb-4">
        <CreateDomainRequest tenants={tenants} />
      </div>
      <DomainsContent rows={rows} pageCount={Math.ceil(total / take)} />
    </>
  );
}


