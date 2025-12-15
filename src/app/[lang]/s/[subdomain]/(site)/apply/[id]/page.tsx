import { redirect } from "next/navigation"

import type { Locale } from "@/components/internationalization/config"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export const metadata = {
  title: "Application | Apply",
  description: "Start your application process",
}

// Redirect to the first step (personal information)
export default async function ApplicationFormPage({ params }: Props) {
  const { lang, subdomain, id } = await params
  redirect(`/${lang}/s/${subdomain}/apply/${id}/personal`)
}
