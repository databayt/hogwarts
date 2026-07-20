"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  CircleAlert,
  CircleCheck,
  Clock,
  Copy,
  Download,
  Eye,
  EyeOff,
  MapPin,
  Maximize2,
  QrCode,
  RefreshCw,
  Settings,
  Share2,
  Shield,
} from "lucide-react"
import QRCode from "qrcode"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { useCountdown } from "../shared/hooks"
import type { QRCodeConfig } from "../shared/types"
import { generateAttendanceQR } from "./actions"

interface QRGeneratorProps {
  classId: string
  dictionary?: Dictionary
  locale?: string
}

export function QRGenerator({
  classId,
  dictionary,
  locale = "en",
}: QRGeneratorProps) {
  const attendanceDict = dictionary?.attendance as
    | Record<string, any>
    | undefined
  const t = attendanceDict?.qrCode as Record<string, string> | undefined
  const tActions = attendanceDict?.qrActions as
    | Record<string, string>
    | undefined
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrCode, setQRCode] = useState<string>("")
  const [qrData, setQRData] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [showFullscreen, setShowFullscreen] = useState(false)
  const [config, setConfig] = useState<QRCodeConfig>({
    refreshInterval: 60,
    validityPeriod: 120,
    includeLocation: false,
    requireStudentAuth: true,
    preventScreenshot: false,
  })

  const { timeLeft, reset: resetTimer } = useCountdown(
    config.refreshInterval,
    () => {
      generateNewQR()
    }
  )

  const generateNewQR = useCallback(async () => {
    setIsGenerating(true)
    try {
      // Call server action to create QR session in database
      const result = await generateAttendanceQR({
        classId,
        validFor: config.refreshInterval,
        includeLocation: config.includeLocation,
      })

      if (!result.success || !result.data) {
        throw new Error(
          result.error || t?.failedToGenerate || "Failed to generate QR code"
        )
      }

      // Store the QR data for display and sharing
      setQRData(result.data.payload)

      // Generate QR code visual from server-provided code
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, result.data.code, {
          width: 400,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
          errorCorrectionLevel: "H",
        })

        // Convert to data URL for display
        const dataUrl = canvasRef.current.toDataURL()
        setQRCode(dataUrl)
      }

      // Reset timer
      resetTimer()

      // Calculate seconds until expiration
      const expiresIn = Math.round(
        (new Date(result.data.expiresAt).getTime() - Date.now()) / 1000
      )

      toast({
        title: t?.qrCodeGenerated || "QR Code Generated",
        description: (
          t?.validForSeconds ||
          "Valid for {seconds} seconds. Stored in database."
        ).replace("{seconds}", expiresIn.toString()),
      })
    } catch (error) {
      toast({
        title: t?.generationFailed || "Generation Failed",
        description:
          error instanceof Error
            ? error.message
            : t?.failedToGenerate || "Failed to generate QR code",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }, [classId, config, resetTimer, t])

  useEffect(() => {
    generateNewQR()
  }, [generateNewQR])

  const downloadQR = () => {
    if (!qrCode) return

    const link = document.createElement("a")
    link.href = qrCode
    link.download = `attendance-qr-${classId}-${Date.now()}.png`
    link.click()

    toast({
      title: tActions?.downloaded ?? "Downloaded",
      description: tActions?.savedToDevice ?? "QR code saved to your device",
    })
  }

  const copyQRData = () => {
    navigator.clipboard.writeText(qrData)
    toast({
      title: tActions?.copied ?? "Copied",
      description: tActions?.copiedToClipboard ?? "QR data copied to clipboard",
    })
  }

  const shareQR = async () => {
    if (!navigator.share) {
      toast({
        title: tActions?.notSupported ?? "Not Supported",
        description:
          tActions?.sharingNotSupported ??
          "Sharing is not supported on this device",
      })
      return
    }

    try {
      // Convert canvas to blob
      const response = await fetch(qrCode)
      const blob = await response.blob()
      const file = new File([blob], "attendance-qr.png", { type: "image/png" })

      await navigator.share({
        title: tActions?.attendanceQRCode ?? "Attendance QR Code",
        text: (
          t?.shareText ||
          "Scan this QR code to mark attendance for class {classId}"
        ).replace("{classId}", classId),
        files: [file],
      })
    } catch (error) {
      console.error("Share failed:", error)
    }
  }

  const toggleFullscreen = () => {
    setShowFullscreen(!showFullscreen)
  }

  const secUnit = locale === "ar" ? "ث" : "s"

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        {/* QR Code Display */}
        <Card className="relative overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t?.activeQRCode || "Active QR Code"}</CardTitle>
              <Badge
                variant={
                  timeLeft > 30
                    ? "default"
                    : timeLeft > 10
                      ? "secondary"
                      : "destructive"
                }
                className="font-mono"
              >
                <Clock className="me-1 h-3 w-3" />
                {timeLeft}
                {secUnit}
              </Badge>
            </div>
            <CardDescription>
              {t?.scanToMarkDescription ||
                "Students scan this code to mark attendance"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {/* Security Overlay (if enabled) */}
            {config.preventScreenshot && (
              <div className="pointer-events-none absolute inset-0 z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/10" />
                <div className="absolute end-4 top-4">
                  <Badge variant="outline" className="bg-background">
                    <Shield className="me-1 h-3 w-3" />
                    {t?.protected || "Protected"}
                  </Badge>
                </div>
              </div>
            )}

            {/* QR Code Canvas */}
            <div className="relative">
              <canvas
                ref={canvasRef}
                className="rounded-lg shadow-lg"
                style={{ maxWidth: "100%", height: "auto" }}
              />
              {isGenerating && (
                <div className="bg-background/80 absolute inset-0 flex items-center justify-center rounded-lg">
                  <RefreshCw className="h-8 w-8 animate-spin" />
                </div>
              )}
            </div>

            {/* Status Indicators */}
            <div className="mt-4 flex flex-wrap gap-2">
              {config.requireStudentAuth && (
                <Badge variant="outline">
                  <CircleCheck className="me-1 h-3 w-3" />
                  {t?.authRequired || "Auth Required"}
                </Badge>
              )}
              {config.includeLocation && (
                <Badge variant="outline">
                  <MapPin className="me-1 h-3 w-3" />
                  {t?.locationTracked || "Location Tracked"}
                </Badge>
              )}
              <Badge variant="outline">
                <QrCode className="me-1 h-3 w-3" />
                {(t?.classLabel || "Class: {classId}").replace(
                  "{classId}",
                  classId
                )}
              </Badge>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={generateNewQR}
                disabled={isGenerating}
              >
                <RefreshCw className="me-2 h-4 w-4" />
                {t?.refresh || "Refresh"}
              </Button>
              <Button size="sm" variant="outline" onClick={toggleFullscreen}>
                <Maximize2 className="me-2 h-4 w-4" />
                {t?.fullscreen || "Fullscreen"}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={downloadQR}>
                <Download className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={shareQR}>
                <Share2 className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={copyQRData}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle>{t?.configTitle || "QR Code Configuration"}</CardTitle>
            <CardDescription>
              {t?.configDescription ||
                "Customize security and validation settings"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Refresh Interval */}
            <div className="space-y-2">
              <Label>{t?.refreshInterval || "Refresh Interval"}</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[config.refreshInterval]}
                  onValueChange={([value]) =>
                    setConfig((prev) => ({ ...prev, refreshInterval: value }))
                  }
                  min={30}
                  max={300}
                  step={30}
                  className="flex-1"
                />
                <span className="w-16 font-mono text-sm">
                  {config.refreshInterval}
                  {secUnit}
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                {t?.refreshIntervalDesc ||
                  "How often to generate a new QR code"}
              </p>
            </div>

            {/* Validity Period */}
            <div className="space-y-2">
              <Label>{t?.validityPeriod || "Validity Period"}</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[config.validityPeriod]}
                  onValueChange={([value]) =>
                    setConfig((prev) => ({ ...prev, validityPeriod: value }))
                  }
                  min={30}
                  max={600}
                  step={30}
                  className="flex-1"
                />
                <span className="w-16 font-mono text-sm">
                  {config.validityPeriod}
                  {secUnit}
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                {t?.validityPeriodDesc || "How long each QR code remains valid"}
              </p>
            </div>

            {/* Security Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>
                    {t?.requireStudentAuth || "Require Student Authentication"}
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    {t?.requireStudentAuthDesc ||
                      "Students must be logged in to scan"}
                  </p>
                </div>
                <Switch
                  checked={config.requireStudentAuth}
                  onCheckedChange={(checked) =>
                    setConfig((prev) => ({
                      ...prev,
                      requireStudentAuth: checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>
                    {t?.includeLocation || "Include Location Verification"}
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    {t?.includeLocationDesc ||
                      "Verify student location when scanning"}
                  </p>
                </div>
                <Switch
                  checked={config.includeLocation}
                  onCheckedChange={(checked) =>
                    setConfig((prev) => ({ ...prev, includeLocation: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>
                    {t?.preventScreenshotSharing ||
                      "Prevent Screenshot Sharing"}
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    {t?.preventScreenshotSharingDesc ||
                      "Add visual protection against screenshots"}
                  </p>
                </div>
                <Switch
                  checked={config.preventScreenshot}
                  onCheckedChange={(checked) =>
                    setConfig((prev) => ({
                      ...prev,
                      preventScreenshot: checked,
                    }))
                  }
                />
              </div>
            </div>

            {/* Apply Button */}
            <Button className="w-full" onClick={generateNewQR}>
              <Settings className="me-2 h-4 w-4" />
              {t?.applyAndGenerate || "Apply Changes & Generate New QR"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {showFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-background/95 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
            onClick={toggleFullscreen}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                className="absolute end-0 top-0"
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
              >
                <Eye className="h-4 w-4" />
              </Button>

              <div className="flex flex-col items-center space-y-4">
                <h3 className="text-2xl font-bold">
                  {t?.scanToMarkAttendance || "Scan to Mark Attendance"}
                </h3>
                <div className="rounded-lg bg-white p-8 shadow-2xl">
                  <canvas
                    ref={canvasRef}
                    style={{ width: "500px", height: "500px" }}
                  />
                </div>
                <div className="space-y-2 text-center">
                  <p className="text-lg">
                    {(t?.classLabel || "Class: {classId}").replace(
                      "{classId}",
                      classId
                    )}
                  </p>
                  <Badge variant="secondary" className="px-4 py-2 text-lg">
                    <Clock className="me-2 h-4 w-4" />
                    {(
                      t?.expiresInSeconds || "Expires in {seconds} seconds"
                    ).replace("{seconds}", timeLeft.toString())}
                  </Badge>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
