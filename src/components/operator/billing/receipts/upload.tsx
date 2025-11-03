"use client";

import * as React from "react";
import { FileUploader } from "@/components/file-upload/file-uploader/file-uploader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { uploadReceipt } from "@/components/operator/billing/receipts/actions";
import { SuccessToast, ErrorToast } from "@/components/atom/toast";
import { uploadFileAction } from "@/components/file-upload/actions";
import type { Locale } from "@/components/internationalization/config";
import type { getDictionary } from "@/components/internationalization/dictionaries";
import { useSession } from "next-auth/react";

type Props = {
  invoices: Array<{ id: string; number: string }>;
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  lang: Locale;
};

export function ReceiptUpload({ invoices, dictionary, lang }: Props) {
  const { data: session } = useSession();
  const [invoiceId, setInvoiceId] = React.useState(invoices[0]?.id ?? "");
  const [amount, setAmount] = React.useState(0);
  const [files, setFiles] = React.useState<File[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  const t = dictionary.operator;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = files[0];
    if (!file) return ErrorToast("Select a file");

    setSubmitting(true);
    setUploading(true);

    try {
      // Upload file to storage using centralized system
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", `${session?.user?.schoolId}/financial/receipts`);
      formData.append("category", "document");
      formData.append("type", "receipt");

      const uploadResult = await uploadFileAction(formData);

      if (!uploadResult.success || !uploadResult.metadata) {
        ErrorToast(uploadResult.error || "Failed to upload file");
        return;
      }

      // Save receipt record with uploaded file URL
      const result = await uploadReceipt({
        invoiceId,
        amount,
        fileName: uploadResult.metadata.originalName,
        fileUrl: uploadResult.metadata.url,
      });

      if (result.success) {
        SuccessToast("Receipt uploaded successfully");
        setFiles([]);
        setAmount(0);
      } else {
        ErrorToast(result.error?.message || "Failed to upload receipt");
      }
    } catch (e) {
      ErrorToast(e instanceof Error ? e.message : "Failed to upload receipt");
    } finally {
      setSubmitting(false);
      setUploading(false);
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
            value={files}
            onValueChange={setFiles}
            accept={{ 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] }}
            maxFiles={1}
            maxSize={5 * 1024 * 1024}
            disabled={uploading}
          />
        </div>
        <div className="md:col-span-3">
          <Button size="sm" disabled={submitting || files.length === 0 || !invoiceId}>
            {uploading ? "Uploading..." : t.common.actions.submit}
          </Button>
        </div>
      </form>
    </Card>
  );
}




















