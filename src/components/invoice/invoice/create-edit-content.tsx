"use client";

import { InvoiceCreateForm } from "@/components/invoice/form";

interface Props {
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
}: Props) {
  return (
    <div className="p-2 sm:p-4 h-full">
      <InvoiceCreateForm
        invoiceId={invoiceId}
        firstName={defaults?.firstName || undefined}
        lastName={defaults?.lastName || undefined}
        email={defaults?.email || undefined}
        currency={defaults?.currency || undefined}
      />
    </div>
  );
}


