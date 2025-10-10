import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login/form";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

interface Props {
  params: Promise<{ lang: Locale }>
}

const LoginPage = async ({ params }: Props) => {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <Suspense fallback={<div className="h-10" />}>
      <LoginForm dictionary={dictionary} />
    </Suspense>
  );
}

export default LoginPage;