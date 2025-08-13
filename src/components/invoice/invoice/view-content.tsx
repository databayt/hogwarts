"use client";

import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface InvoiceViewProps {
  invoiceId: string;
}

export default function ViewInvoiceModalContent({ invoiceId }: InvoiceViewProps) {
  const [invoice, setInvoice] = useState<any | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`/api/invoice/${invoiceId}`);
        if (res.ok) {
          const json = await res.json();
          setInvoice(json);
        }
      } catch (_) {}
    };
    run();
  }, [invoiceId]);

  if (!invoice) return <div className="p-6">Loading...</div>;

  const totalAmountInCurrencyFormat = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: invoice.currency || "USD",
  }).format(invoice.total);

  return (
    <div className="p-6 max-w-3xl w-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-xl font-bold mb-1">Invoice</h1>
          <p className="text-xs text-muted-foreground">#{invoice.invoice_no}</p>
        </div>
        <Badge>{invoice.status}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h2 className="font-semibold mb-2">From</h2>
          <p>{invoice.from.name}</p>
          <p className="text-sm text-muted-foreground">{invoice.from.email}</p>
        </div>
        <div>
          <h2 className="font-semibold mb-2">To</h2>
          <p>{invoice.to.name}</p>
          <p className="text-sm text-muted-foreground">{invoice.to.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
        <div>
          <span className="font-medium">Invoice Date</span>
          <p>{format(new Date(invoice.invoice_date), "PPP")}</p>
        </div>
        <div>
          <span className="font-medium">Due Date</span>
          <p>{format(new Date(invoice.due_date), "PPP")}</p>
        </div>
      </div>

      <Separator className="my-6" />

      <table className="w-full mb-6 text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">Item</th>
            <th className="text-right py-2">Qty</th>
            <th className="text-right py-2">Price</th>
            <th className="text-right py-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item: any) => {
            const itemTotal = item.quantity * item.price;
            const itemTotalFormatted = new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: invoice.currency || "USD",
            }).format(itemTotal);
            const priceFormatted = new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: invoice.currency || "USD",
            }).format(item.price);
            return (
              <tr key={item.id} className="border-b">
                <td className="py-2">{item.item_name}</td>
                <td className="text-right py-2">{item.quantity}</td>
                <td className="text-right py-2">{priceFormatted}</td>
                <td className="text-right py-2">{itemTotalFormatted}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="w-56">
          <div className="flex justify-between py-2">
            <span className="font-medium">Total</span>
            <span className="font-bold">{totalAmountInCurrencyFormat}</span>
          </div>
        </div>
      </div>
    </div>
  );
}


