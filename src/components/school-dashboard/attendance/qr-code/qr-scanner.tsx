"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { Scanner } from "@yudiel/react-qr-scanner"
import {
  Camera,
  CameraOff,
  CircleAlert,
  CircleCheck,
  LoaderCircle,
  MapPin,
  Maximize2,
  Minimize2,
  RefreshCw,
  Scan,
  Upload,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { useCamera, useGeolocation } from "../shared/hooks"
import type { QRCodeScanPayload } from "../shared/types"
import { validateQRPayload } from "../shared/utils"
import { processQRScan } from "./actions"

interface QRScannerProps {
  onScanSuccess?: (data: any) => void
  onScanError?: (error: string) => void
  dictionary?: Dictionary
  locale?: string
}

// Audio feedback utility
const playSuccessBeep = () => {
  try {
    const audioContext = new (
      window.AudioContext || (window as any).webkitAudioContext
    )()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800 // Higher frequency for success
    oscillator.type = "sine"
    gainNode.gain.value = 0.3

    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.15)
  } catch {
    // Audio not available, silently fail
  }
}

const playErrorBeep = () => {
  try {
    const audioContext = new (
      window.AudioContext || (window as any).webkitAudioContext
    )()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 300 // Lower frequency for error
    oscillator.type = "sine"
    gainNode.gain.value = 0.3

    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.3)
  } catch {
    // Audio not available, silently fail
  }
}

// Haptic feedback utility
const triggerHaptic = (pattern: number | number[]) => {
  if ("vibrate" in navigator) {
    navigator.vibrate(pattern)
  }
}

