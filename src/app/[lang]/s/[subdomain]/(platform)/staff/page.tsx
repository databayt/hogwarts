import { redirect } from "next/navigation"

import { type Locale } from "@/components/internationalization/config"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Staff({ params }: Props) {
  const { lang } = await params
  // Redirect to lab or show staff list
  redirect(`/${lang}/dashboard`)
}
