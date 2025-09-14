import { DashboardContent } from '@/components/operator/dashboard/content';
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export const metadata = {
  title: "Dashboard",
  description: "Operator dashboard overview"
};

interface DashboardPageProps {
  params: Promise<{ lang: Locale }>
}

export default async function Dashboard({ params }: DashboardPageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <DashboardContent />;
}
