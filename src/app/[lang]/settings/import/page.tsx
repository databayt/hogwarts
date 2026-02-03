import { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { CsvImportComponent } from "@/components/school-dashboard/import/csv-import"

export const metadata: Metadata = {
  title: "Import Data | Settings",
  description: "Bulk import students and teachers from CSV files",
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function Import({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <CsvImportComponent dictionary={dictionary} lang={lang} />
}
