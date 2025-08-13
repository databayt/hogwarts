"use client";

import CreateEditInvoice from "@/components/invoice/form";

interface CreateEditInvoiceModalContentProps {
  invoiceId?: string;
  defaults?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    currency?: string | null;
  };
}

export default function CreateEditInvoiceModalContent({
  invoiceId,
  defaults,
}: CreateEditInvoiceModalContentProps) {
  return (
    <div className="p-2 sm:p-4">
      <CreateEditInvoice
        invoiceId={invoiceId}
        firstName={defaults?.firstName || undefined}
        lastName={defaults?.lastName || undefined}
        email={defaults?.email || undefined}
        currency={defaults?.currency || undefined}
      />
    </div>
  );
}


