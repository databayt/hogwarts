import { format } from "date-fns"
import {
  CircleCheck,
  CircleX,
  Clock,
  Download,
  Eye,
  File,
  FileText,
  TriangleAlert,
  Upload,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import type { Student, StudentDocument } from "../../registration/types"

interface DocumentsTabProps {
  student: Student
}

export function DocumentsTab({ student }: DocumentsTabProps) {
  // Use real documents from database
  const documents = student.documents || []

  const getDocumentTypeLabel = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "0 B"
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
  }

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return <File className="h-10 w-10 text-gray-400" />
    if (mimeType.startsWith("image/")) return "🖼️"
    if (mimeType === "application/pdf") return "📄"
    if (mimeType.startsWith("application/")) return "📋"
    return "📎"
  }

  const isExpiringSoon = (expiryDate?: Date) => {
    if (!expiryDate) return false
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    return new Date(expiryDate) <= thirtyDaysFromNow
  }

  const isExpired = (expiryDate?: Date) => {
    if (!expiryDate) return false
    return new Date(expiryDate) < new Date()
  }

  return (
    <div className="space-y-6">
      {/* Upload Button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Document Statistics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Documents</p>
                <p className="text-2xl font-bold">{documents.length}</p>
              </div>
              <FileText className="text-muted-foreground h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Verified</p>
                <p className="text-2xl font-bold text-green-600">
                  {documents.filter((d) => d.isVerified).length}
                </p>
              </div>
              <CircleCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {documents.filter((d) => !d.isVerified).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Expiring Soon</p>
                <p className="text-2xl font-bold text-orange-600">
                  {documents.filter((d) => isExpiringSoon(d.expiryDate)).length}
                </p>
              </div>
              <TriangleAlert className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document List */}
      <div className="grid gap-4">
        {documents.map((doc) => (
          <Card
            key={doc.id}
            className={!doc.isVerified ? "border-yellow-200" : ""}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  {/* File Icon */}
                  <div className="flex-shrink-0 text-4xl">
                    {getFileIcon(doc.mimeType)}
                  </div>

                  {/* Document Info */}
                  <div className="space-y-2">
                    <div>
                      <h4 className="flex items-center gap-2 font-medium">
                        {getDocumentTypeLabel(doc.documentType)}
                        {doc.isVerified ? (
                          <Badge
                            variant="outline"
                            className="border-green-600 text-green-600"
                          >
                            <CircleCheck className="mr-1 h-3 w-3" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-yellow-600 text-yellow-600"
                          >
                            <Clock className="mr-1 h-3 w-3" />
                            Pending Verification
                          </Badge>
                        )}
                        {isExpired(doc.expiryDate) && (
                          <Badge variant="destructive">Expired</Badge>
                        )}
                        {!isExpired(doc.expiryDate) &&
                          isExpiringSoon(doc.expiryDate) && (
                            <Badge
                              variant="outline"
                              className="border-orange-600 text-orange-600"
                            >
                              Expiring Soon
                            </Badge>
                          )}
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        {doc.documentName}
                      </p>
                    </div>

                    <div className="text-muted-foreground flex gap-4 text-sm">
                      <span>Size: {formatFileSize(doc.fileSize || 0)}</span>
                      <span>
                        Uploaded:{" "}
                        {format(new Date(doc.uploadedAt), "dd MMM yyyy")}
                      </span>
                      {doc.expiryDate && (
                        <span
                          className={
                            isExpiringSoon(doc.expiryDate)
                              ? "font-medium text-orange-600"
                              : ""
                          }
                        >
                          Expires:{" "}
                          {format(new Date(doc.expiryDate), "dd MMM yyyy")}
                        </span>
                      )}
                    </div>

                    {doc.isVerified && doc.verifiedBy && (
                      <div className="text-muted-foreground text-sm">
                        Verified by {doc.verifiedBy} on{" "}
                        {doc.verifiedAt &&
                          format(new Date(doc.verifiedAt), "dd MMM yyyy")}
                      </div>
                    )}

                    {doc.description && (
                      <p className="text-muted-foreground text-sm">
                        {doc.description}
                      </p>
                    )}

                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex gap-1">
                        {doc.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {documents.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <FileText className="text-muted-foreground mb-4 h-12 w-12" />
            <p className="text-muted-foreground">No documents uploaded</p>
            <Button variant="outline" className="mt-4">
              <Upload className="mr-2 h-4 w-4" />
              Upload First Document
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Required Documents Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Required Documents Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              {
                name: "Birth Certificate",
                type: "BIRTH_CERTIFICATE",
                required: true,
              },
              {
                name: "Transfer Certificate",
                type: "TRANSFER_CERTIFICATE",
                required: student.studentType === "TRANSFER",
              },
              {
                name: "Medical Report",
                type: "MEDICAL_REPORT",
                required: true,
              },
              {
                name: "Passport Copy",
                type: "PASSPORT_COPY",
                required: student.studentType === "INTERNATIONAL",
              },
              {
                name: "Visa Copy",
                type: "VISA_COPY",
                required: student.studentType === "INTERNATIONAL",
              },
              {
                name: "Previous Academic Records",
                type: "ACADEMIC_RECORDS",
                required: student.studentType === "TRANSFER",
              },
            ].map((doc, index) => {
              const uploaded = documents.some(
                (d: any) =>
                  d.documentType?.toUpperCase() === doc.type ||
                  d.documentType?.toUpperCase().includes(doc.type.split("_")[0])
              )
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-2"
                >
                  <div className="flex items-center gap-2">
                    {uploaded ? (
                      <CircleCheck className="h-4 w-4 text-green-600" />
                    ) : doc.required ? (
                      <CircleX className="h-4 w-4 text-red-600" />
                    ) : (
                      <div className="border-muted h-4 w-4 rounded-full border-2" />
                    )}
                    <span
                      className={
                        uploaded ? "text-muted-foreground line-through" : ""
                      }
                    >
                      {doc.name}
                    </span>
                  </div>
                  {doc.required && (
                    <Badge variant="secondary" className="text-xs">
                      Required
                    </Badge>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
