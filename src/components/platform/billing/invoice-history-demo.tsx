"use client";

import { InvoiceHistory } from "@/components/billingsdk/invoice-history";

const demoInvoices = [
  {
    id: "inv_001",
    date: "Dec 15, 2024",
    amount: "$20.00",
    status: "paid" as const,
    description: "Pro Plan (Monthly)",
  },
  {
    id: "inv_002",
    date: "Nov 15, 2024",
    amount: "$20.00",
    status: "paid" as const,
    description: "Pro Plan (Monthly)",
  },
  {
    id: "inv_003",
    date: "Oct 15, 2024",
    amount: "$20.00",
    status: "paid" as const,
    description: "Pro Plan (Monthly)",
  },
  {
    id: "inv_004",
    date: "Sep 15, 2024",
    amount: "$15.00",
    status: "refunded" as const,
    description: "Starter Plan (Monthly)",
  },
];

export function InvoiceHistoryDemo() {
  return (
    <InvoiceHistory
      title="Invoice History"
      description="Your past invoices and payment receipts."
      invoices={demoInvoices}
      onDownload={(id) => console.log("Download invoice:", id)}
    />
  );
}
