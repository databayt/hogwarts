import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
} from "nuqs/server"

export const questionBankSearchParams = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),
  sort: parseAsArrayOf(parseAsString).withDefault([]),
  // Filters
  subjectId: parseAsString.withDefault(""),
  questionType: parseAsString.withDefault(""),
  difficulty: parseAsString.withDefault(""),
  bloomLevel: parseAsString.withDefault(""),
  source: parseAsString.withDefault(""),
  search: parseAsString.withDefault(""),
})
