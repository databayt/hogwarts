import { TenantsContent } from '@/components/operator/tenants/content';
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export const metadata = {
  title: "Tenant Management",
  description: "Manage school subdomains and tenant settings"
};

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function Tenants({ params }: Props) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <TenantsContent dictionary={dictionary} lang={lang} />;
}



