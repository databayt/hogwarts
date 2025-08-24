import { InvoiceContent } from "@/components/invoice/content";
import { SearchParams } from 'nuqs/server';

interface InvoicePageProps {
  searchParams: Promise<SearchParams>
}

export default async function InvoicePage({ searchParams }: InvoicePageProps) {
  return <InvoiceContent searchParams={searchParams} />;
}
