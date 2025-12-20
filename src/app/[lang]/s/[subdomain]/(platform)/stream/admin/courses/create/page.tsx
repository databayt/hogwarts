import { redirect } from "next/navigation"

import type { Locale } from "@/components/internationalization/config"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

/**
 * Redirect to courses page - course creation now handled via modal
 */
export default async function StreamCourseCreatePage({ params }: Props) {
  const { lang, subdomain } = await params
  redirect(`/${lang}/s/${subdomain}/stream/admin/courses`)
}
