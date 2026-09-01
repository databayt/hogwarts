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
import type {
  ConferenceParticipantRole,
  RoomTools,
} from "@/components/school-dashboard/live/types"

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
  tools: RoomTools
}

const btn =
  "flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-2 text-xs text-white transition-colors hover:bg-white/20 disabled:opacity-40 lg:px-3"

/**
 * The button's word. Hidden below `lg` — twelve labelled controls need ~520px
 * and a tablet would wrap them onto a second row, and vertical space is the
 * scarce thing in a video room. The word is always on `aria-label`, so hiding
 * it costs a screen reader nothing.
 */
const label = "hidden lg:inline"

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
  tools,
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
    // Wraps on a phone. Twelve controls with their words are ~520px wide; a
    // 375px screen clipped the last 144px, so Leave and Quality were simply
    // unreachable. Below `sm` each button collapses to its icon (the word
    // moves into `aria-label`, so nothing is lost to a screen reader) and the
    // row wraps to a second line rather than running off the edge.
    <div className="relative flex flex-wrap items-center justify-center gap-1 border-t border-white/10 bg-neutral-950 px-2 py-2">
      {canPublish && <MicButton labels={labels} />}
      {canPublish && <CameraButton labels={labels} />}
      {(isHost || (isStudent && tools.studentShare)) && (
        <ShareButton labels={labels} />
      )}

      {isStudent && (
        <button
          type="button"
          className={cn(
            btn,
            channel.handUp && "bg-amber-400 text-black hover:bg-amber-300"
          )}
          aria-pressed={channel.handUp}
          aria-label={channel.handUp ? labels.lowerHand : labels.raiseHand}
          onClick={() => void channel.setHand(!channel.handUp)}
        >
          <Hand className="h-5 w-5" aria-hidden />
          <span className={label}>
            {channel.handUp ? labels.lowerHand : labels.raiseHand}
          </span>
        </button>
      )}

      {isHost && (
        <>
          {tools.whiteboard && (
            <button
              type="button"
              className={cn(btn, channel.state.whiteboard && "bg-white/25")}
              aria-pressed={channel.state.whiteboard}
              aria-label={
                channel.state.whiteboard
                  ? labels.hideWhiteboard
                  : labels.whiteboard
              }
              onClick={() =>
                void channel.send({
                  t: "wb.show",
                  on: !channel.state.whiteboard,
                })
              }
            >
              <PenLine className="h-5 w-5" aria-hidden />
              <span className={label}>
                {channel.state.whiteboard
                  ? labels.hideWhiteboard
                  : labels.whiteboard}
              </span>
            </button>
          )}
          <div className="relative">
            <button
              type="button"
              className={cn(btn, channel.state.slides && "bg-white/25")}
              aria-haspopup="menu"
              aria-expanded={menu === "slides"}
              aria-label={labels.slides}
              onClick={() => toggleMenu("slides")}
            >
              <Presentation className="h-5 w-5" aria-hidden />
              <span className={label}>{labels.slides}</span>
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

      {tools.chat && (
        <button
          type="button"
          className={cn(btn, panel === "chat" && "bg-white/25")}
          aria-pressed={panel === "chat"}
          aria-label={labels.chat}
          onClick={() => onPanel(panel === "chat" ? null : "chat")}
        >
          <MessageSquare className="h-5 w-5" aria-hidden />
          <span className={label}>{labels.chat}</span>
        </button>
      )}
      <button
        type="button"
        className={cn(btn, panel === "questions" && "bg-white/25")}
        aria-pressed={panel === "questions"}
        aria-label={labels.questions}
        onClick={() => onPanel(panel === "questions" ? null : "questions")}
      >
        <HelpCircle className="h-5 w-5" aria-hidden />
        <span className={label}>{labels.questions}</span>
        {channel.state.questions.some((q) => !q.answered) && (
          <span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden />
        )}
      </button>
      {tools.polls && (
        <button
          type="button"
          className={cn(btn, panel === "poll" && "bg-white/25")}
          aria-pressed={panel === "poll"}
          aria-label={labels.poll}
          onClick={() => onPanel(panel === "poll" ? null : "poll")}
        >
          <ListChecks className="h-5 w-5" aria-hidden />
          <span className={label}>{labels.poll}</span>
          {channel.state.poll?.open && (
            <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
          )}
        </button>
      )}
      {isHost && (
        <button
          type="button"
          className={cn(btn, panel === "hands" && "bg-white/25")}
          aria-pressed={panel === "hands"}
          aria-label={labels.handsRaised}
          onClick={() => onPanel(panel === "hands" ? null : "hands")}
        >
          <Hand className="h-5 w-5" aria-hidden />
          <span className={label}>{labels.handsRaised}</span>
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
          aria-label={labels.quality}
          onClick={() => toggleMenu("quality")}
        >
          <SignalHigh className="h-5 w-5" aria-hidden />
          <span className={label}>{labels.quality}</span>
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
            aria-label={labels.settings}
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

      <DisconnectButton
        className={cn(btn, "ms-2 bg-red-600 hover:bg-red-500")}
        aria-label={labels.leave}
      >
        <LogOut className="h-5 w-5 rtl:-scale-x-100" aria-hidden />
        <span className={label}>{labels.leave}</span>
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
      aria-label={enabled ? labels.mic : labels.micMuted}
      disabled={pending}
      onClick={() => void toggle()}
    >
      {enabled ? (
        <Mic className="h-5 w-5" aria-hidden />
      ) : (
        <MicOff className="h-5 w-5" aria-hidden />
      )}
      <span className={label}>{enabled ? labels.mic : labels.micMuted}</span>
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
      aria-label={enabled ? labels.camera : labels.cameraOff}
      disabled={pending}
      onClick={() => void toggle()}
    >
      {enabled ? (
        <Video className="h-5 w-5" aria-hidden />
      ) : (
        <VideoOff className="h-5 w-5" aria-hidden />
      )}
      <span className={label}>
        {enabled ? labels.camera : labels.cameraOff}
      </span>
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
      aria-label={enabled ? labels.stopShare : labels.screenShare}
      disabled={pending}
      onClick={() => void toggle()}
    >
      <MonitorUp className="h-5 w-5" aria-hidden />
      <span className={label}>
        {enabled ? labels.stopShare : labels.screenShare}
      </span>
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
          "absolute bottom-full z-30 mb-2 max-h-72 max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-xl border border-white/10 bg-neutral-900 py-1 shadow-xl",
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
