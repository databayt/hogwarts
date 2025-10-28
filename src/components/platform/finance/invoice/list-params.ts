import { createSearchParamsCache, parseAsInteger, parseAsString } from 'nuqs/server'
import { getSortingStateParser } from '@/components/table/lib/parsers'

export const invoiceSearchParams = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),
  // column filters (ids must match column ids)
  invoice_no: parseAsString.withDefault(''),
  status: parseAsString.withDefault(''),
  client_name: parseAsString.withDefault(''),
  sort: getSortingStateParser().withDefault([]),
})

export type InvoiceSearch = Awaited<ReturnType<typeof invoiceSearchParams.parse>>
