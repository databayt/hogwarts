"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { useLocalParticipant } from "@livekit/components-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { apkUrlFor, buildIntentUrl, subdomainOf } from "../android-app"
import { noteTrace } from "./connection-trace"
import type { RoomLabels } from "./labels"
import { detectBrowser, stepsFor, type DeviceKind } from "./permission-steps"
import { useMediaPermission } from "./use-media-permission"

export type DeviceFailure = "denied" | "missing" | "in-use" | "failed"

/** Which way a microphone or camera start failed, from the browser's error. */
export function deviceFailureKind(e: Error): DeviceFailure {
  if (e.name === "NotAllowedError" || e.name === "SecurityError") return "denied"
  if (e.name === "NotFoundError" || e.name === "OverconstrainedError")
    return "missing"
  if (e.name === "NotReadableError" || e.name === "AbortError") return "in-use"
  return "failed"
}

/**
 * The words for a failed device. Inside WhatsApp's or Facebook's browser there
 * is no microphone or camera at all, so say where to open the class.
 */
export function deviceErrorMessage(
  kind: DeviceFailure,
  device: DeviceKind,
  labels: RoomLabels,
  ua: string = typeof navigator === "undefined" ? "" : navigator.userAgent
): string {
  if (detectBrowser(ua) === "in-app") return labels.micInAppBrowser
  const text =
    kind === "denied"
      ? labels.deviceDenied
      : kind === "missing"
        ? labels.deviceMissing
        : kind === "in-use"
          ? labels.deviceInUse
          : labels.deviceFailed
  return text.replace(
    "{device}",
    device === "mic" ? labels.deviceMic : labels.deviceCamera
  )
}

type Notice = { text: string; ok: boolean }

type Ctx = {
  /** A device start failed (join or tap). Denied opens the guide. */
  report: (device: DeviceKind, kind: DeviceFailure) => void
  blocked: Record<DeviceKind, boolean>
  cleared: (device: DeviceKind) => void
  notify: (notice: Notice) => void
}

const GuideCtx = createContext<Ctx | null>(null)

export function useDeviceFailure() {
  return useContext(GuideCtx)
}

/**
 * Owns everything about a blocked microphone/camera: the step-by-step dialog,
 * the chip that reopens it, and the short notice for the other failures. Wrap
 * the room with it; mount <PermissionWatcher/> inside the LiveKit room.
 */
export function PermissionGuideProvider({
  labels,
  locale,
  children,
}: {
  labels: RoomLabels
  locale: string
  children: ReactNode
}) {
  const [blocked, setBlocked] = useState<Record<DeviceKind, boolean>>({
    mic: false,
    camera: false,
  })
  const [open, setOpen] = useState<DeviceKind | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)

  const report = useCallback(
    (device: DeviceKind, kind: DeviceFailure) => {
      noteTrace(device, kind)
      if (kind === "denied") {
        setBlocked((b) => ({ ...b, [device]: true }))
        // Both blocked: the mic's guide first — a class can run without the camera.
        setOpen((o) => (o === "mic" && device === "camera" ? "mic" : device))
        return
      }
      setNotice({ text: deviceErrorMessage(kind, device, labels), ok: false })
    },
    [labels]
  )
  const cleared = useCallback((device: DeviceKind) => {
    setBlocked((b) => ({ ...b, [device]: false }))
    setOpen((o) => (o === device ? null : o))
  }, [])
  const notify = useCallback((n: Notice) => setNotice(n), [])

  useEffect(() => {
    if (!notice?.ok) return
    const t = setTimeout(() => setNotice(null), 4000)
    return () => clearTimeout(t)
  }, [notice])

  const value = useMemo(
    () => ({ report, blocked, cleared, notify }),
    [report, blocked, cleared, notify]
  )
  const dir = locale === "ar" ? "rtl" : "ltr"
  const chips = (["mic", "camera"] as const).filter(
    (d) => blocked[d] && open !== d
  )

  return (
    <GuideCtx.Provider value={value}>
      {children}
      {chips.length > 0 && (
        <div
          dir={dir}
          className="pointer-events-none fixed inset-x-0 top-3 z-40 flex flex-col items-center gap-2"
        >
          {chips.map((d) => (
            <button
              key={d}
              type="button"
              className="pointer-events-auto rounded-full bg-red-600 px-4 py-1.5 text-sm font-medium text-white shadow-lg"
              onClick={() => setOpen(d)}
            >
              {d === "mic" ? labels.permChipMic : labels.permChipCamera}
            </button>
          ))}
        </div>
      )}
      {notice && (
        <div
          dir={dir}
          role={notice.ok ? "status" : "alert"}
          className="bg-background/95 fixed inset-x-4 top-14 z-50 mx-auto flex max-w-md items-start gap-3 rounded-xl border p-3 text-sm shadow-lg"
        >
          <p className="flex-1">{notice.text}</p>
          <button
            type="button"
            className="text-muted-foreground shrink-0 underline"
            onClick={() => setNotice(null)}
          >
            {labels.dismiss}
          </button>
        </div>
      )}
      <PermissionGuide
        device={open}
        labels={labels}
        dir={dir}
        onClose={() => setOpen(null)}
      />
    </GuideCtx.Provider>
  )
}

