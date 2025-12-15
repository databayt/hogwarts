"use client"

import React, { useCallback, useEffect, useState } from "react"
import { Scanner } from "@yudiel/react-qr-scanner"
import {
  Camera,
  CameraOff,
  CircleAlert,
  CircleCheck,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Scan,
  Upload,
} from "lucide-react"

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

  const { hasPermission, requestPermission } = useCamera()
  const { location, requestLocation } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
  })

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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>QR Code Scanner</CardTitle>
              <CardDescription>
                Position the QR code within the camera frame
              </CardDescription>
            </div>
            {scanning && (
              <Badge variant="secondary" className="animate-pulse">
                <Scan className="mr-1 h-3 w-3" />
                Scanning
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Scanner View */}
          <div className="bg-secondary relative mx-auto aspect-square max-w-md overflow-hidden rounded-lg">
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
                    aspectRatio: 1,
                  }}
                />

                {/* Scanning Overlay */}
                <div className="pointer-events-none absolute inset-0">
                  <div className="border-primary absolute inset-8 rounded-lg border-2" />
                  <div className="border-primary absolute top-8 left-8 h-8 w-8 border-t-4 border-l-4" />
                  <div className="border-primary absolute top-8 right-8 h-8 w-8 border-t-4 border-r-4" />
                  <div className="border-primary absolute bottom-8 left-8 h-8 w-8 border-b-4 border-l-4" />
                  <div className="border-primary absolute right-8 bottom-8 h-8 w-8 border-r-4 border-b-4" />
                </div>

                {/* Processing Overlay */}
                {processing && (
                  <div className="bg-background/80 absolute inset-0 flex items-center justify-center">
                    <div className="space-y-2 text-center">
                      <LoaderCircle className="mx-auto h-8 w-8 animate-spin" />
                      <p className="text-sm font-medium">Processing...</p>
                    </div>
                  </div>
                )}

                {/* Result Overlay */}
                {scanResult && (
                  <div className="bg-background/90 absolute inset-0 flex items-center justify-center">
                    <div className="space-y-3 p-8 text-center">
                      {scanResult.success ? (
                        <>
                          <CircleCheck className="mx-auto h-16 w-16 text-green-500" />
                          <p className="text-lg font-semibold text-green-600">
                            {scanResult.message}
                          </p>
                        </>
                      ) : (
                        <>
                          <CircleAlert className="mx-auto h-16 w-16 text-red-500" />
                          <p className="text-lg font-semibold text-red-600">
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
                <Camera className="text-muted-foreground mb-4 h-16 w-16" />
                <p className="text-muted-foreground mb-4">
                  Camera is not active
                </p>
                <Button onClick={startScanning}>
                  <Camera className="mr-2 h-4 w-4" />
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
                  className="ml-4"
                  onClick={requestPermission}
                >
                  Grant Permission
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Controls */}
          <div className="flex justify-center gap-2">
            {scanning ? (
              <Button variant="destructive" onClick={stopScanning}>
                <CameraOff className="mr-2 h-4 w-4" />
                Stop Scanning
              </Button>
            ) : (
              <Button onClick={startScanning}>
                <Camera className="mr-2 h-4 w-4" />
                Start Scanning
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => document.getElementById("qr-upload")?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Image
            </Button>
            <input
              id="qr-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {/* Location Status */}
          {location && (
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

      {/* Instructions Card */}
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
    </div>
  )
}
