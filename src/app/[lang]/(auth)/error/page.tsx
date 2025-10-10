import { Suspense } from "react";
import { ErrorCard } from "@/components/auth/error-card";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

interface Props {
  params: Promise<{ lang: Locale }>;
}

const AuthErrorPage = async ({ params }: Props) => {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <Suspense fallback={<div className="h-10" />}>
      <ErrorCard dictionary={dictionary} lang={lang} />
    </Suspense>
  );
};

export default AuthErrorPage;
