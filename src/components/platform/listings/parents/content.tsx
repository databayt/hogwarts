import { SearchParams } from "nuqs/server"

import { getModel } from "@/lib/prisma-guards"
import { getTenantContext } from "@/lib/tenant-context"
import { getDisplayName } from "@/lib/transliterate-name"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"
import { type ParentRow } from "@/components/platform/listings/parents/columns"
import { parentsSearchParams } from "@/components/platform/listings/parents/list-params"
import { ParentsTable } from "@/components/platform/listings/parents/table"

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary
  lang: Locale
}

export default async function ParentsContent({
  searchParams,
  dictionary,
  lang,
}: Props) {
  const sp = await parentsSearchParams.parse(await searchParams)
  const { schoolId } = await getTenantContext()
  let data: ParentRow[] = []
  let total = 0
  const guardianModel = getModel("guardian")
  if (schoolId && guardianModel) {
    const where: any = {
      schoolId,
      ...(sp.name
        ? {
            OR: [
              { givenName: { contains: sp.name, mode: "insensitive" } },
              { surname: { contains: sp.name, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(sp.emailAddress
        ? { emailAddress: { contains: sp.emailAddress, mode: "insensitive" } }
        : {}),
      ...(sp.status
        ? sp.status === "active"
          ? { NOT: { userId: null } }
          : sp.status === "inactive"
            ? { userId: null }
            : {}
        : {}),
    }
    const skip = (sp.page - 1) * sp.perPage
    const take = sp.perPage
    const orderBy =
      sp.sort && Array.isArray(sp.sort) && sp.sort.length
        ? sp.sort.map((s: any) => ({ [s.id]: s.desc ? "desc" : "asc" }))
        : [{ createdAt: "desc" }]
    const [rows, count] = await Promise.all([
      guardianModel.findMany({ where, orderBy, skip, take }),
      guardianModel.count({ where }),
    ])
    data = rows.map((p: any) => ({
      id: p.id,
      userId: p.userId || null,
      name: getDisplayName(p.givenName, p.surname, lang),
      emailAddress: p.emailAddress || "-",
      status: p.userId ? "active" : "inactive",
      createdAt: (p.createdAt as Date).toISOString(),
    }))
    total = count as number
  }
  return (
    <div className="space-y-6">
      <ParentsTable
        initialData={data}
        total={total}
        dictionary={dictionary?.school?.parents}
        lang={lang}
        perPage={sp.perPage}
      />
    </div>
  )
}
