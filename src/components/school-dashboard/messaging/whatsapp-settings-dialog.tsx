"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { Loader2, QrCode, Unplug, Wifi, WifiOff } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import {
  connectWhatsApp,
  disconnectWhatsApp,
  refreshConnectionStatus,
} from "../whatsapp/actions"
import type { WhatsAppSessionDTO } from "../whatsapp/types"

interface WhatsAppSettingsDialogProps {
  session: WhatsAppSessionDTO | null
  children: React.ReactNode
}

export function WhatsAppSettingsDialog({
  session,
  children,
}: WhatsAppSettingsDialogProps) {
  const { dictionary } = useDictionary()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = (dictionary?.school as any)?.whatsapp as
    | Record<string, any>
    | undefined

  const [isPending, startTransition] = useTransition()
  const [qrCode, setQrCode] = useState<string | null>(session?.qrCode ?? null)
  const [status, setStatus] = useState<string>(
    session?.status ?? "disconnected"
  )
  const [phoneNumber, setPhoneNumber] = useState<string | null>(
    session?.phoneNumber ?? null
  )
  const [connectedAt, setConnectedAt] = useState<string | null>(
    session?.connectedAt ?? null
  )
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isConnected = status === "connected"
  const isQrPending = status === "qr_pending"

  // Poll for connection status while QR is showing
  useEffect(() => {
    if (isQrPending && qrCode) {
      pollIntervalRef.current = setInterval(() => {
        refreshConnectionStatus().then((result) => {
          if (result.success && result.data) {
            setStatus(result.data.status)
            if (result.data.status === "connected") {
              setQrCode(null)
              setConnectedAt(new Date().toISOString())
              toast({
                title: d?.toast?.connected || "WhatsApp connected successfully",
              })
            }
          }
        })
      }, 5000)
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [isQrPending, qrCode, d])

  const handleConnect = useCallback(() => {
    startTransition(async () => {
      const result = await connectWhatsApp()
      if (result.success && result.data) {
        setQrCode(result.data.qrCode)
        setStatus("qr_pending")
        toast({
          title: d?.toast?.scanQr || "Scan the QR code with WhatsApp",
        })
      } else {
        toast({
          title: d?.toast?.connectionFailed || "Failed to connect",
          variant: "destructive",
        })
      }
    })
  }, [d, startTransition])

  const handleDisconnect = useCallback(() => {
    startTransition(async () => {
      const result = await disconnectWhatsApp()
      if (result.success) {
        setStatus("disconnected")
        setQrCode(null)
        setPhoneNumber(null)
        setConnectedAt(null)
        toast({
          title: d?.toast?.disconnected || "WhatsApp disconnected",
        })
      } else {
        toast({
          title: d?.toast?.disconnectFailed || "Failed to disconnect",
          variant: "destructive",
        })
      }
    })
  }, [d, startTransition])

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            {d?.connection?.title || "WhatsApp Connection"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Status badge */}
          <Badge
            variant={isConnected ? "default" : "secondary"}
            className={
              isConnected
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            }
          >
            {isConnected
              ? d?.connection?.statusConnected || "Connected"
              : d?.connection?.statusDisconnected || "Disconnected"}
          </Badge>

          {isConnected ? (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    {d?.connection?.phoneNumber || "Phone Number"}
                  </span>
                  <span className="font-mono text-sm">
                    {phoneNumber || "---"}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    {d?.connection?.connectedSince || "Connected Since"}
                  </span>
                  <span className="text-sm">
                    {connectedAt
                      ? new Date(connectedAt).toLocaleDateString()
                      : "---"}
                  </span>
                </div>
              </div>

              <Button
                variant="destructive"
                onClick={handleDisconnect}
                disabled={isPending}
                className="w-full"
              >
                {isPending ? (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                ) : (
                  <Unplug className="me-2 h-4 w-4" />
                )}
                {d?.connection?.disconnect || "Disconnect"}
              </Button>
            </>
          ) : (
            <>
              {qrCode && isQrPending ? (
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-4 rounded-lg border p-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        qrCode.startsWith("data:")
                          ? qrCode
                          : `data:image/png;base64,${qrCode}`
                      }
                      alt="WhatsApp QR Code"
                      className="h-56 w-56"
                    />
                    <p className="text-muted-foreground text-center text-sm">
                      {d?.connection?.scanInstructions ||
                        "Open WhatsApp on your phone, go to Settings > Linked Devices > Link a Device, and scan this QR code"}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="text-muted-foreground">
                      {d?.connection?.waitingForScan || "Waiting for scan..."}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8">
                  <QrCode className="text-muted-foreground h-12 w-12" />
                  <div className="text-center">
                    <p className="font-medium">
                      {d?.connection?.notConnected || "No WhatsApp connected"}
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {d?.connection?.connectPrompt ||
                        "Connect your WhatsApp to auto-deliver messages"}
                    </p>
                  </div>
                  <Button onClick={handleConnect} disabled={isPending}>
                    {isPending ? (
                      <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    ) : (
                      <QrCode className="me-2 h-4 w-4" />
                    )}
                    {d?.connection?.connect || "Connect WhatsApp"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
