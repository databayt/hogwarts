"use client"

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
        throw new Error(result.error || "Failed to generate QR code")
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
        title: "QR Code Generated",
        description: `Valid for ${expiresIn} seconds. Stored in database.`,
      })
    } catch (error) {
      toast({
        title: "Generation Failed",
        description:
          error instanceof Error ? error.message : "Failed to generate QR code",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }, [classId, config, resetTimer])

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
      title: "Downloaded",
      description: "QR code saved to your device",
    })
  }

  const copyQRData = () => {
    navigator.clipboard.writeText(qrData)
    toast({
      title: "Copied",
      description: "QR data copied to clipboard",
    })
  }

  const shareQR = async () => {
    if (!navigator.share) {
      toast({
        title: "Not Supported",
        description: "Sharing is not supported on this device",
      })
      return
    }

    try {
      // Convert canvas to blob
      const response = await fetch(qrCode)
      const blob = await response.blob()
      const file = new File([blob], "attendance-qr.png", { type: "image/png" })

      await navigator.share({
        title: "Attendance QR Code",
        text: `Scan this QR code to mark attendance for class ${classId}`,
        files: [file],
      })
    } catch (error) {
      console.error("Share failed:", error)
    }
  }

  const toggleFullscreen = () => {
    setShowFullscreen(!showFullscreen)
  }

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        {/* QR Code Display */}
        <Card className="relative overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Active QR Code</CardTitle>
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
                <Clock className="mr-1 h-3 w-3" />
                {timeLeft}s
              </Badge>
            </div>
            <CardDescription>
              Students scan this code to mark attendance
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {/* Security Overlay (if enabled) */}
            {config.preventScreenshot && (
              <div className="pointer-events-none absolute inset-0 z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/10" />
                <div className="absolute top-4 right-4">
                  <Badge variant="outline" className="bg-background">
                    <Shield className="mr-1 h-3 w-3" />
                    Protected
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
                  <CircleCheck className="mr-1 h-3 w-3" />
                  Auth Required
                </Badge>
              )}
              {config.includeLocation && (
                <Badge variant="outline">
                  <MapPin className="mr-1 h-3 w-3" />
                  Location Tracked
                </Badge>
              )}
              <Badge variant="outline">
                <QrCode className="mr-1 h-3 w-3" />
                Class: {classId}
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
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button size="sm" variant="outline" onClick={toggleFullscreen}>
                <Maximize2 className="mr-2 h-4 w-4" />
                Fullscreen
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
            <CardTitle>QR Code Configuration</CardTitle>
            <CardDescription>
              Customize security and validation settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Refresh Interval */}
            <div className="space-y-2">
              <Label>Refresh Interval</Label>
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
                  {config.refreshInterval}s
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                How often to generate a new QR code
              </p>
            </div>

            {/* Validity Period */}
            <div className="space-y-2">
              <Label>Validity Period</Label>
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
                  {config.validityPeriod}s
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                How long each QR code remains valid
              </p>
            </div>

            {/* Security Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Student Authentication</Label>
                  <p className="text-muted-foreground text-xs">
                    Students must be logged in to scan
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
                  <Label>Include Location Verification</Label>
                  <p className="text-muted-foreground text-xs">
                    Verify student location when scanning
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
                  <Label>Prevent Screenshot Sharing</Label>
                  <p className="text-muted-foreground text-xs">
                    Add visual protection against screenshots
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
              <Settings className="mr-2 h-4 w-4" />
              Apply Changes & Generate New QR
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
                className="absolute top-0 right-0"
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
              >
                <Eye className="h-4 w-4" />
              </Button>

              <div className="flex flex-col items-center space-y-4">
                <h3 className="text-2xl font-bold">Scan to Mark Attendance</h3>
                <div className="rounded-lg bg-white p-8 shadow-2xl">
                  <canvas
                    ref={canvasRef}
                    style={{ width: "500px", height: "500px" }}
                  />
                </div>
                <div className="space-y-2 text-center">
                  <p className="text-lg">Class: {classId}</p>
                  <Badge variant="secondary" className="px-4 py-2 text-lg">
                    <Clock className="mr-2 h-4 w-4" />
                    Expires in {timeLeft} seconds
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
