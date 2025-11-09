import { DashboardContent } from '@/components/operator/dashboard/content';
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export const metadata = {
  title: "Dashboard",
  description: "Operator lab overview"
};

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function Dashboard({ params }: Props) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <DashboardContent
    dictionary={dictionary}
    lang={lang}
  />;
}
