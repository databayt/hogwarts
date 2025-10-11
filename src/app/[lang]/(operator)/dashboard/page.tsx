import { DashboardContent } from '@/components/operator/dashboard/content';
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export const metadata = {
  title: "Dashboard",
  description: "Operator dashboard overview"
};

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function Dashboard({ params }: Props) {
  const { lang } = await params;

  // The operator dashboard doesn't have dictionary support yet
  // Pass an empty object for now
  return <DashboardContent
    dictionary={{}}
    lang={lang}
  />;
}
