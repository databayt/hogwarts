import { RegisterForm } from "@/components/auth/join/form";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

interface Props {
  params: Promise<{ lang: Locale }>;
}

const RegisterPage = async ({ params }: Props) => {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <RegisterForm dictionary={dictionary} lang={lang} />
  );
}

export default RegisterPage;