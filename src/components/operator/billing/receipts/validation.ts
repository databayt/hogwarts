import { createSearchParamsCache, parseAsInteger, parseAsString } from "nuqs/server";

export const receiptsSearchParams = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),
  tenantName: parseAsString.withDefault(""),
  invoiceNumber: parseAsString.withDefault(""),
  status: parseAsString.withDefault(""),
});

export type GetReceiptsSearch = Awaited<ReturnType<typeof receiptsSearchParams.parse>>;




















