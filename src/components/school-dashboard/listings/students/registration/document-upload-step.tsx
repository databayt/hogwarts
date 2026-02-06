"use client"

import { useState } from "react"
import {
  CircleAlert,
  CircleCheck,
  Eye,
  FileText,
  Image,
  Trash2,
  Upload,
} from "lucide-react"
import { useFieldArray, UseFormReturn } from "react-hook-form"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  ACCEPT_DOCUMENTS,
  ACCEPT_IMAGES,
  FileUploader,
  type UploadedFileResult,
} from "@/components/file"

interface DocumentUploadStepProps {
  form: UseFormReturn<any>
  dictionary?: any
}

const documentTypes = [
  { value: "BIRTH_CERTIFICATE", label: "Birth Certificate", required: true },
  {
    value: "TRANSFER_CERTIFICATE",
    label: "Transfer Certificate",
    required: false,
  },
  { value: "MEDICAL_REPORT", label: "Medical Report", required: false },
  { value: "PASSPORT_COPY", label: "Passport Copy", required: false },
  { value: "VISA_COPY", label: "Visa Copy", required: false },
  { value: "ID_CARD", label: "ID Card Copy", required: false },
  {
    value: "ACADEMIC_TRANSCRIPT",
    label: "Academic Transcript",
    required: false,
  },
  {
    value: "CHARACTER_CERTIFICATE",
    label: "Character Certificate",
    required: false,
  },
  {
    value: "LEAVING_CERTIFICATE",
    label: "Leaving Certificate",
    required: false,
  },
  { value: "OTHER", label: "Other", required: false },
]

