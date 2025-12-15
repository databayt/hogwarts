import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from "nuqs/server"

// import * as z from "zod";

export const tenantsSearchParams = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  search: parseAsString.withDefault(""),
  // Column-driven filters (from DataTable toolbar)
  name: parseAsString.withDefault(""),
  domain: parseAsString.withDefault(""),
  planType: parseAsString.withDefault(""),
  isActive: parseAsString.withDefault(""), // "true" | "false" | ""
  // Back-compat keys
  plan: parseAsString.withDefault(""),
  status: parseAsString.withDefault(""), // "true" | "false" | ""
  // Sorting state (JSON string array of { id, desc })
  sort: parseAsString.withDefault(""),
})

export type GetTenantsSearch = Awaited<
  ReturnType<typeof tenantsSearchParams.parse>
>
