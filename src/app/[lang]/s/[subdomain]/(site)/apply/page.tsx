import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSchoolBySubdomain } from "@/lib/subdomain-actions";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";
import { getActiveCampaigns } from "@/components/site/admission/actions";
import CampaignSelectorContent from "@/components/site/admission/portal/campaign-selector-content";

interface ApplyPageProps {
  params: Promise<{ lang: Locale; subdomain: string }>;
}

export async function generateMetadata({ params }: ApplyPageProps): Promise<Metadata> {
  const { subdomain } = await params;
  const result = await getSchoolBySubdomain(subdomain);

  if (!result.success || !result.data) {
    return { title: "Apply" };
  }

  return {
    title: `Apply - ${result.data.name}`,
    description: `Apply for admission to ${result.data.name}. Start your application today.`,
  };
}

export default async function ApplyPage({ params }: ApplyPageProps) {
  const { lang, subdomain } = await params;
  const dictionary = await getDictionary(lang);
  const schoolResult = await getSchoolBySubdomain(subdomain);

  if (!schoolResult.success || !schoolResult.data) {
    notFound();
  }

  const campaignsResult = await getActiveCampaigns(subdomain);
  const campaigns = campaignsResult.success ? campaignsResult.data || [] : [];

  return (
    <div className="min-h-screen py-12">
      <div className="container max-w-4xl mx-auto px-4">
        <CampaignSelectorContent
          school={schoolResult.data}
          campaigns={campaigns}
          dictionary={dictionary}
          lang={lang}
          subdomain={subdomain}
        />
      </div>
    </div>
  );
}
