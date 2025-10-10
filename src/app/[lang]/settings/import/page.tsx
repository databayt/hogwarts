import { CsvImportComponent } from '@/components/platform/import/csv-import';
import { getDictionary } from '@/components/internationalization/dictionaries';
import { type Locale } from '@/components/internationalization/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Import Data | Settings',
  description: 'Bulk import students and teachers from CSV files',
};

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function Import({ params }: Props) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <CsvImportComponent dictionary={dictionary} lang={lang} />;
}