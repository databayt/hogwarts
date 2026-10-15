"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The live QR code for one section. The server signs a short-lived payload
 * (generateAttendanceQR); we draw it to a data URL and show it as an image —
 * the same image in the card and full screen. (The old version drew into a
 * canvas ref that the full-screen overlay also claimed, so the card often
 * rendered an empty box.)
 */
import { useCallback, useEffect, useRef, useState } from "react"
import { Download, Maximize2, RefreshCw, X } from "lucide-react"
import QRCode from "qrcode"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { ErrorToast } from "@/components/atom/toast"
import { Segmented } from "@/components/school-dashboard/school/configuration/ui/segmented"
import {
  SettingsGroup,
  SettingsRow,
} from "@/components/school-dashboard/school/configuration/ui/settings-group"

import { generateAttendanceQR } from "./actions"

interface QRGeneratorProps {
  /** The section whose students may scan the code. */
  sectionId: string
  sectionName: string
  t: Record<string, string>
  lang: string
}

const INTERVALS = ["30", "60", "120"] as const
type Interval = (typeof INTERVALS)[number]

export function QRGenerator({
  sectionId,
  sectionName,
  t,
  lang,
}: QRGeneratorProps) {
  const [image, setImage] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [failed, setFailed] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [interval, setIntervalSec] = useState<Interval>("60")
  const [includeLocation, setIncludeLocation] = useState(false)
  const [expiresAt, setExpiresAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const busy = useRef(false)

  const num = new Intl.NumberFormat(lang === "ar" ? "ar-SA-u-nu-latn" : "en-US")
  const seconds = (n: number) =>
    (t.seconds ?? "{n}s").replace("{n}", num.format(n))

  const generate = useCallback(async () => {
    if (busy.current) return
    busy.current = true
    setIsGenerating(true)
    try {
      const result = await generateAttendanceQR({
        sectionId,
        validFor: Number(interval),
        includeLocation,
      })
      if (!result.success || !result.data) throw new Error(result.error)
      const url = await QRCode.toDataURL(result.data.code, {
        width: 640,
        margin: 2,
        errorCorrectionLevel: "H",
        color: { dark: "#000000", light: "#FFFFFF" },
      })
      setImage(url)
      // Count down on the browser's clock (a skewed server clock must not
      // make every fresh code look expired and loop).
      setExpiresAt(Date.now() + Number(interval) * 1000)
      setFailed(false)
    } catch {
      setFailed(true)
      ErrorToast(t.failed ?? "Couldn't create the code. Try again.")
    } finally {
      busy.current = false
      setIsGenerating(false)
    }
  }, [sectionId, interval, includeLocation, t.failed])

  // A new code for every section / setting change…
  useEffect(() => {
    void generate()
  }, [generate])

  // …and a fresh one as each expires.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])
  const left = expiresAt ? Math.max(0, Math.ceil((expiresAt - now) / 1000)) : 0
  useEffect(() => {
    if (expiresAt && left === 0 && !failed) void generate()
  }, [left, expiresAt, failed, generate])

  const download = () => {
    if (!image) return
    const a = document.createElement("a")
    a.href = image
    a.download = `attendance-qr-${sectionName || sectionId}.png`
    a.click()
  }

  const code = (size: string) =>
    image ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={t.alt ?? "Attendance QR code"}
        className={size}
        draggable={false}
      />
    ) : (
      <div className={`${size} bg-muted animate-pulse rounded-xl`} />
    )

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,22rem)]">
      <section className="bg-card flex flex-col items-center gap-5 rounded-3xl border p-6 sm:p-10">
        <div className="relative">
          <div className="rounded-2xl bg-white p-3">
            {code("size-64 sm:size-80")}
          </div>
          {isGenerating ? (
            <div className="bg-background/60 absolute inset-0 flex items-center justify-center rounded-2xl">
              <RefreshCw className="size-6 animate-spin" />
            </div>
          ) : null}
        </div>
        <div className="space-y-1 text-center">
          <p className="text-lg font-semibold">{sectionName}</p>
          <p className="text-muted-foreground text-sm tabular-nums">
            {failed
              ? (t.failedShort ?? "The code couldn't be created")
              : (t.newCodeIn ?? "New code in {time}").replace(
                  "{time}",
                  seconds(left)
                )}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            className="rounded-full px-6"
            onClick={() => setFullscreen(true)}
            disabled={!image}
          >
            <Maximize2 className="size-4" />
            {t.fullscreen ?? "Show full screen"}
          </Button>
          <Button
            variant="ghost"
            className="rounded-full"
            onClick={() => void generate()}
            disabled={isGenerating}
          >
            <RefreshCw className="size-4" />
            {t.refresh ?? "New code"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={download}
            disabled={!image}
            aria-label={t.download ?? "Download"}
          >
            <Download className="size-4" />
          </Button>
        </div>
      </section>

      <SettingsGroup title={t.settings ?? "Settings"}>
        <SettingsRow label={t.refreshEvery ?? "New code every"} stack>
          <Segmented
            value={interval}
            onValueChange={setIntervalSec}
            options={INTERVALS.map((v) => ({
              value: v,
              label: seconds(Number(v)),
            }))}
            aria-label={t.refreshEvery ?? "New code every"}
          />
        </SettingsRow>
        <SettingsRow
          label={t.location ?? "Check location"}
          description={
            t.locationDesc ?? "Students must be at school when they scan"
          }
        >
          <Switch
            checked={includeLocation}
            onCheckedChange={setIncludeLocation}
            aria-label={t.location ?? "Check location"}
          />
        </SettingsRow>
      </SettingsGroup>

      {fullscreen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.scanToCheckIn ?? "Scan to check in"}
          className="bg-background/95 fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 p-6 backdrop-blur-sm"
          onClick={() => setFullscreen(false)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute end-4 top-4 rounded-full"
            onClick={() => setFullscreen(false)}
            aria-label={t.close ?? "Close"}
          >
            <X className="size-5" />
          </Button>
          <h2 className="text-2xl font-semibold">
            {t.scanToCheckIn ?? "Scan to check in"}
          </h2>
          <div
            className="rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {code("size-[min(70vh,80vw)]")}
          </div>
          <p className="text-muted-foreground text-lg tabular-nums">
            {sectionName} ·{" "}
            {(t.newCodeIn ?? "New code in {time}").replace(
              "{time}",
              seconds(left)
            )}
          </p>
        </div>
      ) : null}
    </div>
  )
}
