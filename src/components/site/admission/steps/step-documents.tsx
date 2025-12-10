"use client";

import { useState, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, X, FileText, Image, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import type { ApplicationFormData, PublicCampaign, DocumentUpload, RequiredDocument } from "../types";

interface Props {
  dictionary: Dictionary;
  lang: Locale;
  campaign: PublicCampaign;
}

// Default required documents if campaign doesn't specify
const DEFAULT_REQUIRED_DOCS: RequiredDocument[] = [
  {
    type: "photo",
    name: "Passport Photo",
    nameAr: "صورة جواز السفر",
    required: true,
    description: "Recent passport-size photograph",
    descriptionAr: "صورة حديثة بحجم جواز السفر",
  },
  {
    type: "birth_certificate",
    name: "Birth Certificate",
    nameAr: "شهادة الميلاد",
    required: true,
    description: "Original or certified copy",
    descriptionAr: "الأصل أو نسخة مصدقة",
  },
  {
    type: "previous_report",
    name: "Previous School Report",
    nameAr: "تقرير المدرسة السابقة",
    required: false,
    description: "Last academic year report card",
    descriptionAr: "بطاقة تقرير العام الدراسي الأخير",
  },
  {
    type: "transfer_certificate",
    name: "Transfer Certificate",
    nameAr: "شهادة النقل",
    required: false,
    description: "If transferring from another school",
    descriptionAr: "إذا كان النقل من مدرسة أخرى",
  },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export default function StepDocuments({ dictionary, lang, campaign }: Props) {
  const { control, setValue, watch } = useFormContext<ApplicationFormData>();
  const isRTL = lang === "ar";

  const documents = watch("documents") || [];
  const photoUrl = watch("photoUrl");
  const signatureUrl = watch("signatureUrl");

  const [uploading, setUploading] = useState<string | null>(null);

  const requiredDocs = campaign.requiredDocuments || DEFAULT_REQUIRED_DOCS;

  const handleFileUpload = useCallback(async (
    file: File,
    docType: string,
    fieldName?: "photoUrl" | "signatureUrl"
  ) => {
    // Validate file
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(isRTL ? "نوع الملف غير مدعوم" : "File type not supported");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error(isRTL ? "حجم الملف كبير جداً (الحد الأقصى 5 ميجابايت)" : "File too large (max 5MB)");
      return;
    }

    setUploading(docType);

    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", docType);

      // TODO: Replace with actual upload endpoint
      // For now, create a local URL for preview
      const fileUrl = URL.createObjectURL(file);

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 500));

      if (fieldName) {
        setValue(fieldName, fileUrl);
      } else {
        const newDoc: DocumentUpload = {
          type: docType,
          name: file.name,
          url: fileUrl,
          uploadedAt: new Date().toISOString(),
        };

        // Remove existing doc of same type and add new one
        const updatedDocs = documents.filter(d => d.type !== docType);
        setValue("documents", [...updatedDocs, newDoc]);
      }

      toast.success(isRTL ? "تم رفع الملف بنجاح" : "File uploaded successfully");
    } catch (error) {
      toast.error(isRTL ? "فشل في رفع الملف" : "Failed to upload file");
    } finally {
      setUploading(null);
    }
  }, [documents, setValue, isRTL]);

  const removeDocument = useCallback((docType: string) => {
    const updatedDocs = documents.filter(d => d.type !== docType);
    setValue("documents", updatedDocs);
  }, [documents, setValue]);

  const getUploadedDoc = (docType: string) => {
    return documents.find(d => d.type === docType);
  };

  return (
    <div className="space-y-6">
      {/* Photo & Signature */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {isRTL ? "الصورة والتوقيع" : "Photo & Signature"}
          </CardTitle>
          <CardDescription>
            {isRTL
              ? "قم برفع صورة شخصية حديثة وتوقيع الطالب"
              : "Upload a recent passport photo and student's signature"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Photo Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {isRTL ? "صورة شخصية" : "Passport Photo"} <span className="text-destructive">*</span>
              </label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                {photoUrl ? (
                  <div className="relative">
                    <img
                      src={photoUrl}
                      alt="Photo"
                      className="w-32 h-32 mx-auto object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-0 right-0 h-6 w-6"
                      onClick={() => setValue("photoUrl", undefined)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, "photo", "photoUrl");
                      }}
                    />
                    <div className="flex flex-col items-center gap-2 py-4">
                      {uploading === "photo" ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                      ) : (
                        <>
                          <Image className="h-8 w-8 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {isRTL ? "انقر للرفع" : "Click to upload"}
                          </span>
                        </>
                      )}
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Signature Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {isRTL ? "التوقيع" : "Signature"}
              </label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                {signatureUrl ? (
                  <div className="relative">
                    <img
                      src={signatureUrl}
                      alt="Signature"
                      className="w-32 h-16 mx-auto object-contain"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-0 right-0 h-6 w-6"
                      onClick={() => setValue("signatureUrl", undefined)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, "signature", "signatureUrl");
                      }}
                    />
                    <div className="flex flex-col items-center gap-2 py-4">
                      {uploading === "signature" ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                      ) : (
                        <>
                          <FileText className="h-8 w-8 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {isRTL ? "انقر للرفع" : "Click to upload"}
                          </span>
                        </>
                      )}
                    </div>
                  </label>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Required Documents */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {isRTL ? "المستندات المطلوبة" : "Required Documents"}
          </CardTitle>
          <CardDescription>
            {isRTL
              ? "قم برفع المستندات المطلوبة أدناه. الحد الأقصى للحجم 5 ميجابايت لكل ملف."
              : "Upload the required documents below. Maximum file size is 5MB per file."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requiredDocs.map((doc) => {
              const uploadedDoc = getUploadedDoc(doc.type);
              const isUploading = uploading === doc.type;

              return (
                <div
                  key={doc.type}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {uploadedDoc ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {isRTL ? doc.nameAr : doc.name}
                        </span>
                        {doc.required && (
                          <Badge variant="destructive" className="text-xs">
                            {isRTL ? "مطلوب" : "Required"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {isRTL ? doc.descriptionAr : doc.description}
                      </p>
                      {uploadedDoc && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {uploadedDoc.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {uploadedDoc ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(doc.type)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : (
                      <label>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, doc.type);
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isUploading}
                          asChild
                        >
                          <span>
                            {isUploading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                            ) : (
                              <>
                                <Upload className="h-4 w-4 me-2" />
                                {isRTL ? "رفع" : "Upload"}
                              </>
                            )}
                          </span>
                        </Button>
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Additional Documents */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {isRTL ? "مستندات إضافية" : "Additional Documents"}
          </CardTitle>
          <CardDescription>
            {isRTL
              ? "قم برفع أي مستندات إضافية قد تدعم طلبك"
              : "Upload any additional documents that may support your application"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label className="cursor-pointer">
            <input
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              multiple
              onChange={(e) => {
                const files = e.target.files;
                if (files) {
                  Array.from(files).forEach(file => {
                    handleFileUpload(file, `additional_${Date.now()}`);
                  });
                }
              }}
            />
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/25 transition-colors">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                {isRTL
                  ? "اسحب وأفلت الملفات هنا أو انقر للتحميل"
                  : "Drag and drop files here or click to upload"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, JPG, PNG, WEBP (Max 5MB)
              </p>
            </div>
          </label>

          {/* Show additional uploaded documents */}
          {documents.filter(d => d.type.startsWith("additional_")).length > 0 && (
            <div className="mt-4 space-y-2">
              {documents
                .filter(d => d.type.startsWith("additional_"))
                .map((doc, index) => (
                  <div
                    key={doc.type}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{doc.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument(doc.type)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
