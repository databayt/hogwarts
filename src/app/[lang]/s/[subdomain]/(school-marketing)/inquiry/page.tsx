import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import InquiryFormContent from "@/components/school-marketing/admission/inquiry/inquiry-form-content"

interface InquiryPageProps {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({
  params,
}: InquiryPageProps): Promise<Metadata> {
  const { subdomain } = await params
  const schoolResult = await getSchoolBySubdomain(subdomain)

  if (!schoolResult.success || !schoolResult.data) {
    return { title: "Inquiry" }
  }

  return {
    title: `Contact Admissions - ${schoolResult.data.name}`,
    description: `Have questions about ${schoolResult.data.name}? Send us your inquiry and we'll get back to you.`,
  }
}

export default async function InquiryPage({ params }: InquiryPageProps) {
  const { lang, subdomain } = await params
  const dictionary = await getDictionary(lang)
  const schoolResult = await getSchoolBySubdomain(subdomain)

  if (!schoolResult.success || !schoolResult.data) {
    notFound()
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto max-w-2xl px-4">
        <InquiryFormContent
          school={schoolResult.data}
          dictionary={dictionary}
          lang={lang}
          subdomain={subdomain}
        />
      </div>
    </div>
  )
}
