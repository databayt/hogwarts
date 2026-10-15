"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The front-desk scanner. Most card readers type the code and press Enter,
 * so the primary surface is one always-focused field; the camera is the
 * fallback for a desk without a reader. Each scan records the student's own
 * section for today.
 */
import { useCallback, useEffect, useRef, useState } from "react"
import Quagga from "@ericblade/quagga2"
import {
  Camera,
  CameraOff,
  CircleAlert,
  CircleCheck,
  LoaderCircle,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { processBarcodeScan } from "./actions"

interface ScanEntry {
  code: string
  ok: boolean
  name?: string
  message?: string
  at: number
}

interface BarcodeScannerProps {
  /** Optional: take only this section's students. */
  sectionId?: string
  t: Record<string, string>
  lang: string
}

const READERS = [
  "code_128_reader",
  "ean_reader",
  "ean_8_reader",
  "code_39_reader",
  "codabar_reader",
  "upc_reader",
  "upc_e_reader",
  "i2of5_reader",
  "code_93_reader",
]

/** The scan action answers in English; show the reader's language. */
function explain(message: string | undefined, t: Record<string, string>) {
  const m = message?.toLowerCase() ?? ""
  if (m.includes("already marked")) return t.already ?? message
  if (m.includes("not found")) return t.unknownCard ?? message
  if (m.includes("expired")) return t.expiredCard ?? message
  if (m.includes("another section")) return t.otherSection ?? message
  if (m.includes("too many")) return t.tooMany ?? message
  return message ? (t.tryAgain ?? message) : undefined
}

export function BarcodeScanner({ sectionId, t, lang }: BarcodeScannerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const viewRef = useRef<HTMLDivElement>(null)
  const [code, setCode] = useState("")
  const [processing, setProcessing] = useState(false)
  const [camera, setCamera] = useState(false)
  const [history, setHistory] = useState<ScanEntry[]>([])
  const busy = useRef(false)
  const lastCamera = useRef<{ code: string; at: number } | null>(null)

  const time = new Intl.DateTimeFormat(
    lang === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-US",
    { hour: "numeric", minute: "2-digit" }
  )

  const submit = useCallback(
    async (raw: string) => {
      const value = raw.trim()
      if (!value || busy.current) return
      busy.current = true
      setProcessing(true)
      try {
        const res = await processBarcodeScan({
          barcode: value,
          sectionId,
          scannedAt: new Date().toISOString(),
          deviceId: "web-desk",
        })
        setHistory((h) =>
          [
            res.success
              ? {
                  code: value,
                  ok: true,
                  name: (res as { studentName?: string }).studentName,
                  at: Date.now(),
                }
              : {
                  code: value,
                  ok: false,
                  message: explain(res.error, t),
                  at: Date.now(),
                },
            ...h,
          ].slice(0, 20)
        )
      } catch (e) {
        setHistory((h) =>
          [
            {
              code: value,
              ok: false,
              message: explain(e instanceof Error ? e.message : "error", t),
              at: Date.now(),
            },
            ...h,
          ].slice(0, 20)
        )
      } finally {
        busy.current = false
        setProcessing(false)
        setCode("")
        inputRef.current?.focus()
      }
    },
    [sectionId, t]
  )

  // Camera: Quagga draws into viewRef while on.
  useEffect(() => {
    if (!camera || !viewRef.current) return
    let stopped = false
    const onDetected = (result: { codeResult?: { code?: string | null } }) => {
      const value = result.codeResult?.code
      if (!value) return
      const last = lastCamera.current
      // The same card stays in frame for a while — read it once.
      if (last && last.code === value && Date.now() - last.at < 4000) return
      lastCamera.current = { code: value, at: Date.now() }
      void submit(value)
    }
    Quagga.init(
      {
        inputStream: {
          type: "LiveStream",
          target: viewRef.current,
          constraints: { facingMode: "environment" },
        },
        locator: { patchSize: "medium", halfSample: true },
        numOfWorkers: navigator.hardwareConcurrency || 2,
        frequency: 10,
        decoder: { readers: READERS as never },
        locate: true,
      },
      (err) => {
        if (err || stopped) {
          if (err) {
            setCamera(false)
            setHistory((h) => [
              {
                code: "",
                ok: false,
                message: t.cameraError ?? "The camera couldn't start.",
                at: Date.now(),
              },
              ...h,
            ])
          }
          return
        }
        Quagga.start()
      }
    )
    Quagga.onDetected(onDetected)
    return () => {
      stopped = true
      Quagga.offDetected(onDetected)
      Quagga.stop()
    }
  }, [camera, submit, t.cameraError])

  const latest = history[0]

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,22rem)]">
      <section className="bg-card space-y-5 rounded-3xl border p-6 sm:p-8">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            void submit(code)
          }}
        >
          <Input
            ref={inputRef}
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t.placeholder ?? "Scan a card or type its number"}
            aria-label={t.placeholder ?? "Scan a card or type its number"}
            className="h-11 rounded-full px-5 font-mono"
            dir="ltr"
            autoComplete="off"
            disabled={processing}
          />
          <Button
            type="submit"
            className="h-11 rounded-full px-6"
            disabled={!code.trim() || processing}
          >
            {processing ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              (t.checkIn ?? "Check in")
            )}
          </Button>
        </form>

        <div
          aria-live="polite"
          className={cn(
            "flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl p-6 text-center",
            !latest && "bg-muted/50",
            latest?.ok && "bg-green-500/10",
            latest && !latest.ok && "bg-destructive/10"
          )}
        >
          {!latest ? (
            <p className="text-muted-foreground text-sm">
              {t.ready ?? "Ready. Each card checks its student in for today."}
            </p>
          ) : latest.ok ? (
            <>
              <CircleCheck className="size-8 text-green-600" />
              <p className="text-lg font-semibold">
                {latest.name ?? latest.code}
              </p>
              <p className="text-muted-foreground text-sm">
                {t.checkedIn ?? "Checked in"}
              </p>
            </>
          ) : (
            <>
              <CircleAlert className="text-destructive size-8" />
              <p className="font-semibold">
                {t.notCheckedIn ?? "Not checked in"}
              </p>
              {latest.message ? (
                <p className="text-muted-foreground text-sm" dir="auto">
                  {latest.message}
                </p>
              ) : null}
            </>
          )}
        </div>

        {camera ? (
          <div className="space-y-3">
            <div
              ref={viewRef}
              className="bg-muted relative mx-auto aspect-video max-w-xl overflow-hidden rounded-2xl [&_canvas]:absolute [&_canvas]:inset-0 [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
            />
            <div className="flex justify-center">
              <Button
                variant="ghost"
                className="rounded-full"
                onClick={() => setCamera(false)}
              >
                <CameraOff className="size-4" />
                {t.stopCamera ?? "Turn off camera"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              className="rounded-full"
              onClick={() => setCamera(true)}
            >
              <Camera className="size-4" />
              {t.useCamera ?? "Use the camera instead"}
            </Button>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-muted-foreground px-4 text-xs font-medium">
          {t.thisSession ?? "Scanned here"}
        </h3>
        {history.length === 0 ? (
          <p className="bg-card text-muted-foreground rounded-2xl border px-4 py-6 text-center text-sm">
            {t.noScans ?? "No cards scanned yet."}
          </p>
        ) : (
          <ul className="bg-card divide-border/60 divide-y overflow-hidden rounded-2xl border">
            {history.map((h) => (
              <li
                key={`${h.at}-${h.code}`}
                className="flex min-h-12 items-center gap-3 px-4 py-2.5"
              >
                {h.ok ? (
                  <CircleCheck className="size-4 shrink-0 text-green-600" />
                ) : (
                  <CircleAlert className="text-destructive size-4 shrink-0" />
                )}
                <span className="min-w-0 flex-1 truncate text-sm">
                  {h.ok ? (h.name ?? h.code) : h.code || h.message}
                </span>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {time.format(h.at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
