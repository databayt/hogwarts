import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsArrayOf,
  parseAsBoolean,
} from "nuqs/server";

export const templateSearchParams = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),
  sort: parseAsArrayOf(parseAsString).withDefault([]),
  // Filters
  subjectId: parseAsString.withDefault(""),
  isActive: parseAsBoolean,
  search: parseAsString.withDefault(""),
});
