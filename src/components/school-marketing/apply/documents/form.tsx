"use client"

import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useState,
} from "react"
import { useParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Uploader, type UploadResult } from "@/components/file"
import { Icons } from "@/components/icons"
import { useLocale } from "@/components/internationalization/use-locale"

import { useApplySession } from "../application-context"
import { saveDocumentsStep } from "./actions"
import { DOCUMENT_TYPES } from "./config"
import type {
  DocumentsFormProps,
  DocumentsFormRef,
  DocumentUpload,
} from "./types"

export const DocumentsForm = forwardRef<DocumentsFormRef, DocumentsFormProps>(
  ({ initialData, onSuccess, dictionary }, ref) => {
    const params = useParams()
    const subdomain = params.subdomain as string
    const { locale: lang } = useLocale()
    const isRTL = lang === "ar"
    const { session, updateStepData } = useApplySession()

    const [photoUrl, setPhotoUrl] = useState(initialData?.photoUrl || "")
    const [signatureUrl, setSignatureUrl] = useState(
      initialData?.signatureUrl || ""
    )
    const [documents, setDocuments] = useState<DocumentUpload[]>(
      initialData?.documents || []
    )

    // Access apply.documents dictionary
    const dict = ((
      dictionary as Record<
        string,
        Record<string, Record<string, string>>
      > | null
    )?.admission?.apply?.documents ?? {}) as Record<string, string>

    // Handle photo upload
    const handlePhotoUpload = useCallback(
      (results: UploadResult[]) => {
        const file = results[0]
        if (file?.url) {
          setPhotoUrl(file.url)
          updateStepData("documents", {
            photoUrl: file.url,
            signatureUrl,
            documents,
            photo: {
              id: file.id || "",
              url: file.url,
              name: file.originalName || "photo",
              type: "image",
            },
          })
        }
      },
      [signatureUrl, documents, updateStepData]
    )

    // Handle signature upload
    const handleSignatureUpload = useCallback(
      (results: UploadResult[]) => {
        const file = results[0]
        if (file?.url) {
          setSignatureUrl(file.url)
          updateStepData("documents", {
            photoUrl,
            signatureUrl: file.url,
            documents,
            signature: {
              id: file.id || "",
              url: file.url,
              name: file.originalName || "signature",
              type: "image",
            },
          })
        }
      },
      [photoUrl, documents, updateStepData]
    )

    // Handle document upload for a specific type
    const handleDocumentUpload = useCallback(
      (type: string, name: string, results: UploadResult[]) => {
        const file = results[0]
        if (file?.url) {
          const newDoc: DocumentUpload = {
            type,
            name,
            url: file.url,
            uploadedAt: new Date().toISOString(),
            fileId: file.id,
            size: file.size,
          }
          const updated = [...documents.filter((d) => d.type !== type), newDoc]
          setDocuments(updated)
          updateStepData("documents", {
            photoUrl,
            signatureUrl,
            documents: updated,
          })
        }
      },
      [photoUrl, signatureUrl, documents, updateStepData]
    )

    const removeDocument = useCallback(
      (type: string) => {
        const updated = documents.filter((d) => d.type !== type)
        setDocuments(updated)
        updateStepData("documents", {
          photoUrl,
          signatureUrl,
          documents: updated,
        })
      },
      [photoUrl, signatureUrl, documents, updateStepData]
    )

    const removePhoto = useCallback(() => {
      setPhotoUrl("")
      updateStepData("documents", {
        photoUrl: "",
        signatureUrl,
        documents,
        photo: undefined,
      })
    }, [signatureUrl, documents, updateStepData])

    const removeSignature = useCallback(() => {
      setSignatureUrl("")
      updateStepData("documents", {
        photoUrl,
        signatureUrl: "",
        documents,
        signature: undefined,
      })
    }, [photoUrl, documents, updateStepData])

    const saveAndNext = async () => {
      const data = { photoUrl, signatureUrl, documents }
      const result = await saveDocumentsStep(data)
      if (!result.success) throw new Error(result.error || "Failed to save")

      // Update context with validated data
      if (result.data) {
        updateStepData("documents", result.data)
      }

      onSuccess?.()
    }

    useImperativeHandle(ref, () => ({ saveAndNext }))

    return (
      <div className="space-y-8">
        {/* Photo and Signature */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <Label className="mb-4 block">
                {dict.photo || (isRTL ? "الصورة الشخصية" : "Passport Photo")}
              </Label>
              <div className="flex flex-col items-center gap-4">
                {photoUrl ? (
                  <div className="relative">
                    <img
                      src={photoUrl}
                      alt="Photo"
                      className="h-32 w-32 rounded-lg border object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -end-2 -top-2 h-6 w-6"
                      onClick={removePhoto}
                    >
                      <Icons.x className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Uploader
                    category="image"
                    type="avatar"
                    folder="applications/photos"
                    maxSize={2 * 1024 * 1024} // 2MB
                    maxFiles={1}
                    variant="compact"
                    onUploadComplete={handlePhotoUpload}
                    className="w-full"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Label className="mb-4 block">
                {dict.signature || (isRTL ? "التوقيع" : "Signature")}
              </Label>
              <div className="flex flex-col items-center gap-4">
                {signatureUrl ? (
                  <div className="relative">
                    <img
                      src={signatureUrl}
                      alt="Signature"
                      className="h-16 w-32 rounded-lg border bg-white object-contain"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -end-2 -top-2 h-6 w-6"
                      onClick={removeSignature}
                    >
                      <Icons.x className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Uploader
                    category="image"
                    folder="applications/signatures"
                    maxSize={2 * 1024 * 1024} // 2MB
                    maxFiles={1}
                    variant="compact"
                    onUploadComplete={handleSignatureUpload}
                    className="w-full"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Other Documents */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            {dict.otherDocuments ||
              (isRTL ? "المستندات الأخرى" : "Other Documents")}
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {DOCUMENT_TYPES.map((docType) => {
              const uploaded = documents.find((d) => d.type === docType.value)
              return (
                <Card
                  key={docType.value}
                  className={uploaded ? "border-green-500" : ""}
                >
                  <CardContent className="pt-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icons.fileText className="text-muted-foreground h-5 w-5" />
                        <span className="font-medium">
                          {docType.label}
                          {docType.required && (
                            <span className="text-destructive"> *</span>
                          )}
                        </span>
                      </div>
                      {uploaded && (
                        <Icons.checkCircle className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                    {uploaded ? (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground max-w-[150px] truncate">
                          {uploaded.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocument(docType.value)}
                        >
                          <Icons.x className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Uploader
                        category="document"
                        folder="applications/documents"
                        maxSize={10 * 1024 * 1024} // 10MB
                        maxFiles={1}
                        variant="compact"
                        onUploadComplete={(results) =>
                          handleDocumentUpload(
                            docType.value,
                            docType.label,
                            results
                          )
                        }
                        className="w-full"
                      />
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    )
  }
)

DocumentsForm.displayName = "DocumentsForm"
