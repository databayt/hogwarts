import { InvoiceContent } from "@/components/platform/finance/invoice/content";
import { SearchParams } from 'nuqs/server';

interface Props {
  searchParams: Promise<SearchParams>
}

export default async function List({ searchParams }: Props) {
  return <InvoiceContent searchParams={searchParams} />;
}
