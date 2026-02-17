import type { Locale } from "@/components/internationalization/config"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import { getMyContributions } from "@/components/school-dashboard/listings/subjects/catalog/contribution-actions"
import { MyContributions } from "@/components/school-dashboard/listings/subjects/catalog/my-contributions"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function MyContributionsPage({ params }: Props) {
  const { lang } = await params
  const isAr = lang === "ar"

  let contributions = {
    questions: [] as Awaited<
      ReturnType<typeof getMyContributions>
    >["questions"],
    materials: [] as Awaited<
      ReturnType<typeof getMyContributions>
    >["materials"],
    assignments: [] as Awaited<
      ReturnType<typeof getMyContributions>
    >["assignments"],
  }

  try {
    contributions = await getMyContributions()
  } catch {
    // User may not have required role
  }

  return (
    <>
      <PageHeadingSetter title={isAr ? "مساهماتي" : "My Contributions"} />
      <MyContributions contributions={contributions} />
    </>
  )
}
