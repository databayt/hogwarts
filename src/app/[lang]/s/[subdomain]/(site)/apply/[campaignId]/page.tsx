import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSchoolBySubdomain } from "@/lib/subdomain-actions";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";
import { getCampaignById } from "@/components/site/admission/actions";
import ApplicationFormContent from "@/components/site/admission/portal/application-form-content";

interface ApplicationFormPageProps {
  params: Promise<{ lang: Locale; subdomain: string; campaignId: string }>;
}

export async function generateMetadata({ params }: ApplicationFormPageProps): Promise<Metadata> {
  const { subdomain, campaignId } = await params;
  const schoolResult = await getSchoolBySubdomain(subdomain);
  const campaignResult = await getCampaignById(subdomain, campaignId);

  if (!schoolResult.success || !schoolResult.data) {
    return { title: "Application" };
  }

  const campaignName = campaignResult.success && campaignResult.data
    ? campaignResult.data.name
    : "Admission";

  return {
    title: `${campaignName} Application - ${schoolResult.data.name}`,
    description: `Complete your application for ${campaignName} at ${schoolResult.data.name}.`,
  };
}

export default async function ApplicationFormPage({ params }: ApplicationFormPageProps) {
  const { lang, subdomain, campaignId } = await params;
  const dictionary = await getDictionary(lang);
  const schoolResult = await getSchoolBySubdomain(subdomain);

  if (!schoolResult.success || !schoolResult.data) {
    notFound();
  }

  const campaignResult = await getCampaignById(subdomain, campaignId);

  if (!campaignResult.success || !campaignResult.data) {
    notFound();
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-4xl mx-auto px-4">
        <ApplicationFormContent
          school={schoolResult.data}
          campaign={campaignResult.data}
          dictionary={dictionary}
          lang={lang}
          subdomain={subdomain}
        />
      </div>
    </div>
  );
}
