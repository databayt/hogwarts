import { RegisterForm } from "@/components/auth/join/form"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

interface Props {
  params: Promise<{ lang: Locale }>
}

const RegisterPage = async ({ params }: Props) => {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <RegisterForm dictionary={dictionary} lang={lang} />
}

export default RegisterPage
