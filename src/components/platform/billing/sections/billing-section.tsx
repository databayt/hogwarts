"use client";

import { UpcomingCharges } from "@/components/billingsdk/upcoming-charges";
import { InvoiceHistory } from "@/components/billingsdk/invoice-history";
import type { ChargeItem, InvoiceItem } from "@/lib/billingsdk-config";

interface BillingSectionProps {
  nextBillingDate: string;
  totalAmount: string;
  upcomingCharges: ChargeItem[];
  invoices: InvoiceItem[];
  onDownloadInvoice?: (invoiceId: string) => void;
}

export function BillingSection({
  nextBillingDate,
  totalAmount,
  upcomingCharges,
  invoices,
  onDownloadInvoice,
}: BillingSectionProps) {
  return (
    <section className="space-y-6">
      <div>
        <h2>Billing & Invoices</h2>
        <p className="muted">
          View upcoming charges and download past invoices
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Charges */}
        <UpcomingCharges
          title="Upcoming Charges"
          description="Your next billing cycle charges"
          nextBillingDate={nextBillingDate}
          totalAmount={totalAmount}
          charges={upcomingCharges}
          className="lg:col-span-1"
        />

        {/* Invoice History */}
        <InvoiceHistory
          title="Invoice History"
          description="Your past invoices and payment receipts"
          invoices={invoices}
          onDownload={onDownloadInvoice}
          className="lg:col-span-1"
        />
      </div>
    </section>
  );
}
