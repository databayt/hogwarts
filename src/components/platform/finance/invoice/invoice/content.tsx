import { auth } from "@/auth";
import InvoiceClientPage from "@/components/platform/finance/invoice/invoice/InvoiceClientPage";
import { Suspense } from "react";
import Loading from "@/components/platform/finance/invoice/Loading";
import { type Locale } from "@/components/internationalization/config";
import { type getDictionary } from "@/components/internationalization/dictionaries";

interface InvoiceContentProps {
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  lang: Locale;
}

export async function InvoiceContent({ dictionary, lang }: InvoiceContentProps) {
  const session = await auth();
  return (
    <Suspense fallback={<Loading />}>
      <InvoiceClientPage userId={session?.user.id} currency={undefined} dictionary={dictionary} lang={lang} />
    </Suspense>
  );
}

export default InvoiceContent;
