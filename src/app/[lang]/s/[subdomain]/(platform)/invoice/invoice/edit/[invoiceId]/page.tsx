import RouteModal from "@/components/atom/modal/route-modal";
import CreateEditInvoiceModalContent from "@/components/invoice/invoice/create-edit-content";

export default async function EditInvoicePage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const resolvedParams = await params;
  return (
    <RouteModal
      returnTo="/invoice"
      sm
      content={<CreateEditInvoiceModalContent invoiceId={resolvedParams.invoiceId} />}
    />
  );
}