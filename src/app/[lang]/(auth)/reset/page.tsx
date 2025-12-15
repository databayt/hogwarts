import { ResetForm } from "@/components/auth/reset/form"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

interface Props {
  params: Promise<{ lang: Locale }>
}

const ResetPage = async ({ params }: Props) => {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <ResetForm dictionary={dictionary} lang={lang} />
}

export default ResetPage
