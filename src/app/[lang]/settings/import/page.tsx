import { CsvImportComponent } from '@/components/platform/import/csv-import';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Import Data | Settings',
  description: 'Bulk import students and teachers from CSV files',
};

export default function Import() {
  return <CsvImportComponent />;
}