"use client";

import * as React from "react";
import { FileUploader } from "@/components/platform/operator/file-uploader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createReceipt } from "@/app/(platform)/operator/actions/billing/receipts/create";
import { SuccessToast, ErrorToast } from "@/components/atom/toast";

type Props = {
  tenants: Array<{ id: string; name: string }>;
  invoices: Array<{ id: string; number: string }>;
};

export function ReceiptUpload({ tenants, invoices }: Props) {
  const [schoolId, setSchoolId] = React.useState(tenants[0]?.id ?? "");
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
      await createReceipt({ invoiceId, schoolId, filename: file.name, amount });
      SuccessToast();
      setFile(null);
      setAmount(0);
    } catch (e) {
      ErrorToast(e instanceof Error ? e.message : "Failed to create receipt");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-4">
      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-4">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">School</label>
          <Select value={schoolId} onValueChange={setSchoolId}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select school" />
            </SelectTrigger>
            <SelectContent>
              {tenants.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
        <div className="md:col-span-4">
          <FileUploader maxFiles={1} onUpload={onUpload} />
        </div>
        <div className="md:col-span-4">
          <Button size="sm" disabled={submitting || !file || !schoolId || !invoiceId}>Submit receipt</Button>
        </div>
      </form>
    </Card>
  );
}


















