import { redirect } from "next/navigation";
import type { Locale } from "@/components/internationalization/config";

interface ApplicationFormPageProps {
  params: Promise<{ lang: Locale; subdomain: string; campaignId: string }>;
}

export const metadata = {
  title: "Application | Apply",
  description: "Start your application process",
};

// Redirect to the first step (personal information)
export default async function ApplicationFormPage({ params }: ApplicationFormPageProps) {
  const { lang, subdomain, campaignId } = await params;
  redirect(`/${lang}/s/${subdomain}/apply/${campaignId}/personal`);
}
