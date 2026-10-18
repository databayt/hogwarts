"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"
import Link from "next/link"

import { Picture, VideoPlayer } from "@/components/docs/media-view"

import type { ChatbotDictionary, ChatResource } from "./type"

interface ResourceCardsProps {
  resources: ChatResource[]
  dictionary: ChatbotDictionary
  /** Closes the chat when the visitor follows an in-site link. */
  onNavigate: () => void
  /** Page language — picks the caption track and alt text. */
  lang?: "ar" | "en"
}

function formatDuration(seconds: number) {
  const s = Math.round(seconds)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

/**
 * The guide, tutorial video and screenshots attached to a support answer.
 * Built server-side from the support registry + media manifest — the model
 * never writes a URL, so a link here can't be hallucinated.
 *
 * The video plays in place and a screenshot opens above its row, both inside
 * the chat panel: the panel sits at z-[9999], over any portal dialog.
 */
export function ResourceCards({
  resources,
  dictionary,
  onNavigate,
  lang = "ar",
}: ResourceCardsProps) {
  const video = resources.find((r) => r.kind === "video")
  const images = resources.filter((r) => r.kind === "image")
  const guide = resources.find((r) => r.kind === "guide")
  const [playing, setPlaying] = useState(false)
  const [open, setOpen] = useState<number | null>(null)
  const shown = open === null ? undefined : images[open]

  return (
    <div className="space-y-2 ps-9">
      {video?.video && playing ? (
        <VideoPlayer
          video={video.video}
          lang={lang}
          autoPlay
          className="max-w-[80%] rounded-lg border"
        />
      ) : video?.thumb && video.video ? (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`${dictionary.resourceVideo}: ${video.title}`}
          className="group bg-muted relative block w-full max-w-[80%] overflow-hidden rounded-lg border text-start"
        >
          <VideoPoster video={video} dictionary={dictionary} />
        </button>
      ) : video?.thumb ? (
        <Link
          href={video.href}
          onClick={onNavigate}
          className="group bg-muted relative block max-w-[80%] overflow-hidden rounded-lg border"
        >
          <VideoPoster video={video} dictionary={dictionary} />
        </Link>
      ) : null}

      {shown?.image && (
        <figure className="bg-muted relative max-w-[80%] overflow-hidden rounded-lg border">
          <a
            href={shown.href}
            target="_blank"
            rel="noopener noreferrer"
            title={dictionary.resourceFullSize}
          >
            <Picture image={shown.image} lang={lang} sizes="400px" />
          </a>
          <figcaption className="text-muted-foreground px-2 py-1.5 text-xs">
            {shown.title}
          </figcaption>
          <button
            type="button"
            onClick={() => setOpen(null)}
            aria-label={dictionary.resourceClose}
            className="absolute end-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </figure>
      )}

      {images.length > 0 && (
        <div className="grid max-w-[80%] grid-cols-3 gap-1.5">
          {images.map((image, i) =>
            image.image ? (
              <button
                key={image.href}
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                title={image.title}
                aria-pressed={open === i}
                className="bg-muted aria-pressed:ring-primary block overflow-hidden rounded-md border aria-pressed:ring-2"
              >
                <Thumb image={image} />
              </button>
            ) : (
              <a
                key={image.href}
                href={image.href}
                target="_blank"
                rel="noopener noreferrer"
                title={image.title}
                className="bg-muted block overflow-hidden rounded-md border"
              >
                <Thumb image={image} />
              </a>
            )
          )}
        </div>
      )}

      {guide && (
        <Link
          href={guide.href}
          onClick={onNavigate}
          className="border-primary/30 text-primary hover:bg-primary/10 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          <span>
            {dictionary.resourceGuide}: {guide.title}
          </span>
        </Link>
      )}
    </div>
  )
}

function Thumb({ image }: { image: ChatResource }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- pre-encoded CDN still
    <img
      src={image.thumb}
      alt={image.title}
      loading="lazy"
      decoding="async"
      className="aspect-[16/10] w-full object-cover object-top transition-transform hover:scale-105"
    />
  )
}

function VideoPoster({
  video,
  dictionary,
}: {
  video: ChatResource
  dictionary: ChatbotDictionary
}) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- pre-encoded CDN poster */}
      <img
        src={video.thumb}
        alt={video.title}
        loading="lazy"
        decoding="async"
        className="aspect-video w-full object-cover"
      />
      <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-black shadow">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            className="ms-0.5"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
      <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent px-2 pt-4 pb-1.5 text-xs text-white">
        <span className="truncate">{dictionary.resourceVideo}</span>
        {video.duration ? (
          <span dir="ltr" className="shrink-0 tabular-nums">
            {formatDuration(video.duration)}
          </span>
        ) : null}
      </span>
    </>
  )
}
