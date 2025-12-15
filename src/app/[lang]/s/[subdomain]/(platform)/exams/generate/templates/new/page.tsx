import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"
import { Shell as PageContainer } from "@/components/table/shell"

export const metadata = { title: "Create Template" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function NewTemplatePage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <PageContainer>
      <div className="flex flex-col gap-4">
        <PageHeadingSetter title="New Template" />
        {/* Template form component will go here */}
      </div>
    </PageContainer>
  )
}
