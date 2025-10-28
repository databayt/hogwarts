import { auth } from "@/auth";
import RouteModal from "@/components/atom/modal/route-modal";
import CreateEditInvoiceModalContent from "@/components/platform/finance/invoice/invoice/create-edit-content";
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function InvoiceCreate({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const session = await auth();
  const fullName = session?.user.name ?? "";
  const [derivedFirstName, derivedLastName] = fullName.split(" ", 2);

  return (
    <RouteModal
      returnTo="/invoice"
      content={
        <CreateEditInvoiceModalContent
          defaults={{
            firstName: derivedFirstName || null,
            lastName: derivedLastName || null,
            email: session?.user.email ?? null,
            currency: null,
          }}
          dictionary={dictionary}
          lang={lang}
        />
      }
    />
  );
}
