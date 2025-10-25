/**
 * Table Server Actions
 * Reusable server action patterns for table data fetching
 *
 * Note: These are helper functions, not actual server actions.
 * Features should create their own actions in their feature folders
 * that call these helpers.
 */

"use server";

import type { Prisma } from "@prisma/client";
import type {
  ServerPaginationResult,
} from "@/components/table/types";
import {
  paginationSchema,
  seeMorePaginationSchema,
  sortingSchema,
  filterSchema,
  type SortingInput,
  type FiltersInput,
} from "@/components/table/validation";

// ============================================================================
// Pagination Helpers
// ============================================================================

/**
 * Calculate skip and take for page-based pagination
 */
export function getPagePaginationParams(page: number, perPage: number) {
  const validated = paginationSchema.parse({ page, perPage });
  return {
    skip: (validated.page - 1) * validated.perPage,
    take: validated.perPage,
  };
}

/**
 * Calculate skip and take for "see more" pagination
 */
export function getSeeMorePaginationParams(loadedCount: number, batchSize: number) {
  const validated = seeMorePaginationSchema.parse({ loadedCount, batchSize });
  return {
    skip: validated.loadedCount,
    take: validated.batchSize,
  };
}

// ============================================================================
// Sorting Helpers
// ============================================================================

/**
 * Convert sorting input to Prisma orderBy
 * @example
 * // Input: [{ id: "name", desc: false }]
 * // Output: { name: "asc" }
 */
export function buildPrismaOrderBy<T extends Record<string, unknown>>(
  sorting?: SortingInput
): Prisma.Args<T, "findMany">["orderBy"] {
  if (!sorting || sorting.length === 0) {
    return undefined;
  }

  const validated = sortingSchema.parse(sorting);

  if (validated.length === 1) {
    const { id, desc } = validated[0];
    return { [id]: desc ? "desc" : "asc" } as Prisma.Args<T, "findMany">["orderBy"];
  }

  return validated.map(({ id, desc }) => ({
    [id]: desc ? "desc" : "asc",
  })) as Prisma.Args<T, "findMany">["orderBy"];
}

// ============================================================================
// Filtering Helpers
// ============================================================================

/**
 * Convert filter input to Prisma where clause
 * Features should extend this with their own custom logic
 */
export function buildPrismaWhere<T extends Record<string, unknown>>(
  filters?: FiltersInput,
  baseWhere?: Prisma.Args<T, "findMany">["where"]
): Prisma.Args<T, "findMany">["where"] {
  if (!filters || filters.length === 0) {
    return baseWhere;
  }

  const validated = filterSchema.parse(filters);

  const filterClauses = validated.reduce((acc, filter) => {
    const { id, value, operator } = filter;

    switch (operator) {
      case "eq":
        acc[id] = { equals: value };
        break;
      case "ne":
        acc[id] = { not: value };
        break;
      case "iLike":
        acc[id] = { contains: value as string, mode: "insensitive" };
        break;
      case "notILike":
        acc[id] = { not: { contains: value as string, mode: "insensitive" } };
        break;
      case "inArray":
        acc[id] = { in: Array.isArray(value) ? value : [value] };
        break;
      case "notInArray":
        acc[id] = { notIn: Array.isArray(value) ? value : [value] };
        break;
      case "lt":
        acc[id] = { lt: value };
        break;
      case "lte":
        acc[id] = { lte: value };
        break;
      case "gt":
        acc[id] = { gt: value };
        break;
      case "gte":
        acc[id] = { gte: value };
        break;
      case "isEmpty":
        acc[id] = { equals: null };
        break;
      case "isNotEmpty":
        acc[id] = { not: null };
        break;
      // Add more operators as needed
      default:
        break;
    }

    return acc;
  }, {} as Record<string, unknown>);

  return {
    ...baseWhere,
    AND: [filterClauses],
  } as Prisma.Args<T, "findMany">["where"];
}

// ============================================================================
// Pagination Result Builder
// ============================================================================

/**
 * Build standardized pagination result for client
 */
export function buildPaginationResult<TData>(
  data: TData[],
  total: number,
  params: { skip: number; take: number }
): ServerPaginationResult<TData> {
  const hasMore = params.skip + data.length < total;

  return {
    data,
    hasMore,
    total,
  };
}

// ============================================================================
// Complete Query Builder (Example Pattern)
// ============================================================================

/**
 * Example: Complete query builder for features to use as reference
 * Features should create their own version in their actions.ts file
 */
export async function exampleFetchTableData<TData, TModel>(
  params: {
    // Pagination
    page?: number;
    perPage?: number;
    loadedCount?: number;
    batchSize?: number;
    paginationType?: "pages" | "seeMore";
    // Sorting
    sorting?: SortingInput;
    // Filtering
    filters?: FiltersInput;
    // Tenant scoping (CRITICAL for multi-tenant)
    schoolId: string;
    // Prisma client methods
    findMany: (args: {
      where?: unknown;
      orderBy?: unknown;
      skip?: number;
      take?: number;
    }) => Promise<TData[]>;
    count: (args: { where?: unknown }) => Promise<number>;
  }
): Promise<ServerPaginationResult<TData>> {
  const {
    page = 1,
    perPage = 20,
    loadedCount = 0,
    batchSize = 20,
    paginationType = "pages",
    sorting,
    filters,
    schoolId,
    findMany,
    count,
  } = params;

  // 1. Build pagination params
  const paginationParams =
    paginationType === "seeMore"
      ? getSeeMorePaginationParams(loadedCount, batchSize)
      : getPagePaginationParams(page, perPage);

  // 2. Build base where clause (ALWAYS include schoolId)
  const baseWhere = { schoolId };

  // 3. Build complete where clause with filters
  const where = buildPrismaWhere(filters, baseWhere);

  // 4. Build orderBy clause
  const orderBy = buildPrismaOrderBy(sorting);

  // 5. Fetch data and count
  const [data, total] = await Promise.all([
    findMany({
      where,
      orderBy,
      skip: paginationParams.skip,
      take: paginationParams.take,
    }),
    count({ where }),
  ]);

  // 6. Return standardized result
  return buildPaginationResult(data, total, paginationParams);
}

/**
 * Usage example in a feature's actions.ts:
 *
 * "use server";
 *
 * import { auth } from "@/auth";
 * import { db } from "@/lib/db";
 * import { exampleFetchTableData } from "@/components/table/actions";
 *
 * export async function fetchStudents(searchParams: {
 *   page?: number;
 *   perPage?: number;
 *   sort?: string;
 * }) {
 *   const session = await auth();
 *   const schoolId = session?.user?.schoolId;
 *
 *   if (!schoolId) throw new Error("No school context");
 *
 *   return exampleFetchTableData({
 *     ...searchParams,
 *     schoolId,
 *     findMany: (args) => db.student.findMany(args),
 *     count: (args) => db.student.count(args),
 *   });
 * }
 */
