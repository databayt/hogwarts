import RouteModal from "@/components/atom/modal/route-modal";
import CreateEditInvoiceModalContent from "@/components/invoice/invoice/create-edit-content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; invoiceId: string }>
}

export default async function EditInvoice({ params }: Props) {
  const { lang, invoiceId } = await params;
  const dictionary = await getDictionary(lang);
  return (
    <RouteModal
      returnTo={`/${lang}/invoice`}
      sm
      content={<CreateEditInvoiceModalContent invoiceId={invoiceId} dictionary={dictionary} lang={lang} />}
    />
  );
}