export function QRScanner({
  onScanSuccess,
  onScanError,
  dictionary,
  locale = "en",
}: QRScannerProps) {
  const [scanning, setScanning] = useState(false)
  const [lastScan, setLastScan] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [scanResult, setScanResult] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const scannerContainerRef = useRef<HTMLDivElement>(null)

  const { hasPermission, requestPermission } = useCamera()
  const { location, requestLocation } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
  })

  // Handle fullscreen mode
  const toggleFullscreen = useCallback(async () => {
    if (!scannerContainerRef.current) return

    try {
      if (!document.fullscreenElement) {
        await scannerContainerRef.current.requestFullscreen()
        setIsFullscreen(true)
        // Lock orientation to portrait on mobile
        const orientation = screen.orientation as ScreenOrientation & {
          lock?: (orientation: string) => Promise<void>
        }
        if (orientation?.lock) {
          try {
            await orientation.lock("portrait")
          } catch {
            // Orientation lock not supported
          }
        }
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch {
      // Fullscreen not supported
    }
  }, [])

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  const handleScan = useCallback(
    async (result: any) => {
      // Prevent duplicate scans
      const scanData = typeof result === "string" ? result : result?.text
      if (!scanData || scanData === lastScan || processing) return

      setLastScan(scanData)
      setProcessing(true)

      try {
        // Parse QR data
        let qrData
        try {
          qrData = JSON.parse(scanData)
        } catch {
          throw new Error("Invalid QR code format")
        }

        // Validate QR payload
        const validation = validateQRPayload(qrData.payload)
        if (!validation.valid) {
          throw new Error(validation.error || "Invalid QR code")
        }

        // Check if location is required
        if (qrData.config?.requireLocation) {
          if (!location) {
            requestLocation()
            throw new Error(
              "Location required. Please enable location services."
            )
          }
        }

        // Prepare scan payload
        const scanPayload: QRCodeScanPayload = {
          code: qrData.payload,
          scannedAt: new Date().toISOString(),
          deviceId: navigator.userAgent,
          location: location
            ? {
                lat: location.coords.latitude,
                lon: location.coords.longitude,
              }
            : undefined,
        }

        // Call server action to process QR scan
        // Server action handles authentication and gets studentId from session
        const result = await processQRScan({
          code: scanData,
          scannedAt: new Date().toISOString(),
          deviceId: navigator.userAgent,
          location: scanPayload.location,
        })

        if (!result.success) {
          throw new Error(result.error || "Failed to process QR scan")
        }

        // Success feedback: haptic + audio
        triggerHaptic(200) // Short vibration
        playSuccessBeep()

        setScanResult({
          success: true,
          message: "Attendance marked successfully!",
        })

        toast({
          title: "Success",
          description: "Your attendance has been marked",
        })

        onScanSuccess?.(qrData)

        // Reset after 3 seconds
        setTimeout(() => {
          setLastScan(null)
          setScanResult(null)
        }, 3000)
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to process QR code"

        // Error feedback: double vibration + low beep
        triggerHaptic([100, 50, 100])
        playErrorBeep()

        setScanResult({
          success: false,
          message,
        })

        toast({
          title: "Scan Failed",
          description: message,
        })

        onScanError?.(message)

        // Reset after 3 seconds
        setTimeout(() => {
          setLastScan(null)
          setScanResult(null)
        }, 3000)
      } finally {
        setProcessing(false)
      }
    },
    [
      lastScan,
      processing,
      location,
      requestLocation,
      onScanSuccess,
      onScanError,
    ]
  )

  const startScanning = async () => {
    if (hasPermission === false) {
      await requestPermission()
    }
    setScanning(true)
    setCameraError(null)
  }

  const stopScanning = () => {
    setScanning(false)
    setLastScan(null)
    setScanResult(null)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      // In production, you would decode the QR from image
      toast({
        title: "File Upload",
        description: "QR code file upload is not yet implemented",
      })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-4">
      {/* Scanner Card */}
      <Card
        ref={scannerContainerRef}
        className={cn(
          "transition-all duration-300",
          isFullscreen && "fixed inset-0 z-50 rounded-none border-0"
        )}
      >
        <CardHeader className={cn(isFullscreen && "bg-background/90 py-3")}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>QR Code Scanner</CardTitle>
              {!isFullscreen && (
                <CardDescription>
                  Position the QR code within the camera frame
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              {scanning && (
                <Badge variant="secondary" className="animate-pulse">
                  <Scan className="me-1 h-3 w-3" />
                  Scanning
                </Badge>
              )}
              {/* Fullscreen toggle for mobile */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="h-8 w-8"
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen mode"}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent
          className={cn("space-y-4", isFullscreen && "flex-1 px-2 py-2")}
        >
          {/* Scanner View - Mobile optimized with larger touch targets */}
          <div
            className={cn(
              "bg-secondary relative mx-auto overflow-hidden rounded-lg",
              isFullscreen
                ? "aspect-auto h-[calc(100vh-180px)] w-full"
                : "aspect-square max-w-md"
            )}
          >
            {scanning ? (
              <>
                <Scanner
                  onScan={handleScan}
                  onError={(error) => {
                    console.error("Scanner error:", error)
                    setCameraError("Camera error. Please try again.")
                  }}
                  constraints={{
                    facingMode: "environment",
                    aspectRatio: isFullscreen ? undefined : 1,
                  }}
                />

                {/* Scanning Overlay with animated scan line */}
                <div className="pointer-events-none absolute inset-0">
                  {/* Corner markers - larger for mobile visibility */}
                  <div className="border-primary absolute inset-8 rounded-lg border-2" />
                  <div className="border-primary absolute top-8 left-8 h-10 w-10 border-s-4 border-t-4 sm:h-8 sm:w-8" />
                  <div className="border-primary absolute top-8 right-8 h-10 w-10 border-e-4 border-t-4 sm:h-8 sm:w-8" />
                  <div className="border-primary absolute bottom-8 left-8 h-10 w-10 border-s-4 border-b-4 sm:h-8 sm:w-8" />
                  <div className="border-primary absolute right-8 bottom-8 h-10 w-10 border-e-4 border-b-4 sm:h-8 sm:w-8" />

                  {/* Animated scan line */}
                  <div
                    className="bg-primary/50 absolute right-8 left-8 h-0.5 animate-pulse"
                    style={{
                      top: "50%",
                      animation: "scan-line 2s ease-in-out infinite",
                    }}
                  />
                </div>

                {/* Processing Overlay */}
                {processing && (
                  <div className="bg-background/80 absolute inset-0 flex items-center justify-center">
                    <div className="space-y-3 text-center">
                      <LoaderCircle className="mx-auto h-12 w-12 animate-spin sm:h-8 sm:w-8" />
                      <p className="text-base font-medium sm:text-sm">
                        Processing...
                      </p>
                    </div>
                  </div>
                )}

                {/* Result Overlay - Larger for mobile */}
                {scanResult && (
                  <div className="bg-background/95 absolute inset-0 flex items-center justify-center">
                    <div className="space-y-4 p-8 text-center sm:space-y-3">
                      {scanResult.success ? (
                        <>
                          <CircleCheck className="mx-auto h-24 w-24 text-green-500 sm:h-16 sm:w-16" />
                          <p className="text-xl font-semibold text-green-600 sm:text-lg">
                            {scanResult.message}
                          </p>
                        </>
                      ) : (
                        <>
                          <CircleAlert className="mx-auto h-24 w-24 text-red-500 sm:h-16 sm:w-16" />
                          <p className="text-xl font-semibold text-red-600 sm:text-lg">
                            {scanResult.message}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <Camera className="text-muted-foreground mb-4 h-20 w-20 sm:h-16 sm:w-16" />
                <p className="text-muted-foreground mb-4 text-lg sm:text-base">
                  Camera is not active
                </p>
                {/* Large touch-friendly button for mobile */}
                <Button
                  onClick={startScanning}
                  size="lg"
                  className="h-14 px-8 text-lg sm:h-10 sm:px-4 sm:text-sm"
                >
                  <Camera className="me-2 h-5 w-5" />
                  Start Camera
                </Button>
              </div>
            )}
          </div>

          {/* Camera Error Alert */}
          {cameraError && (
            <Alert variant="destructive">
              <CircleAlert className="h-4 w-4" />
              <AlertTitle>Camera Error</AlertTitle>
              <AlertDescription>{cameraError}</AlertDescription>
            </Alert>
          )}

          {/* Permission Alert */}
          {hasPermission === false && (
            <Alert>
              <CircleAlert className="h-4 w-4" />
              <AlertTitle>Camera Permission Required</AlertTitle>
              <AlertDescription>
                Please allow camera access to scan QR codes.
                <Button
                  size="sm"
                  variant="outline"
                  className="ms-4"
                  onClick={requestPermission}
                >
                  Grant Permission
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Controls - Mobile optimized with larger touch targets */}
          <div
            className={cn(
              "flex flex-wrap justify-center gap-2",
              isFullscreen && "fixed right-4 bottom-4 left-4 z-50"
            )}
          >
            {scanning ? (
              <Button
                variant="destructive"
                onClick={stopScanning}
                size="lg"
                className="h-12 flex-1 px-6 text-base sm:h-10 sm:flex-none sm:px-4 sm:text-sm"
              >
                <CameraOff className="me-2 h-5 w-5" />
                Stop
              </Button>
            ) : (
              <Button
                onClick={startScanning}
                size="lg"
                className="h-12 flex-1 px-6 text-base sm:h-10 sm:flex-none sm:px-4 sm:text-sm"
              >
                <Camera className="me-2 h-5 w-5" />
                Scan
              </Button>
            )}
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-6 text-base sm:h-10 sm:px-4 sm:text-sm"
              onClick={() => document.getElementById("qr-upload")?.click()}
            >
              <Upload className="me-2 h-5 w-5" />
              Upload
            </Button>
            {isFullscreen && (
              <Button
                variant="secondary"
                size="lg"
                className="h-12 px-6 text-base sm:h-10 sm:px-4 sm:text-sm"
                onClick={toggleFullscreen}
              >
                <Minimize2 className="me-2 h-5 w-5" />
                Exit
              </Button>
            )}
            <input
              id="qr-upload"
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {/* Location Status */}
          {location && !isFullscreen && (
            <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
              <MapPin className="h-3 w-3" />
              <span>
                Location: {location.coords.latitude.toFixed(4)},{" "}
                {location.coords.longitude.toFixed(4)}
              </span>
              <span className="text-xs">
                (Accuracy: {location.coords.accuracy.toFixed(0)}m)
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions Card - Hidden in fullscreen */}
      {!isFullscreen && (
        <Card>
          <CardHeader>
            <CardTitle>Scanning Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary font-semibold">1.</span>
                <span>Allow camera access when prompted</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-semibold">2.</span>
                <span>Position the QR code within the camera frame</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-semibold">3.</span>
                <span>Hold steady until the code is recognized</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-semibold">4.</span>
                <span>Wait for confirmation that attendance is marked</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
