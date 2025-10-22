"use client";

import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload,
  FileText,
  Image,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
  File
} from "lucide-react";
import { useFieldArray } from "react-hook-form";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { uploadFileAction } from "@/components/file-uploader/actions";
import { useSession } from "next-auth/react";

interface DocumentUploadStepProps {
  form: UseFormReturn<any>;
  dictionary?: any;
}

const documentTypes = [
  { value: "BIRTH_CERTIFICATE", label: "Birth Certificate", required: true },
  { value: "TRANSFER_CERTIFICATE", label: "Transfer Certificate", required: false },
  { value: "MEDICAL_REPORT", label: "Medical Report", required: false },
  { value: "PASSPORT_COPY", label: "Passport Copy", required: false },
  { value: "VISA_COPY", label: "Visa Copy", required: false },
  { value: "ID_CARD", label: "ID Card Copy", required: false },
  { value: "ACADEMIC_TRANSCRIPT", label: "Academic Transcript", required: false },
  { value: "CHARACTER_CERTIFICATE", label: "Character Certificate", required: false },
  { value: "LEAVING_CERTIFICATE", label: "Leaving Certificate", required: false },
  { value: "OTHER", label: "Other", required: false },
];

export function DocumentUploadStep({ form, dictionary }: DocumentUploadStepProps) {
  const { data: session } = useSession();
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);

  const { fields: documents, append: addDocument, remove: removeDocument } = useFieldArray({
    control: form.control,
    name: "documents",
  });

  const studentType = form.watch("studentType");
  const isTransferStudent = studentType === "TRANSFER" || studentType === "INTERNATIONAL";

  // Upload file using centralized system
  const handleFileUpload = async (file: File, fieldName: string) => {
    setUploadingFile(fieldName);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", `${session?.user?.schoolId}/students/documents`);
      formData.append("category", file.type.startsWith("image/") ? "image" : "document");
      formData.append("type", "student_record");

      const result = await uploadFileAction(formData);

      setUploadingFile(null);

      if (result.success && result.metadata) {
        return {
          url: result.metadata.url,
          name: result.metadata.originalName,
          size: result.metadata.size,
          mimeType: result.metadata.mimeType,
        };
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      setUploadingFile(null);
      throw error;
    }
  };

  const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      form.setError("profilePhotoUrl", {
        message: "Please upload an image file",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      form.setError("profilePhotoUrl", {
        message: "File size must be less than 5MB",
      });
      return;
    }

    const uploadResult = await handleFileUpload(file, "profilePhoto");
    form.setValue("profilePhotoUrl", uploadResult.url);
    setProfilePhotoPreview(uploadResult.url);
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      form.setError(`documents.${index}.fileUrl`, {
        message: "File size must be less than 10MB",
      });
      return;
    }

    const uploadResult = await handleFileUpload(file, `document-${index}`);
    form.setValue(`documents.${index}.fileUrl`, uploadResult.url);
    form.setValue(`documents.${index}.fileSize`, uploadResult.size);
    form.setValue(`documents.${index}.mimeType`, uploadResult.mimeType);
    form.setValue(`documents.${index}.documentName`, uploadResult.name);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="grid gap-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please upload clear, readable copies of documents. Accepted formats: PDF, JPG, PNG. Max file size: 10MB per document.
        </AlertDescription>
      </Alert>

      {/* Profile Photo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Profile Photo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            {profilePhotoPreview ? (
              <div className="relative">
                <img
                  src={profilePhotoPreview}
                  alt="Profile"
                  className="h-32 w-32 rounded-lg object-cover border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2"
                  onClick={() => {
                    form.setValue("profilePhotoUrl", "");
                    setProfilePhotoPreview(null);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="h-32 w-32 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                <Image className="h-8 w-8 text-muted-foreground/50" />
              </div>
            )}

            <div className="flex-1">
              <FormField
                control={form.control}
                name="profilePhotoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Upload Photo</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePhotoChange}
                        disabled={uploadingFile === "profilePhoto"}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1">
                      Passport size photo, Max 5MB (JPG, PNG)
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Required Documents Notice */}
      {isTransferStudent && (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            As a transfer student, please provide Transfer Certificate and previous academic records.
          </AlertDescription>
        </Alert>
      )}

      {/* Document Upload */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4>Documents</h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addDocument({
              documentType: "",
              documentName: "",
              fileUrl: "",
              description: "",
            })}
          >
            <Upload className="h-4 w-4 mr-2" />
            Add Document
          </Button>
        </div>

        {documents.map((field, index) => (
          <Card key={field.id}>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center justify-between">
                Document {index + 1}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDocument(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`documents.${index}.documentType`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select document type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {documentTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                {type.label}
                                {type.required && (
                                  <Badge variant="secondary" className="text-xs">
                                    Required
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`documents.${index}.fileUrl`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Upload File</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleDocumentUpload(e, index)}
                            disabled={uploadingFile === `document-${index}`}
                          />
                          {field.value && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(field.value, "_blank")}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name={`documents.${index}.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any notes about this document"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch(`documents.${index}.fileUrl`) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>
                    {form.watch(`documents.${index}.documentName`)}
                    {form.watch(`documents.${index}.fileSize`) &&
                      ` (${formatFileSize(form.watch(`documents.${index}.fileSize`))})`
                    }
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Checklist */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">Document Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {documentTypes.filter(t => t.required || (isTransferStudent && t.value === "TRANSFER_CERTIFICATE")).map((type) => {
              const hasDocument = documents.some((d: any) => d.documentType === type.value && d.fileUrl);
              return (
                <div key={type.value} className="flex items-center gap-2">
                  {hasDocument ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                  )}
                  <span className={hasDocument ? "line-through text-muted-foreground" : ""}>
                    {type.label}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}