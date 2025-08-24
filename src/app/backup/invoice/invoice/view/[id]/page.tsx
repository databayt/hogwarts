import RouteModal from "@/components/atom/modal/route-modal";
import ViewInvoiceModalContent from "@/components/invoice/invoice/view-content";

export default async function ViewInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return (
    <RouteModal returnTo="/invoice" content={<ViewInvoiceModalContent invoiceId={resolvedParams.id} />} />
  );
}
