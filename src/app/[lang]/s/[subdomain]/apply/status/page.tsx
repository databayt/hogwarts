import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSchoolBySubdomain } from "@/lib/subdomain-actions";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";
import StatusTrackerContent from "@/components/site/admission/status/status-tracker-content";

interface StatusPageProps {
  params: Promise<{ lang: Locale; subdomain: string }>;
  searchParams: Promise<{ token?: string }>;
}

export async function generateMetadata({ params }: StatusPageProps): Promise<Metadata> {
  const { subdomain } = await params;
  const schoolResult = await getSchoolBySubdomain(subdomain);

  if (!schoolResult.success || !schoolResult.data) {
    return { title: "Application Status" };
  }

  return {
    title: `Application Status - ${schoolResult.data.name}`,
    description: `Check your application status at ${schoolResult.data.name}.`,
  };
}

export default async function StatusPage({ params, searchParams }: StatusPageProps) {
  const { lang, subdomain } = await params;
  const { token } = await searchParams;
  const dictionary = await getDictionary(lang);
  const schoolResult = await getSchoolBySubdomain(subdomain);

  if (!schoolResult.success || !schoolResult.data) {
    notFound();
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-2xl mx-auto px-4">
        <StatusTrackerContent
          school={schoolResult.data}
          dictionary={dictionary}
          lang={lang}
          subdomain={subdomain}
          initialToken={token}
        />
      </div>
    </div>
  );
}
