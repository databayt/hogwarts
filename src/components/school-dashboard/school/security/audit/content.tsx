import type { Locale } from "@/components/internationalization/config"

import { getAuditLogs } from "./actions"
import { AuditTable } from "./table"

interface Props {
  lang: Locale
}

export default async function AuditContent({ lang }: Props) {
  const { logs, total } = await getAuditLogs()

  return <AuditTable logs={logs} total={total} lang={lang} />
}
