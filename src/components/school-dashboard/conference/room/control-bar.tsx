"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"
import {
  DisconnectButton,
  useMediaDeviceSelect,
  useTrackToggle,
} from "@livekit/components-react"
import { Track } from "livekit-client"
import {
  Hand,
  HelpCircle,
  ListChecks,
  LogOut,
  MessageSquare,
  Mic,
  MicOff,
  MonitorUp,
  PenLine,
  Presentation,
  Settings,
  SignalHigh,
  Video,
  VideoOff,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { ConferenceParticipantRole } from "@/components/school-dashboard/conference/types"

import { DELIVERY_TIERS, type DeliveryTier } from "./adaptive-delivery"
import type { RoomLabels } from "./labels"
import type { PanelTab } from "./side-panel"
import type { SlideOption } from "./slide-options"
import type { AdaptiveDelivery } from "./use-adaptive-delivery"
import type { ClassChannel } from "./use-class-channel"

interface ControlBarProps {
  role: ConferenceParticipantRole
  labels: RoomLabels
  channel: ClassChannel
  adaptive: AdaptiveDelivery
  panel: PanelTab | null
  onPanel: (tab: PanelTab | null) => void
  slides: SlideOption[]
}

const btn =
  "flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-3 text-xs text-white transition-colors hover:bg-white/20 disabled:opacity-40"

/**
 * Our own control bar — every label from the dictionary, every control
 * wired to a real capability. Replaces the SDK's prebuilt bar, whose strings
 * were hardcoded English and forced the room to render LTR.
 */
export function ControlBar({
  role,
  labels,
  channel,
  adaptive,
  panel,
  onPanel,
  slides,
}: ControlBarProps) {
  const canPublish = role !== "OBSERVER"
  const isHost = role === "HOST" || role === "CO_HOST"
  const isStudent = role === "PARTICIPANT"
  const [menu, setMenu] = useState<"quality" | "settings" | "slides" | null>(
    null
  )
  const toggleMenu = (m: typeof menu) =>
    setMenu((cur) => (cur === m ? null : m))

  return (
    <div className="relative flex items-center justify-center gap-1 border-t border-white/10 bg-neutral-950 px-2 py-2">
      {canPublish && <MicButton labels={labels} />}
      {canPublish && <CameraButton labels={labels} />}
      {isHost && <ShareButton labels={labels} />}

      {isStudent && (
        <button
          type="button"
          className={cn(
            btn,
            channel.handUp && "bg-amber-400 text-black hover:bg-amber-300"
          )}
          aria-pressed={channel.handUp}
          onClick={() => void channel.setHand(!channel.handUp)}
        >
          <Hand className="h-5 w-5" aria-hidden />
          {channel.handUp ? labels.lowerHand : labels.raiseHand}
        </button>
      )}

      {isHost && (
        <>
          <button
            type="button"
            className={cn(btn, channel.state.whiteboard && "bg-white/25")}
            aria-pressed={channel.state.whiteboard}
            onClick={() =>
              void channel.send({ t: "wb.show", on: !channel.state.whiteboard })
            }
          >
            <PenLine className="h-5 w-5" aria-hidden />
            {channel.state.whiteboard
              ? labels.hideWhiteboard
              : labels.whiteboard}
          </button>
          <div className="relative">
            <button
              type="button"
              className={cn(btn, channel.state.slides && "bg-white/25")}
              aria-haspopup="menu"
              aria-expanded={menu === "slides"}
              onClick={() => toggleMenu("slides")}
            >
              <Presentation className="h-5 w-5" aria-hidden />
              {labels.slides}
            </button>
            {menu === "slides" && (
              <Menu onClose={() => setMenu(null)}>
                <div className="px-2 py-1 text-xs text-white/60">
                  {labels.pickSlides}
                </div>
                {slides.length === 0 && (
                  <div className="px-2 py-1 text-xs text-white/60">
                    {labels.noSlides}
                  </div>
                )}
                {slides.map((s) => (
                  <MenuItem
                    key={s.id}
                    onClick={() => {
                      setMenu(null)
                      void channel.send({
                        t: "slides",
                        slides: { url: s.url, title: s.title, page: 1 },
                      })
                    }}
                  >
                    {s.title}
                  </MenuItem>
                ))}
                {channel.state.slides && (
                  <MenuItem
                    onClick={() => {
                      setMenu(null)
                      void channel.send({ t: "slides", slides: null })
                    }}
                  >
                    {labels.stopSlides}
                  </MenuItem>
                )}
              </Menu>
            )}
          </div>
        </>
      )}

      <button
        type="button"
        className={cn(btn, panel === "chat" && "bg-white/25")}
        aria-pressed={panel === "chat"}
        onClick={() => onPanel(panel === "chat" ? null : "chat")}
      >
        <MessageSquare className="h-5 w-5" aria-hidden />
        {labels.chat}
      </button>
      <button
        type="button"
        className={cn(btn, panel === "questions" && "bg-white/25")}
        aria-pressed={panel === "questions"}
        onClick={() => onPanel(panel === "questions" ? null : "questions")}
      >
        <HelpCircle className="h-5 w-5" aria-hidden />
        {labels.questions}
        {channel.state.questions.some((q) => !q.answered) && (
          <span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden />
        )}
      </button>
      <button
        type="button"
        className={cn(btn, panel === "poll" && "bg-white/25")}
        aria-pressed={panel === "poll"}
        onClick={() => onPanel(panel === "poll" ? null : "poll")}
      >
        <ListChecks className="h-5 w-5" aria-hidden />
        {labels.poll}
        {channel.state.poll?.open && (
          <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
        )}
      </button>
      {isHost && (
        <button
          type="button"
          className={cn(btn, panel === "hands" && "bg-white/25")}
          aria-pressed={panel === "hands"}
          onClick={() => onPanel(panel === "hands" ? null : "hands")}
        >
          <Hand className="h-5 w-5" aria-hidden />
          {labels.handsRaised}
          {channel.hands.length > 0 && (
            <span className="rounded-full bg-amber-400 px-1.5 text-[10px] font-semibold text-black">
              {channel.hands.length}
            </span>
          )}
        </button>
      )}

      <div className="relative">
        <button
          type="button"
          className={cn(btn, adaptive.manual && "bg-white/25")}
          aria-haspopup="menu"
          aria-expanded={menu === "quality"}
          onClick={() => toggleMenu("quality")}
        >
          <SignalHigh className="h-5 w-5" aria-hidden />
          {labels.quality}
        </button>
        {menu === "quality" && (
          <Menu onClose={() => setMenu(null)}>
            <MenuItem
              selected={adaptive.manual === null}
              onClick={() => {
                adaptive.setManual(null)
                setMenu(null)
              }}
            >
              {labels.qualityAuto} ({tierLabel(adaptive.tier, labels)})
            </MenuItem>
            {DELIVERY_TIERS.map((t) => (
              <MenuItem
                key={t}
                selected={adaptive.manual === t}
                onClick={() => {
                  adaptive.setManual(t)
                  setMenu(null)
                }}
              >
                {tierLabel(t, labels)}
              </MenuItem>
            ))}
          </Menu>
        )}
      </div>

      {canPublish && (
        <div className="relative">
          <button
            type="button"
            className={btn}
            aria-haspopup="menu"
            aria-expanded={menu === "settings"}
            onClick={() => toggleMenu("settings")}
          >
            <Settings className="h-5 w-5" aria-hidden />
            <span className="sr-only">{labels.settings}</span>
          </button>
          {menu === "settings" && (
            <Menu onClose={() => setMenu(null)} wide>
              <DeviceSelect kind="audioinput" label={labels.mic} />
              <DeviceSelect kind="videoinput" label={labels.camera} />
            </Menu>
          )}
        </div>
      )}

      <DisconnectButton className={cn(btn, "ms-2 bg-red-600 hover:bg-red-500")}>
        <LogOut className="h-5 w-5 rtl:-scale-x-100" aria-hidden />
        {labels.leave}
      </DisconnectButton>
    </div>
  )
}

export function tierLabel(t: DeliveryTier, labels: RoomLabels): string {
  return t === "high"
    ? labels.qualityHigh
    : t === "medium"
      ? labels.qualityMedium
      : t === "low"
        ? labels.qualityLow
        : labels.qualityAudio
}

function MicButton({ labels }: { labels: RoomLabels }) {
  const { toggle, enabled, pending } = useTrackToggle({
    source: Track.Source.Microphone,
  })
  return (
    <button
      type="button"
      className={cn(btn, !enabled && "bg-red-600/80 hover:bg-red-500")}
      aria-pressed={enabled}
      disabled={pending}
      onClick={() => void toggle()}
    >
      {enabled ? (
        <Mic className="h-5 w-5" aria-hidden />
      ) : (
        <MicOff className="h-5 w-5" aria-hidden />
      )}
      {enabled ? labels.mic : labels.micMuted}
    </button>
  )
}

function CameraButton({ labels }: { labels: RoomLabels }) {
  const { toggle, enabled, pending } = useTrackToggle({
    source: Track.Source.Camera,
  })
  return (
    <button
      type="button"
      className={cn(btn, !enabled && "bg-red-600/80 hover:bg-red-500")}
      aria-pressed={enabled}
      disabled={pending}
      onClick={() => void toggle()}
    >
      {enabled ? (
        <Video className="h-5 w-5" aria-hidden />
      ) : (
        <VideoOff className="h-5 w-5" aria-hidden />
      )}
      {enabled ? labels.camera : labels.cameraOff}
    </button>
  )
}

function ShareButton({ labels }: { labels: RoomLabels }) {
  const { toggle, enabled, pending } = useTrackToggle({
    source: Track.Source.ScreenShare,
  })
  return (
    <button
      type="button"
      className={cn(btn, enabled && "bg-sky-600 hover:bg-sky-500")}
      aria-pressed={enabled}
      disabled={pending}
      onClick={() => void toggle()}
    >
      <MonitorUp className="h-5 w-5" aria-hidden />
      {enabled ? labels.stopShare : labels.screenShare}
    </button>
  )
}

function DeviceSelect({
  kind,
  label,
}: {
  kind: "audioinput" | "videoinput"
  label: string
}) {
  const { devices, activeDeviceId, setActiveMediaDevice } =
    useMediaDeviceSelect({ kind })
  return (
    <label className="block px-2 py-1 text-xs">
      <span className="mb-1 block text-white/60">{label}</span>
      <select
        className="w-full rounded-md border border-white/20 bg-neutral-900 px-2 py-1 text-white"
        value={activeDeviceId}
        onChange={(e) => void setActiveMediaDevice(e.target.value)}
      >
        {devices.map((d) => (
          <option key={d.deviceId} value={d.deviceId}>
            {d.label || d.deviceId}
          </option>
        ))}
      </select>
    </label>
  )
}

function Menu({
  children,
  onClose,
  wide,
}: {
  children: React.ReactNode
  onClose: () => void
  wide?: boolean
}) {
  return (
    <>
      <div className="fixed inset-0 z-20" onClick={onClose} aria-hidden />
      <div
        role="menu"
        className={cn(
          "absolute bottom-full z-30 mb-2 max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-neutral-900 py-1 shadow-xl",
          wide ? "w-64" : "min-w-44"
        )}
        style={{ insetInlineStart: 0 }}
      >
        {children}
      </div>
    </>
  )
}

function MenuItem({
  children,
  onClick,
  selected,
}: {
  children: React.ReactNode
  onClick: () => void
  selected?: boolean
}) {
  return (
    <button
      type="button"
      role="menuitem"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "block w-full truncate px-3 py-1.5 text-start text-sm text-white hover:bg-white/10",
        selected && "font-semibold"
      )}
    >
      {children}
    </button>
  )
}
