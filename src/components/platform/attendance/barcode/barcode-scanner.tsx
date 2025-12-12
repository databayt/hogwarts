"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Quagga from '@ericblade/quagga2';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Barcode, Camera, CameraOff, CircleCheck, CircleAlert, LoaderCircle, Upload, Keyboard, Volume2, VolumeX } from "lucide-react";
import { useCamera } from '../shared/hooks';
import { processBarcodeScan } from './actions';
import type { Dictionary } from '@/components/internationalization/dictionaries';

interface BarcodeScannerProps {
  classId: string;
  onScanSuccess?: (data: any) => void;
  onScanError?: (error: string) => void;
  dictionary?: Dictionary;
  locale?: string;
}

export function BarcodeScanner({
  classId,
  onScanSuccess,
  onScanError,
  dictionary,
  locale = 'en'
}: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('camera');
  const [barcodeFormat, setBarcodeFormat] = useState('auto');
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const { hasPermission, requestPermission } = useCamera();

  // Initialize scanner
  const initScanner = useCallback(() => {
    if (!scannerRef.current || !scanning) return;

    const config: any = {
      inputStream: {
        type: 'LiveStream',
        target: scannerRef.current,
        constraints: {
          width: { min: 640 },
          height: { min: 480 },
          facingMode: 'environment'
        }
      },
      locator: {
        patchSize: 'medium',
        halfSample: true
      },
      numOfWorkers: navigator.hardwareConcurrency || 4,
      frequency: 10,
      decoder: {
        readers: barcodeFormat === 'auto' ? [
          'code_128_reader',
          'ean_reader',
          'ean_8_reader',
          'code_39_reader',
          'code_39_vin_reader',
          'codabar_reader',
          'upc_reader',
          'upc_e_reader',
          'i2of5_reader',
          '2of5_reader',
          'code_93_reader'
        ] : [`${barcodeFormat}_reader`]
      },
      locate: true
    };

    Quagga.init(config, (err) => {
      if (err) {
        console.error('Quagga init error:', err);
        toast({
          title: "Scanner Error",
          description: "Failed to initialize barcode scanner"
        });
        return;
      }

      Quagga.start();
    });

    // Set up event handlers
    Quagga.onDetected(handleDetected);
    Quagga.onProcessed(handleProcessed);
  }, [scanning, barcodeFormat]);

  // Handle barcode detection
  const handleDetected = useCallback(async (result: any) => {
    const code = result.codeResult.code;

    // Prevent duplicate scans
    if (code === lastScan || processing) return;

    setLastScan(code);
    setProcessing(true);

    // Play sound if enabled
    if (soundEnabled) {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDGH0fPTgjMGHmm97OihUBELUqzn5a5fFwhBm9/0sFkUDD+Z2/TMeSwGI3fH8N+RQAoUXrTp66hVFApGnt/yvmwhBDCG0fPTgjQGHGq+7OihUBELUqzn5a5fFghBmd/0sVkUDD+Z2/TMeSwGI3fH8N+RQAoUXrTp66hVFApGnt/yvmwhBDCG0fPTgjQGHWm97OihUBELUqzn5a5fFghBmd/0sVkUDD+Z2/TMeSwGI3fH8N+RQAoUXrTp66hVFApGnt/yvmwhBDCG0fPTgjQGHWm97OihUBELUqzn5a5fFghBmd/0sVkUDD+Z2/TMeSwGI3fH8N+RQAoUXrTp66hVFApGnt/yvmwhBDCG0fPTgjQGHWm97OihUBELUqzn5a5fFggUDD+Z2/TMeSwGI3fH8N+RQAoUXrTp66hVFApGnt/yv2wiBDCG0fPTgzQHHGi97OihURMMUqvm5bBdGQ1BnN/0sVkUDT+Y2vPKdykFI3fH8N+RQAoUXrTp66hVFApGnt/yv2wiBDCG0fPTgzQHHGi97OihURMMUqvm5bBdGQ1BnN/0sVkUDT+Y2vPKdykFI3fH8N+RQAoUXrTp66hVFApGnt/yv2wiBDCG0fPTgzQHHGi97OihURMMUqvm5bBdGQ1BnN/0sVkUDT+Y2vPKdykFI3fH8N+RQAoUXrTp66hVFApGnt/yv2wiBDCG0fPTgzQHHGi97OihURMMUqvm5bBdGQ1BnN/0sVkUDT+Y2vPKdykFI3fH8N+RQAoUXrTp66hVFApGnt/yv2wiBDCG0fPTgzQHHGi97OihURMMUqvm5bBdGQ1BnN/0sVkUDT+Y2vPKdykGI3fH8N+RQAoUXrTp66hVFApGnt/yv2wiBDCG0fPTgzQHHGi97OihURMMUqvm5bBdGQ1BnN/0sVkUDT+Y2vPKdykGI3fH8N+RQAoUXrTp66hVFApGnt/yv2wiBDCG0fPTgzQHHGi97OihURMMUqvm5bBdGQ1BnN/0sVkUDT+Y2vPKdykGI3fG8N+RQAoUXrTp66hVFApGnt/yv2wiBDCG0fPTgzQHHGi97OihURELUqvm5bBdGQ1BnN/0sVkUDT+Y2vPKdykGI3fG8N+RQAoUXrTp66hVFApGnt/yv2wiBDCG0fPTgzQHHGi97OihURELUqvm5bBdGQ1BnN/0sVkUDT+Y2vPKdykGI3fG8N+RQAoUXrTp66hVFApGnt/yv2wiBDCG0fPTgzQHHGi97OihURELUqvm5bBdGQ1BnN/0sVkUDT+Y2vPKdykGI3fG8N+RQAoUXrTp66hVFApGnt/yv2wiBDCF0fPTgzQGHWi97OigURELUqvl5bBdGQ1BnN/0sVkUDT+Y2vPKdykGI3fG8N+RQAoVXbPp66hVFApFnt/yv2wiBDCF0fPTgzQGHWi97OigURELUqvl5bBdGQ1CnN70sVkUDT+Y2vPKdykGI3fG8N+RQAoVXbPp66hVFApFnt/yv2wiBDCF0fPTgzQGHWi97OigURELUqvl5bBdGQ1CnN70sVkUDT+Y2vPKdykGI3fG8N6RQAoVXbPp66hVFApFnt/yv2wiBDCF0fPTgzQGHWi97OigURELUqvl5bBdGQ1CnN70sVkUDT+Y2vPKdykGI3fG8N6RQAoVXbPp66hVFApFnt/yv2wiBDCF0fPSgzQGHWi97OigURELUqvl5bBdGQ1CnN70sVkUDT+Y2vPKdykGI3fG8N6RQAoVXbPp66hVFApFnt/yv2wiBDCF0fPSgzQGHWi97OigUREL');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    }

    try {
      // Call server action to process barcode scan
      // Server action handles authentication, finds student by barcode, and marks attendance
      const scanResult = await processBarcodeScan({
        barcode: code,
        classId,
        scannedAt: new Date().toISOString(),
        deviceId: navigator.userAgent
      });

      if (!scanResult.success) {
        throw new Error(scanResult.error || 'Failed to process barcode');
      }

      setScanResult({
        success: true,
        message: `Attendance marked for ${scanResult.studentName || 'Student'}`
      });

      toast({
        title: "Success",
        description: `Attendance marked for ${scanResult.studentName || code}`,
      });

      onScanSuccess?.({
        barcode: code,
        studentId: scanResult.studentId,
        studentName: scanResult.studentName
      });

      // Reset after 2 seconds
      setTimeout(() => {
        setLastScan(null);
        setScanResult(null);
      }, 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process barcode';

      setScanResult({
        success: false,
        message
      });

      toast({
        title: "Scan Failed",
        description: message
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
  }, [classId, lastScan, processing, soundEnabled, onScanSuccess, onScanError]);

  // Handle processed frames (for UI feedback)
  const handleProcessed = (result: any) => {
    if (!result) return;

    const drawingCtx = Quagga.canvas.ctx.overlay;
    const drawingCanvas = Quagga.canvas.dom.overlay;

    if (!drawingCtx || !drawingCanvas) return;

    if (result.boxes) {
      drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);

      result.boxes
        .filter((box: any) => box !== result.box)
        .forEach((box: any) => {
          Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, {
            color: 'green',
            lineWidth: 2
          });
        });
    }

    if (result.box) {
      Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, {
        color: '#00F',
        lineWidth: 2
      });
    }

    if (result.codeResult && result.codeResult.code) {
      Quagga.ImageDebug.drawPath(result.line, { x: 'x', y: 'y' }, drawingCtx, {
        color: 'red',
        lineWidth: 3
      });
    }
  };

  // Start scanning
  const startScanning = async () => {
    if (hasPermission === false) {
      await requestPermission();
    }
    setScanning(true);
  };

  // Stop scanning
  const stopScanning = () => {
    if (scanning) {
      Quagga.stop();
      setScanning(false);
      setLastScan(null);
      setScanResult(null);
    }
  };

  // Handle manual barcode input
  const handleManualSubmit = async () => {
    if (!manualInput.trim()) return;

    setProcessing(true);

    try {
      // Call server action to process barcode scan
      // Server action handles authentication, finds student by barcode, and marks attendance
      const result = await processBarcodeScan({
        barcode: manualInput,
        classId,
        scannedAt: new Date().toISOString(),
        deviceId: navigator.userAgent
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to process barcode');
      }

      toast({
        title: "Success",
        description: `Attendance marked for ${result.studentName || manualInput}`,
      });

      setManualInput('');
      onScanSuccess?.({
        barcode: manualInput,
        studentId: result.studentId,
        studentName: result.studentName
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process barcode';
      toast({
        title: "Error",
        description: message
      });
      onScanError?.(message);
    } finally {
      setProcessing(false);
    }
  };

  // Initialize scanner when scanning starts
  useEffect(() => {
    if (scanning) {
      initScanner();
    }

    return () => {
      if (scanning) {
        Quagga.stop();
      }
    };
  }, [scanning, initScanner]);

  return (
    <div className="space-y-4">
      {/* Scanner Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Barcode Scanner</CardTitle>
              <CardDescription>
                Scan student ID cards to mark attendance
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </Button>
              <Select value={barcodeFormat} onValueChange={setBarcodeFormat}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto Detect</SelectItem>
                  <SelectItem value="code_128">CODE 128</SelectItem>
                  <SelectItem value="ean">EAN-13</SelectItem>
                  <SelectItem value="ean_8">EAN-8</SelectItem>
                  <SelectItem value="code_39">CODE 39</SelectItem>
                  <SelectItem value="upc">UPC-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={scanMode === 'camera' ? 'default' : 'outline'}
              onClick={() => setScanMode('camera')}
              className="flex-1"
            >
              <Camera className="h-4 w-4 mr-2" />
              Camera Scan
            </Button>
            <Button
              variant={scanMode === 'manual' ? 'default' : 'outline'}
              onClick={() => setScanMode('manual')}
              className="flex-1"
            >
              <Keyboard className="h-4 w-4 mr-2" />
              Manual Entry
            </Button>
          </div>

          {/* Camera Scanner */}
          {scanMode === 'camera' && (
            <div className="space-y-4">
              <div className="relative aspect-video max-w-2xl mx-auto rounded-lg overflow-hidden bg-secondary">
                <div ref={scannerRef} className={scanning ? 'block' : 'hidden'} />

                {!scanning && (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <Barcode className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Camera is not active
                    </p>
                    <Button onClick={startScanning}>
                      <Camera className="h-4 w-4 mr-2" />
                      Start Scanner
                    </Button>
                  </div>
                )}

                {/* Processing Overlay */}
                {processing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <div className="text-center space-y-2">
                      <LoaderCircle className="h-8 w-8 animate-spin mx-auto" />
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
                          <CircleCheck className="h-16 w-16 text-green-500 mx-auto" />
                          <p className="text-lg font-semibold text-green-600">
                            {scanResult.message}
                          </p>
                        </>
                      ) : (
                        <>
                          <CircleAlert className="h-16 w-16 text-red-500 mx-auto" />
                          <p className="text-lg font-semibold text-red-600">
                            {scanResult.message}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {scanning && (
                <div className="flex justify-center">
                  <Button
                    variant="destructive"
                    onClick={stopScanning}
                  >
                    <CameraOff className="h-4 w-4 mr-2" />
                    Stop Scanner
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Manual Entry */}
          {scanMode === 'manual' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter barcode number..."
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleManualSubmit();
                    }
                  }}
                  disabled={processing}
                />
                <Button
                  onClick={handleManualSubmit}
                  disabled={!manualInput.trim() || processing}
                >
                  {processing ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    'Submit'
                  )}
                </Button>
              </div>

              {/* Common Formats Help */}
              <Alert>
                <CircleAlert className="h-4 w-4" />
                <AlertTitle>Barcode Formats</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 space-y-1 text-xs">
                    <p><strong>CODE-128:</strong> ABC-123456789</p>
                    <p><strong>EAN-13:</strong> 1234567890123</p>
                    <p><strong>CODE-39:</strong> *ABC123*</p>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Last Scanned */}
          {lastScan && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
              <div>
                <p className="text-sm text-muted-foreground">Last Scanned</p>
                <p className="font-mono font-medium">{lastScan}</p>
              </div>
              <Badge variant="outline">
                <CircleCheck className="h-3 w-3 mr-1" />
                Processed
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Scanning Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="font-semibold text-primary">1.</span>
              <span>Hold the barcode steady within the camera frame</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-primary">2.</span>
              <span>Ensure good lighting and the barcode is not damaged</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-primary">3.</span>
              <span>Wait for the beep sound and confirmation message</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-primary">4.</span>
              <span>For manual entry, type the barcode number and press Enter</span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}