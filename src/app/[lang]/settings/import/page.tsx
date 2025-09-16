import { CsvImportComponent } from '@/components/platform/import/csv-import';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Import Data | Settings',
  description: 'Bulk import students and teachers from CSV files',
};

export default function ImportPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Import Data</h1>
        <p className="text-muted-foreground mt-2">
          Bulk import students and teachers using CSV files
        </p>
      </div>
      <CsvImportComponent />
    </div>
  );
}