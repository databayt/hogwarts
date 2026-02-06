"use client"

import { useState } from "react"
import { Download, Maximize2, Printer, RotateCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { IDCardTemplateComponent } from "./id-card-template"
import type { IDCardData, IDCardTemplate } from "./types"

interface IDCardPreviewProps {
  data: IDCardData
  template: IDCardTemplate
  onPrint?: () => void
  onDownload?: (format: "pdf" | "image") => void
}

export function IDCardPreview({
  data,
  template,
  onPrint,
  onDownload,
}: IDCardPreviewProps) {
  const [showBack, setShowBack] = useState(false)
  const [showFullscreen, setShowFullscreen] = useState(false)

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>ID Card Preview</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBack(!showBack)}
              >
                <RotateCw className="me-2 h-4 w-4" />
                {showBack ? "Show Front" : "Show Back"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFullscreen(true)}
              >
                <Maximize2 className="me-2 h-4 w-4" />
                Fullscreen
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Preview Container */}
          <div className="flex flex-col items-center space-y-4">
            {/* Card Preview */}
            <div
              className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8"
              style={{
                transform: "scale(1.2)",
                transformOrigin: "center",
                margin: "2rem",
              }}
            >
              <IDCardTemplateComponent
                data={data}
                template={template}
                side={showBack ? "back" : "front"}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex w-full max-w-md gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onDownload?.("pdf")}
              >
                <Download className="me-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onDownload?.("image")}
              >
                <Download className="me-2 h-4 w-4" />
                Download Image
              </Button>
              <Button variant="default" className="flex-1" onClick={onPrint}>
                <Printer className="me-2 h-4 w-4" />
                Print Card
              </Button>
            </div>

            {/* Template Info */}
            <div className="text-muted-foreground space-y-1 text-center text-sm">
              <p>
                Template: {template.name} ({template.orientation})
              </p>
              <p>
                Size: {template.size.width}x{template.size.height}
                {template.size.unit}
              </p>
              <p>
                Features:{" "}
                {[
                  template.includeBarcode && "Barcode",
                  template.includeQRCode && "QR Code",
                ]
                  .filter(Boolean)
                  .join(", ") || "None"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fullscreen Dialog */}
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>ID Card Preview - {data.studentName}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center gap-8 py-8">
            {/* Front Side */}
            <div className="text-center">
              <h4 className="mb-4 text-sm font-medium">Front</h4>
              <div
                className="rounded-lg border-2 border-gray-300 bg-white p-4 shadow-lg"
                style={{
                  transform: "scale(1.5)",
                  transformOrigin: "center",
                  margin: "3rem 2rem",
                }}
              >
                <IDCardTemplateComponent
                  data={data}
                  template={template}
                  side="front"
                />
              </div>
            </div>

            {/* Back Side */}
            <div className="text-center">
              <h4 className="mb-4 text-sm font-medium">Back</h4>
              <div
                className="rounded-lg border-2 border-gray-300 bg-white p-4 shadow-lg"
                style={{
                  transform: "scale(1.5)",
                  transformOrigin: "center",
                  margin: "3rem 2rem",
                }}
              >
                <IDCardTemplateComponent
                  data={data}
                  template={template}
                  side="back"
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
