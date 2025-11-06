"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { uploadReceipt } from "@/components/operator/billing/receipts/actions";
import { SuccessToast, ErrorToast } from "@/components/atom/toast";
import { FileUploader, ACCEPT_IMAGES, type UploadedFileResult } from "@/components/file-upload/enhanced/file-uploader";
import type { Locale } from "@/components/internationalization/config";
import type { getDictionary } from "@/components/internationalization/dictionaries";

type Props = {
  invoices: Array<{ id: string; number: string }>;
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  lang: Locale;
};

// Combined PDF and image acceptance
const RECEIPT_ACCEPT = {
  ...ACCEPT_IMAGES,
  'application/pdf': ['.pdf'],
};

export function ReceiptUpload({ invoices, dictionary, lang }: Props) {
  const [invoiceId, setInvoiceId] = React.useState(invoices[0]?.id ?? "");
  const [amount, setAmount] = React.useState(0);
  const [uploadedFiles, setUploadedFiles] = React.useState<UploadedFileResult[]>([]);
  const [submitting, setSubmitting] = React.useState(false);

  const t = dictionary.operator;

  const handleUploadComplete = (files: UploadedFileResult[]) => {
    setUploadedFiles(files);
  };

  const handleUploadError = (error: string) => {
    ErrorToast(error);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadedFiles.length === 0) return ErrorToast("Select a file");

    setSubmitting(true);

    try {
      const uploadedFile = uploadedFiles[0];

      // Save receipt record with uploaded file URL
      const result = await uploadReceipt({
        invoiceId,
        amount,
        fileName: uploadedFile.fileId,
        fileUrl: uploadedFile.cdnUrl || uploadedFile.url,
      });

      if (result.success) {
        SuccessToast("Receipt uploaded successfully");
        setUploadedFiles([]);
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
          <label className="block text-xs text-muted-foreground mb-1">{t.billing.viewInvoiceDetails}</label>
          <Select value={invoiceId} onValueChange={setInvoiceId}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder={t.common.actions.filter} />
            </SelectTrigger>
            <SelectContent>
              {invoices.map((i) => (
                <SelectItem key={i.id} value={i.id}>{i.number || i.id.slice(0,8)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">{t.billing.totalRevenue}</label>
          <Input className="h-8" type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        </div>
        <div className="md:col-span-3">
          <FileUploader
            category="DOCUMENT"
            folder="operator/receipts"
            accept={RECEIPT_ACCEPT}
            maxFiles={1}
            multiple={false}
            maxSize={5 * 1024 * 1024} // 5MB
            optimizeImages={false}
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
          />
        </div>
        <div className="md:col-span-3">
          <Button size="sm" disabled={submitting || uploadedFiles.length === 0 || !invoiceId}>
            {submitting ? "Submitting..." : t.common.actions.submit}
          </Button>
        </div>
      </form>
    </Card>
  );
}
