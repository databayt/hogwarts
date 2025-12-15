import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { getOperatorLeads } from "./actions"
import { OperatorSalesTable } from "./table"

interface OperatorSalesContentProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
  dictionary?: Dictionary["sales"]
  lang: Locale
}

export async function OperatorSalesContent({
  searchParams,
  dictionary,
  lang,
}: OperatorSalesContentProps) {
  const params = await searchParams

  // Extract search from params
  const search = typeof params.search === "string" ? params.search : undefined
  const page = typeof params.page === "string" ? parseInt(params.page, 10) : 1
  const perPage = 20

  // Fetch initial data
  const result = await getOperatorLeads({ search }, page, perPage)

  const leads = result.success && result.data ? result.data.leads : []
  const total = result.success && result.data ? result.data.total : 0

  // Map leads to table format
  const initialData = leads.map((lead) => ({
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    company: lead.company,
    title: lead.title,
    status: lead.status as
      | "NEW"
      | "CONTACTED"
      | "QUALIFIED"
      | "PROPOSAL"
      | "NEGOTIATION"
      | "CLOSED_WON"
      | "CLOSED_LOST"
      | "ARCHIVED",
    source: lead.source,
    priority: lead.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    score: lead.score,
    verified: lead.verified,
    createdAt: lead.createdAt.toISOString(),
  }))

  return (
    <OperatorSalesTable
      initialData={initialData}
      total={total}
      perPage={perPage}
      dictionary={dictionary}
      lang={lang}
    />
  )
}
