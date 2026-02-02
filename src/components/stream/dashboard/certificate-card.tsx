"use client"

import { useState } from "react"
import { Award, Download, ExternalLink, Share2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface CertificateCardProps {
  certificate: {
    id: string
    certificateNumber: string
    courseTitle: string
    completedAt: Date
    issuedAt: Date
  }
  studentName: string
  schoolName: string
  lang: string
}

export function CertificateCard({
  certificate,
  studentName,
  schoolName,
  lang,
}: CertificateCardProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const isRTL = lang === "ar"

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(
      lang === "ar" ? "ar-SA" : "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    )
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      // Generate certificate as canvas and download as PNG
      const canvas = document.createElement("canvas")
      canvas.width = 1200
      canvas.height = 850
      const ctx = canvas.getContext("2d")

      if (ctx) {
        // Background
        ctx.fillStyle = "#FFFFFF"
        ctx.fillRect(0, 0, 1200, 850)

        // Border
        ctx.strokeStyle = "#D4AF37"
        ctx.lineWidth = 8
        ctx.strokeRect(30, 30, 1140, 790)

        // Inner border
        ctx.strokeStyle = "#1a1a2e"
        ctx.lineWidth = 2
        ctx.strokeRect(50, 50, 1100, 750)

        // Header decoration
        ctx.fillStyle = "#D4AF37"
        ctx.fillRect(100, 100, 1000, 5)

        // Certificate title
        ctx.fillStyle = "#1a1a2e"
        ctx.font = "bold 48px Georgia, serif"
        ctx.textAlign = "center"
        ctx.fillText("Certificate of Completion", 600, 180)

        // Decorative line
        ctx.fillStyle = "#D4AF37"
        ctx.fillRect(350, 200, 500, 3)

        // "This is to certify that"
        ctx.fillStyle = "#666666"
        ctx.font = "24px Georgia, serif"
        ctx.fillText("This is to certify that", 600, 280)

        // Student name
        ctx.fillStyle = "#1a1a2e"
        ctx.font = "bold 42px Georgia, serif"
        ctx.fillText(studentName, 600, 350)

        // Decorative line under name
        ctx.fillStyle = "#D4AF37"
        ctx.fillRect(300, 380, 600, 2)

        // "has successfully completed"
        ctx.fillStyle = "#666666"
        ctx.font = "24px Georgia, serif"
        ctx.fillText("has successfully completed the course", 600, 440)

        // Course title
        ctx.fillStyle = "#1a1a2e"
        ctx.font = "bold 36px Georgia, serif"
        ctx.fillText(certificate.courseTitle, 600, 510)

        // School name
        ctx.fillStyle = "#666666"
        ctx.font = "italic 20px Georgia, serif"
        ctx.fillText(`Presented by ${schoolName}`, 600, 570)

        // Date
        ctx.font = "20px Georgia, serif"
        ctx.fillText(
          `Completed on ${formatDate(certificate.completedAt)}`,
          600,
          620
        )

        // Certificate number
        ctx.font = "14px monospace"
        ctx.fillStyle = "#888888"
        ctx.fillText(
          `Certificate No: ${certificate.certificateNumber}`,
          600,
          680
        )

        // Footer decoration
        ctx.fillStyle = "#D4AF37"
        ctx.fillRect(100, 750, 1000, 5)

        // Award icon representation (simple)
        ctx.beginPath()
        ctx.arc(600, 730, 20, 0, Math.PI * 2)
        ctx.fillStyle = "#D4AF37"
        ctx.fill()
      }

      // Download
      const link = document.createElement("a")
      link.download = `certificate-${certificate.certificateNumber}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
    } catch (error) {
      console.error("Failed to download certificate:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/${lang}/stream/certificate/verify/${certificate.certificateNumber}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: isRTL
            ? `شهادة إتمام - ${certificate.courseTitle}`
            : `Certificate of Completion - ${certificate.courseTitle}`,
          text: isRTL
            ? `لقد أكملت بنجاح دورة "${certificate.courseTitle}"`
            : `I have successfully completed "${certificate.courseTitle}"`,
          url: shareUrl,
        })
      } catch {
        // User cancelled or share failed - no action needed
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareUrl)
      alert(isRTL ? "تم نسخ الرابط!" : "Link copied to clipboard!")
    }
  }

  return (
    <Card className="dark:to-background border-amber-200 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900/50">
            <Award className="size-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <CardTitle className="text-lg">
              {isRTL ? "شهادة إتمام" : "Certificate of Completion"}
            </CardTitle>
            <CardDescription>{certificate.courseTitle}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-muted-foreground text-sm">
          <p>
            {isRTL ? "تاريخ الإتمام:" : "Completed:"}{" "}
            {formatDate(certificate.completedAt)}
          </p>
          <p className="font-mono text-xs">
            {isRTL ? "رقم الشهادة:" : "Certificate #:"}{" "}
            {certificate.certificateNumber}
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <ExternalLink className="size-4" />
                {isRTL ? "عرض" : "View"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>
                  {isRTL ? "شهادة إتمام" : "Certificate of Completion"}
                </DialogTitle>
                <DialogDescription>{certificate.courseTitle}</DialogDescription>
              </DialogHeader>
              <div className="relative aspect-[1200/850] w-full overflow-hidden rounded-lg border bg-white">
                {/* Certificate Preview */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                  {/* Decorative border */}
                  <div className="absolute inset-4 border-4 border-amber-400" />
                  <div className="absolute inset-6 border border-gray-800" />

                  <Award className="mb-4 size-12 text-amber-500" />

                  <h2 className="mb-2 font-serif text-3xl font-bold text-gray-800">
                    Certificate of Completion
                  </h2>

                  <div className="mb-4 h-0.5 w-48 bg-amber-400" />

                  <p className="mb-2 text-gray-600">This is to certify that</p>

                  <h3 className="mb-2 font-serif text-2xl font-bold text-gray-900">
                    {studentName}
                  </h3>

                  <div className="mb-4 h-0.5 w-64 bg-amber-400" />

                  <p className="mb-2 text-gray-600">
                    has successfully completed the course
                  </p>

                  <h4 className="mb-4 font-serif text-xl font-semibold text-gray-800">
                    {certificate.courseTitle}
                  </h4>

                  <p className="mb-1 text-sm text-gray-500 italic">
                    Presented by {schoolName}
                  </p>

                  <p className="mb-4 text-sm text-gray-500">
                    Completed on {formatDate(certificate.completedAt)}
                  </p>

                  <p className="font-mono text-xs text-gray-400">
                    Certificate No: {certificate.certificateNumber}
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1"
          >
            <Download className="size-4" />
            {isDownloading
              ? isRTL
                ? "جاري التحميل..."
                : "Downloading..."
              : isRTL
                ? "تحميل"
                : "Download"}
          </Button>

          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
