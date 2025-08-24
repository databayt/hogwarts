import "server-only";
import { db } from "@/lib/db";
import { unstable_cache } from "@/components/table/lib/unstable-cache";
import type { Prisma } from "@prisma/client";
import { parseAsInteger, parseAsString, createSearchParamsCache } from "nuqs/server";

export const tenantsSearchParams = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  search: parseAsString.withDefault(""),
});

export type GetTenantsInput = {
  page: number;
  perPage: number;
  search?: string;
  // column filters
  name?: string;
  domain?: string;
  planType?: string;
  isActive?: string; // "true" | "false"
  // legacy
  plan?: string;
  status?: string; // "true" | "false"
  sort?: { id: keyof Prisma.SchoolOrderByWithRelationInput; desc?: boolean }[];
};

export async function getTenants(input: GetTenantsInput) {
  return unstable_cache(
    async () => {
      const skip = (input.page - 1) * input.perPage;
      const where: Prisma.SchoolWhereInput = {
        ...(input.search
          ? { OR: [
              { name: { contains: input.search, mode: "insensitive" } },
              { domain: { contains: input.search, mode: "insensitive" } },
            ] }
          : {}),
        // column filters
        ...(input.name ? { name: { contains: input.name, mode: "insensitive" } } : {}),
        ...(input.domain ? { domain: { contains: input.domain, mode: "insensitive" } } : {}),
        ...(input.planType ? { planType: input.planType } : {}),
        ...(input.isActive === "true" ? { isActive: true } : {}),
        ...(input.isActive === "false" ? { isActive: false } : {}),
        // legacy keys support
        ...(input.plan ? { planType: input.plan } : {}),
        ...(input.status === "true" ? { isActive: true } : {}),
        ...(input.status === "false" ? { isActive: false } : {}),
      };
      const orderBy: Prisma.SchoolOrderByWithRelationInput[] =
        input.sort && input.sort.length
          ? input.sort.map((s) => ({ [s.id]: s.desc ? "desc" : "asc" }))
          : [{ createdAt: "desc" }];

      const [data, total] = await db.$transaction([
        db.school.findMany({ where, orderBy, skip, take: input.perPage }),
        db.school.count({ where }),
      ]);
      return { data, pageCount: Math.ceil(total / input.perPage) };
    },
    [JSON.stringify(input)],
    { revalidate: 5, tags: ["tenants"] }
  )();
}


