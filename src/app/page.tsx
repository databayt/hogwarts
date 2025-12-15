import { redirect } from "next/navigation"

import { i18n } from "@/components/internationalization/config"

export default async function Root() {
  // Redirect to default locale
  redirect(`/${i18n.defaultLocale}`)
}
