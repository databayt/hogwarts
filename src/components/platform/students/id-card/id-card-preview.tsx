"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Printer, RotateCw, Maximize2 } from "lucide-react";
import { IDCardTemplateComponent } from "./id-card-template";
import type { IDCardData, IDCardTemplate } from "./types";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface IDCardPreviewProps {
  data: IDCardData;
  template: IDCardTemplate;
  onPrint?: () => void;
  onDownload?: (format: "pdf" | "image") => void;
}

export function IDCardPreview({
  data,
  template,
  onPrint,
  onDownload,
}: IDCardPreviewProps) {
  const [showBack, setShowBack] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);

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
                <RotateCw className="h-4 w-4 mr-2" />
                {showBack ? "Show Front" : "Show Back"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFullscreen(true)}
              >
                <Maximize2 className="h-4 w-4 mr-2" />
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
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50"
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
            <div className="flex gap-3 w-full max-w-md">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onDownload?.("pdf")}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onDownload?.("image")}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Image
              </Button>
              <Button
                variant="default"
                className="flex-1"
                onClick={onPrint}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Card
              </Button>
            </div>

            {/* Template Info */}
            <div className="text-sm text-muted-foreground text-center space-y-1">
              <p>Template: {template.name} ({template.orientation})</p>
              <p>Size: {template.size.width}x{template.size.height}{template.size.unit}</p>
              <p>Features: {[
                template.includeBarcode && "Barcode",
                template.includeQRCode && "QR Code",
              ].filter(Boolean).join(", ") || "None"}</p>
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
          <div className="flex justify-center items-center gap-8 py-8">
            {/* Front Side */}
            <div className="text-center">
              <h4 className="text-sm font-medium mb-4">Front</h4>
              <div
                className="border-2 border-gray-300 rounded-lg p-4 bg-white shadow-lg"
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
              <h4 className="text-sm font-medium mb-4">Back</h4>
              <div
                className="border-2 border-gray-300 rounded-lg p-4 bg-white shadow-lg"
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
  );
}