export function DocumentUploadStep({
  form,
  dictionary,
}: DocumentUploadStepProps) {
  const [showProfileUploader, setShowProfileUploader] = useState(false)
  const [showDocumentUploader, setShowDocumentUploader] = useState<
    number | null
  >(null)
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>("")

  const {
    fields: documents,
    append: addDocument,
    remove: removeDocument,
  } = useFieldArray({
    control: form.control,
    name: "documents",
  })

  const studentType = form.watch("studentType")
  const isTransferStudent =
    studentType === "TRANSFER" || studentType === "INTERNATIONAL"

  // Profile photo upload handlers
  const handleProfilePhotoComplete = (files: UploadedFileResult[]) => {
    if (files.length > 0) {
      const url = files[0].cdnUrl || files[0].url
      setProfilePhotoUrl(url)
      form.setValue("profilePhotoUrl", url)
      setShowProfileUploader(false)
      toast.success("Profile photo uploaded successfully")
    }
  }

  const handleProfilePhotoError = (error: string) => {
    toast.error(error)
  }

  // Document upload handlers
  const handleDocumentUploadComplete = (
    files: UploadedFileResult[],
    index: number
  ) => {
    if (files.length > 0) {
      const file = files[0]
      const url = file.cdnUrl || file.url
      form.setValue(`documents.${index}.fileUrl`, url)
      form.setValue(`documents.${index}.fileSize`, 0) // Size not available from result
      form.setValue(`documents.${index}.mimeType`, "") // MimeType not available
      form.setValue(`documents.${index}.documentName`, file.fileId)
      setShowDocumentUploader(null)
      toast.success("Document uploaded successfully")
    }
  }

  const handleDocumentUploadError = (error: string) => {
    toast.error(error)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  return (
    <div className="grid gap-6">
      <Alert>
        <CircleAlert className="h-4 w-4" />
        <AlertDescription>
          Please upload clear, readable copies of documents. Accepted formats:
          PDF, JPG, PNG. Max file size: 10MB per document.
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
          {profilePhotoUrl || form.watch("profilePhotoUrl") ? (
            <div className="flex items-center gap-6">
              <div className="relative">
                <img
                  src={profilePhotoUrl || form.watch("profilePhotoUrl")}
                  alt="Profile"
                  className="h-32 w-32 rounded-lg border object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2"
                  onClick={() => {
                    form.setValue("profilePhotoUrl", "")
                    setProfilePhotoUrl("")
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1">
                <p className="text-muted-foreground text-sm">
                  Profile photo uploaded successfully
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowProfileUploader(true)}
                >
                  Change Photo
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="border-muted-foreground/25 flex h-32 w-32 items-center justify-center rounded-lg border-2 border-dashed">
                  <Image className="text-muted-foreground/50 h-8 w-8" />
                </div>
                <div className="flex-1">
                  <p className="text-muted-foreground mb-2 text-sm">
                    Passport size photo, Max 5MB (JPG, PNG)
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowProfileUploader(true)}
                  >
                    <Upload className="me-2 h-4 w-4" />
                    Upload Photo
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Photo Upload Dialog */}
      <Dialog open={showProfileUploader} onOpenChange={setShowProfileUploader}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Profile Photo</DialogTitle>
          </DialogHeader>
          <FileUploader
            category="IMAGE"
            folder="students/photos"
            accept={ACCEPT_IMAGES}
            maxFiles={1}
            multiple={false}
            maxSize={5 * 1024 * 1024} // 5MB
            optimizeImages={true}
            onUploadComplete={handleProfilePhotoComplete}
            onUploadError={handleProfilePhotoError}
          />
        </DialogContent>
      </Dialog>

      {/* Required Documents Notice */}
      {isTransferStudent && (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            As a transfer student, please provide Transfer Certificate and
            previous academic records.
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
            onClick={() =>
              addDocument({
                documentType: "",
                documentName: "",
                fileUrl: "",
                description: "",
              })
            }
          >
            <Upload className="me-2 h-4 w-4" />
            Add Document
          </Button>
        </div>

        {documents.map((field, index) => (
          <Card key={field.id}>
            <CardHeader className="py-3">
              <CardTitle className="flex items-center justify-between text-sm">
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
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
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
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
                          {field.value ? (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  window.open(field.value, "_blank")
                                }
                                className="flex-1"
                              >
                                <Eye className="me-2 h-4 w-4" />
                                View File
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowDocumentUploader(index)}
                              >
                                <Upload className="me-2 h-4 w-4" />
                                Change
                              </Button>
                            </>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowDocumentUploader(index)}
                              className="w-full"
                            >
                              <Upload className="me-2 h-4 w-4" />
                              Upload File
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
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <CircleCheck className="h-4 w-4 text-green-500" />
                  <span>
                    {form.watch(`documents.${index}.documentName`)}
                    {form.watch(`documents.${index}.fileSize`) &&
                      ` (${formatFileSize(form.watch(`documents.${index}.fileSize`))})`}
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
            {documentTypes
              .filter(
                (t) =>
                  t.required ||
                  (isTransferStudent && t.value === "TRANSFER_CERTIFICATE")
              )
              .map((type) => {
                const hasDocument = documents.some(
                  (d: any) => d.documentType === type.value && d.fileUrl
                )
                return (
                  <div key={type.value} className="flex items-center gap-2">
                    {hasDocument ? (
                      <CircleCheck className="h-4 w-4 text-green-500" />
                    ) : (
                      <div className="border-muted-foreground h-4 w-4 rounded-full border-2" />
                    )}
                    <span
                      className={
                        hasDocument ? "text-muted-foreground line-through" : ""
                      }
                    >
                      {type.label}
                    </span>
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>

      {/* Document Upload Dialog */}
      <Dialog
        open={showDocumentUploader !== null}
        onOpenChange={(open) => !open && setShowDocumentUploader(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          {showDocumentUploader !== null && (
            <FileUploader
              category="DOCUMENT"
              folder="students/documents"
              accept={{
                ...ACCEPT_IMAGES,
                ...ACCEPT_DOCUMENTS,
              }}
              maxFiles={1}
              multiple={false}
              maxSize={10 * 1024 * 1024} // 10MB
              optimizeImages={false}
              onUploadComplete={(files) =>
                handleDocumentUploadComplete(files, showDocumentUploader)
              }
              onUploadError={handleDocumentUploadError}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
