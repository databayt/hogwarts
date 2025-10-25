"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/components/ui/use-toast';
import {
  Scan,
  Camera,
  CameraOff,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Loader2,
  Upload,
  RefreshCw
} from 'lucide-react';
import { useCamera, useGeolocation } from '../shared/hooks';
import { useAttendanceContext } from '../core/attendance-context';
import { validateQRPayload } from '../shared/utils';
import type { Dictionary, QRCodeScanPayload } from '../shared/types';

interface QRScannerProps {
  onScanSuccess?: (data: any) => void;
  onScanError?: (error: string) => void;
  dictionary?: Dictionary;
  locale?: string;
}

export function QRScanner({
  onScanSuccess,
  onScanError,
  dictionary,
  locale = 'en'
}: QRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const { hasPermission, requestPermission } = useCamera();
  const { location, requestLocation } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  });

  const { markAttendance } = useAttendanceContext();

  const handleScan = useCallback(async (result: any) => {
    // Prevent duplicate scans
    const scanData = typeof result === 'string' ? result : result?.text;
    if (!scanData || scanData === lastScan || processing) return;

    setLastScan(scanData);
    setProcessing(true);

    try {
      // Parse QR data
      let qrData;
      try {
        qrData = JSON.parse(scanData);
      } catch {
        throw new Error('Invalid QR code format');
      }

      // Validate QR payload
      const validation = validateQRPayload(qrData.payload);
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid QR code');
      }

      // Check if location is required
      if (qrData.config?.requireLocation) {
        if (!location) {
          requestLocation();
          throw new Error('Location required. Please enable location services.');
        }
      }

      // Prepare scan payload
      const scanPayload: QRCodeScanPayload = {
        code: qrData.payload,
        scannedAt: new Date().toISOString(),
        deviceId: navigator.userAgent,
        location: location ? {
          lat: location.coords.latitude,
          lon: location.coords.longitude
        } : undefined
      };

      // Mark attendance
      await markAttendance({
        classId: validation.classId,
        studentId: 'current-student-id', // This should come from auth context
        status: 'PRESENT',
        method: 'QR_CODE',
        checkInTime: new Date().toISOString(),
        location: scanPayload.location,
        confidence: 1.0
      });

      setScanResult({
        success: true,
        message: 'Attendance marked successfully!'
      });

      toast({
        title: "Success",
        description: "Your attendance has been marked",
      });

      onScanSuccess?.(qrData);

      // Reset after 3 seconds
      setTimeout(() => {
        setLastScan(null);
        setScanResult(null);
      }, 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process QR code';

      setScanResult({
        success: false,
        message
      });

      toast({
        title: "Scan Failed",
        description: message,
        variant: "destructive"
      });

      onScanError?.(message);

      // Reset after 3 seconds
      setTimeout(() => {
        setLastScan(null);
        setScanResult(null);
      }, 3000);
    } finally {
      setProcessing(false);
    }
  }, [lastScan, processing, location, requestLocation, markAttendance, onScanSuccess, onScanError]);

  const startScanning = async () => {
    if (hasPermission === false) {
      await requestPermission();
    }
    setScanning(true);
    setCameraError(null);
  };

  const stopScanning = () => {
    setScanning(false);
    setLastScan(null);
    setScanResult(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      // In production, you would decode the QR from image
      toast({
        title: "File Upload",
        description: "QR code file upload is not yet implemented",
        variant: "default"
      });
    };
    reader.readAsDataURL(file);
  };

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
                <Scan className="h-3 w-3 mr-1" />
                Scanning
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Scanner View */}
          <div className="relative aspect-square max-w-md mx-auto rounded-lg overflow-hidden bg-secondary">
            {scanning ? (
              <>
                <Scanner
                  onScan={handleScan}
                  onError={(error) => {
                    console.error('Scanner error:', error);
                    setCameraError('Camera error. Please try again.');
                  }}
                  constraints={{
                    facingMode: 'environment',
                    aspectRatio: 1
                  }}
                  containerStyle={{
                    width: '100%',
                    height: '100%'
                  }}
                />

                {/* Scanning Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-8 border-2 border-primary rounded-lg" />
                  <div className="absolute top-8 left-8 w-8 h-8 border-t-4 border-l-4 border-primary" />
                  <div className="absolute top-8 right-8 w-8 h-8 border-t-4 border-r-4 border-primary" />
                  <div className="absolute bottom-8 left-8 w-8 h-8 border-b-4 border-l-4 border-primary" />
                  <div className="absolute bottom-8 right-8 w-8 h-8 border-b-4 border-r-4 border-primary" />
                </div>

                {/* Processing Overlay */}
                {processing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <div className="text-center space-y-2">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                      <p className="text-sm font-medium">Processing...</p>
                    </div>
                  </div>
                )}

                {/* Result Overlay */}
                {scanResult && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/90">
                    <div className="text-center space-y-3 p-8">
                      {scanResult.success ? (
                        <>
                          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                          <p className="text-lg font-semibold text-green-600">
                            {scanResult.message}
                          </p>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
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
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Camera className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Camera is not active
                </p>
                <Button onClick={startScanning}>
                  <Camera className="h-4 w-4 mr-2" />
                  Start Camera
                </Button>
              </div>
            )}
          </div>

          {/* Camera Error Alert */}
          {cameraError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Camera Error</AlertTitle>
              <AlertDescription>{cameraError}</AlertDescription>
            </Alert>
          )}

          {/* Permission Alert */}
          {hasPermission === false && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
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
          <div className="flex gap-2 justify-center">
            {scanning ? (
              <Button
                variant="destructive"
                onClick={stopScanning}
              >
                <CameraOff className="h-4 w-4 mr-2" />
                Stop Scanning
              </Button>
            ) : (
              <Button onClick={startScanning}>
                <Camera className="h-4 w-4 mr-2" />
                Start Scanning
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => document.getElementById('qr-upload')?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
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
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>
                Location: {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
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
              <span className="font-semibold text-primary">1.</span>
              <span>Allow camera access when prompted</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-primary">2.</span>
              <span>Position the QR code within the camera frame</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-primary">3.</span>
              <span>Hold steady until the code is recognized</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-primary">4.</span>
              <span>Wait for confirmation that attendance is marked</span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}