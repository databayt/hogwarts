import RouteModal from "@/components/atom/modal/route-modal";
import ViewInvoiceModalContent from "@/components/platform/finance/invoice/invoice/view-content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function ViewInvoice({ params }: Props) {
  const { lang, id } = await params;
  const dictionary = await getDictionary(lang);
  return (
    <RouteModal returnTo={`/${lang}/invoice`} content={<ViewInvoiceModalContent invoiceId={id} dictionary={dictionary} lang={lang} />} />
  );
}