function PermissionGuide({
  device,
  labels,
  dir,
  onClose,
}: {
  device: DeviceKind | null
  labels: RoomLabels
  dir: "rtl" | "ltr"
  onClose: () => void
}) {
  // Remember the last device so the content does not blank while it fades out.
  const [last, setLast] = useState<DeviceKind>("mic")
  useEffect(() => {
    if (device) setLast(device)
  }, [device])
  const kind = device ?? last
  const [copied, setCopied] = useState(false)

  const ua = typeof navigator === "undefined" ? "" : navigator.userAgent
  const browser = detectBrowser(ua)
  const isAndroid = /Android/i.test(ua)
  const name = kind === "mic" ? labels.deviceMic : labels.deviceCamera
  const steps = stepsFor(browser, kind).map((key) =>
    (labels as unknown as Record<string, string>)[key].replace("{device}", name)
  )
  const intent =
    isAndroid && typeof location !== "undefined"
      ? buildIntentUrl(
          location.host,
          location.pathname + location.search,
          apkUrlFor(subdomainOf(location.host))
        )
      : null

  return (
    <Dialog open={device !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        dir={dir}
        showCloseButton={false}
        className="max-h-[85dvh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>
            {kind === "mic" ? labels.permMicTitle : labels.permCameraTitle}
          </DialogTitle>
          <DialogDescription>
            {browser === "in-app" ? "" : labels.permIntro}
          </DialogDescription>
        </DialogHeader>
        {browser === "in-app" ? (
          <p className="text-sm">{steps[0]}</p>
        ) : (
          <ol className="list-decimal space-y-2 ps-5 text-sm">
            {steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        )}
        <DialogFooter className="gap-2">
          {intent && (
            <a
              href={intent}
              className="bg-primary text-primary-foreground inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium"
            >
              {labels.androidAppTitle}
            </a>
          )}
          {browser === "in-app" && (
            <button
              type="button"
              className="border-input inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm font-medium"
              onClick={() => {
                try {
                  void navigator.clipboard.writeText(location.href)
                  setCopied(true)
                } catch {
                  /* clipboard refused: the link stays in the address bar */
                }
              }}
            >
              {copied ? labels.permCopied : labels.permCopyLink}
            </button>
          )}
          <button
            type="button"
            className="border-input inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm font-medium"
            onClick={onClose}
          >
            {labels.permGotIt}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Inside the LiveKit room: when the browser flips a blocked device to
 * "granted", turn it on by itself and say so. No rejoin.
 */
export function PermissionWatcher({ labels }: { labels: RoomLabels }) {
  const ctx = useDeviceFailure()
  const { localParticipant } = useLocalParticipant()
  const mic = useMediaPermission("microphone")
  const camera = useMediaPermission("camera")

  const micBlocked = ctx?.blocked.mic ?? false
  const camBlocked = ctx?.blocked.camera ?? false
  const cleared = ctx?.cleared
  const notify = ctx?.notify

  useEffect(() => {
    if (!micBlocked || mic !== "granted") return
    cleared?.("mic")
    void localParticipant
      .setMicrophoneEnabled(true)
      .then(() => {
        noteTrace("mic", "auto-on")
        notify?.({ text: labels.permMicOn, ok: true })
      })
      .catch(() => {})
  }, [micBlocked, mic, localParticipant, cleared, notify, labels.permMicOn])

  useEffect(() => {
    // Blocked means the user tried to turn it on; only then do we do it for them.
    if (!camBlocked || camera !== "granted") return
    cleared?.("camera")
    void localParticipant
      .setCameraEnabled(true)
      .then(() => {
        noteTrace("camera", "auto-on")
        notify?.({ text: labels.permCameraOn, ok: true })
      })
      .catch(() => {})
  }, [camBlocked, camera, localParticipant, cleared, notify, labels.permCameraOn])

  return null
}
