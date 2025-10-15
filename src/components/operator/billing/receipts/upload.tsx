"use client";

import * as React from "react";
import { FileUploader } from "@/components/operator/file-uploader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { uploadReceipt } from "@/components/operator/billing/receipts/actions";
import { SuccessToast, ErrorToast } from "@/components/atom/toast";

type Props = {
  invoices: Array<{ id: string; number: string }>;
};

export function ReceiptUpload({ invoices }: Props) {
  const [invoiceId, setInvoiceId] = React.useState(invoices[0]?.id ?? "");
  const [amount, setAmount] = React.useState(0);
  const [file, setFile] = React.useState<File | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const onUpload = async (files: File[]) => {
    setFile(files[0] ?? null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return ErrorToast("Select a file");
    setSubmitting(true);
    try {
      // TODO: Implement actual file upload to storage (S3/R2) to get fileUrl
      const fileUrl = `https://placeholder.com/receipts/${file.name}`;

      const result = await uploadReceipt({
        invoiceId,
        amount,
        fileName: file.name,
        fileUrl
      });
      if (result.success) {
        SuccessToast("Receipt uploaded successfully");
        setFile(null);
        setAmount(0);
      } else {
        ErrorToast(result.error?.message || "Failed to upload receipt");
      }
    } catch (e) {
      ErrorToast(e instanceof Error ? e.message : "Failed to upload receipt");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-4">
      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Invoice</label>
          <Select value={invoiceId} onValueChange={setInvoiceId}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select invoice" />
            </SelectTrigger>
            <SelectContent>
              {invoices.map((i) => (
                <SelectItem key={i.id} value={i.id}>{i.number || i.id.slice(0,8)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Amount (cents)</label>
          <Input className="h-8" type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        </div>
        <div className="md:col-span-3">
          <FileUploader maxFiles={1} onUpload={onUpload} />
        </div>
        <div className="md:col-span-3">
          <Button size="sm" disabled={submitting || !file || !invoiceId}>Submit receipt</Button>
        </div>
      </form>
    </Card>
  );
}




















