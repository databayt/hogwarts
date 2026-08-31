"use client"

import React, { useEffect, useRef, useState } from "react"

import {
  CDN_IMAGES,
  CDN_POSTERS,
  CDN_VIDEOS,
  type CdnImage,
  type CdnPoster,
  type CdnVideo,
} from "@/components/saas-marketing/thmanyah/lib/cdn-assets"
import { usePhone } from "@/components/saas-marketing/thmanyah/lib/hooks"

/**
 * Modern — 1:1 mirror of font.thmanyah.com's "Modern" section
 * (.framer-1lwlxn7 → sticky .framer-e6n6bz → "title" + Framer Ticker).
 *
 * The ticker is a horizontally clipped <section> (cursor: grab) holding a
 * flex <ul> of fixed-width tiles (gap 16) rendered three times so the loop
 * wraps seamlessly. Measured off the live site: the track moves at 100px/s
 * (translateX increasing, i.e. towards the right under dir=rtl), it does
 * not pause on hover, a drag follows the pointer 1:1, and on release the
 * fling decays back to the base speed *in the drag's direction*.
 *
 * ≥600 the tiles are ~482px tall (a 462px 1080x1128 video + nine posters
 * at their design widths); below 600 the reference swaps to a 350px set
 * with two different assets (an .mp4, a 2755x3068 8th poster and a
 * 1188x1001 10th). All files are md5-identical to the live assets.
 *
 * Copy is ours, mechanics are the reference's. Width-matched at its own
 * sizes: eyebrow `نظام حديث` 119.6px vs `خط حديث` 111.4 (24px), headline
 * `يصنع توازنًا مريحًا لمدرستك` 450.6 vs 451.6 (44px/900 — a 1px match, the
 * reference's own construction kept), lede still ONE line in the 1320px box.
 * All three stay masculine so the eyebrow, headline and lede agree the way
 * the reference's do (`خط` … `يصنع` … `يجمع`) — hence `نظام`, not `منظومة`.
 *
 * THE TICKER TILES ARE STILL THE REFERENCE'S: every video and poster below
 * shows thmanyah's typeface in use and must be replaced before this is
 * customer-facing. They are fixed-width by design (the loop renders the set
 * three times and the track speed is tuned to the total width), so swaps
 * must keep each tile's `w` / `ar` or the seamless wrap breaks.
 *
 * Declarations live in globals.css under `.modern-*`.
 */

type Tile =
  | {
      name: string
      kind: "video"
      src: CdnVideo
      poster: CdnPoster
      w: number
      ar: number
    }
  | {
      name: string
      kind: "image"
      src: CdnImage
      iw: number
      ih: number
      w: number
      ar: number
    }

const DESKTOP: Tile[] = [
  {
    name: "01",
    kind: "video",
    src: "modern-01-webm",
    poster: "modern-01-poster",
    w: 462,
    ar: 0.956947,
  },
  {
    name: " -02",
    kind: "image",
    src: "modern-02",
    iw: 3640,
    ih: 3068,
    w: 572,
    ar: 1.18644,
  },
  {
    name: " -03",
    kind: "image",
    src: "modern-03",
    iw: 2755,
    ih: 3068,
    w: 433,
    ar: 0.898012,
  },
  {
    name: " -04",
    kind: "image",
    src: "modern-04",
    iw: 5757,
    ih: 3068,
    w: 905,
    ar: 1.87618,
  },
  {
    name: " -05",
    kind: "image",
    src: "modern-05",
    iw: 2756,
    ih: 3068,
    w: 433,
    ar: 0.898305,
  },
  {
    name: " -06",
    kind: "image",
    src: "modern-06",
    iw: 2756,
    ih: 3068,
    w: 433,
    ar: 0.898305,
  },
  {
    name: " -07",
    kind: "image",
    src: "modern-07",
    iw: 2010,
    ih: 3068,
    w: 316,
    ar: 0.65515,
  },
  {
    name: " -08",
    kind: "image",
    src: "modern-08",
    iw: 3640,
    ih: 3068,
    w: 572,
    ar: 1.18644,
  },
  {
    name: " -09",
    kind: "image",
    src: "modern-09",
    iw: 2010,
    ih: 3068,
    w: 316,
    ar: 0.65515,
  },
  {
    name: "-10 1",
    kind: "image",
    src: "modern-10",
    iw: 1878,
    ih: 1001,
    w: 904,
    ar: 1.87612,
  },
]

const PHONE: Tile[] = [
  {
    name: "01",
    kind: "video",
    src: "modern-01-phone-mp4",
    poster: "modern-01-poster",
    w: 335,
    ar: 0.956947,
  },
  {
    name: " -02",
    kind: "image",
    src: "modern-02",
    iw: 3640,
    ih: 3068,
    w: 415,
    ar: 1.18644,
  },
  {
    name: " -03",
    kind: "image",
    src: "modern-03",
    iw: 2755,
    ih: 3068,
    w: 314,
    ar: 0.898012,
  },
  {
    name: " -04",
    kind: "image",
    src: "modern-04",
    iw: 5757,
    ih: 3068,
    w: 656,
    ar: 1.87618,
  },
  {
    name: " -05",
    kind: "image",
    src: "modern-05",
    iw: 2756,
    ih: 3068,
    w: 314,
    ar: 0.898305,
  },
  {
    name: " -06",
    kind: "image",
    src: "modern-06",
    iw: 2756,
    ih: 3068,
    w: 314,
    ar: 0.898305,
  },
  {
    name: " -07",
    kind: "image",
    src: "modern-07",
    iw: 2010,
    ih: 3068,
    w: 229,
    ar: 0.65515,
  },
  {
    name: " -08",
    kind: "image",
    src: "modern-08-phone",
    iw: 2755,
    ih: 3068,
    w: 314.281,
    ar: 0.897979,
  },
  {
    name: " -09",
    kind: "image",
    src: "modern-09",
    iw: 2010,
    ih: 3068,
    w: 229,
    ar: 0.65515,
  },
  {
    name: "-10 1",
    kind: "image",
    src: "modern-10-phone",
    iw: 1188,
    ih: 1001,
    w: 415.375,
    ar: 1.18681,
  },
]

const SPEED = 100 // px/s, measured on the live ticker
const GAP = 16

function Ticker({
  tiles,
  sizes,
  copies,
}: {
  tiles: Tile[]
  sizes: string
  copies: number
}) {
  const trackRef = useRef<HTMLUListElement>(null)
  const state = useRef({
    x: 0,
    v: SPEED,
    dir: 1,
    dragging: false,
    lastX: 0,
    lastT: 0,
    vel: 0,
  })

  useEffect(() => {
    let raf = 0
    let prev = performance.now()
    const s = state.current
    /* the live ticker sits at translateX(0) under prefers-reduced-motion */
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)")
    const copyWidth = tiles.reduce((a, t) => a + t.w, 0) + tiles.length * GAP
    const tick = (now: number) => {
      const dt = Math.min((now - prev) / 1000, 0.05)
      prev = now
      if (!s.dragging && !reduce.matches) {
        // fling decays back to the base speed in the fling's direction
        const target = SPEED * s.dir
        s.v += (target - s.v) * (1 - Math.exp(-dt / 0.6))
        s.x += s.v * dt
      }
      // wrap so the copies loop seamlessly
      if (s.x > copyWidth) s.x -= copyWidth
      if (s.x < 0) s.x += copyWidth
      if (trackRef.current)
        trackRef.current.style.transform = `translateX(${s.x}px)`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [tiles])

  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    const s = state.current
    s.dragging = true
    s.lastX = e.clientX
    s.lastT = performance.now()
    s.vel = 0
    e.currentTarget.setPointerCapture(e.pointerId)
    e.currentTarget.style.cursor = "grabbing"
  }
  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const s = state.current
    if (!s.dragging) return
    const now = performance.now()
    const dx = e.clientX - s.lastX
    const dt = Math.max(now - s.lastT, 1) / 1000
    s.x += dx
    s.vel = dx / dt
    s.lastX = e.clientX
    s.lastT = now
    if (trackRef.current)
      trackRef.current.style.transform = `translateX(${s.x}px)`
  }
  const onPointerUp = (e: React.PointerEvent<HTMLElement>) => {
    const s = state.current
    if (!s.dragging) return
    s.dragging = false
    if (Math.abs(s.vel) > 20) {
      s.dir = s.vel > 0 ? 1 : -1
      s.v = Math.max(-1200, Math.min(1200, s.vel))
    }
    e.currentTarget.style.cursor = "grab"
  }

  /* the live desktop ticker renders the set three times, the phone one twice */
  const loop = Array.from({ length: copies }, () => tiles).flat()

  return (
    <section
      className="modern-clip"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <ul ref={trackRef} className="modern-track">
        {loop.map((t, i) => (
          <li
            key={`${t.name}-${i}`}
            className="modern-li"
            aria-hidden={i >= tiles.length}
          >
            <div
              className="modern-tile"
              data-framer-name={t.name}
              style={{ width: t.w, aspectRatio: `${t.ar} / 1` }}
            >
              {t.kind === "video" ? (
                <video
                  className="modern-video"
                  src={CDN_VIDEOS[t.src]}
                  poster={CDN_POSTERS[t.poster]}
                  loop
                  muted
                  playsInline
                  autoPlay
                  preload="auto"
                />
              ) : (
                <div className="modern-img-wrap">
                  {/* A plain <picture> rather than next/image: these are already
                      encoded at 2x their render width and served immutable from
                      the CDN, so the optimizer has nothing left to do. The wrap
                      is inset-0 and .modern-img is object-fit:cover, which is
                      all `fill` was contributing. */}
                  <picture>
                    <source
                      srcSet={CDN_IMAGES[t.src].avif}
                      type="image/avif"
                      sizes={sizes}
                    />
                    <source
                      srcSet={CDN_IMAGES[t.src].webp}
                      type="image/webp"
                      sizes={sizes}
                    />
                    <img
                      src={CDN_IMAGES[t.src].webp}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      className="modern-img"
                    />
                  </picture>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function ModernShowcaseBlock() {
  const phone = usePhone()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div className="modern" data-framer-name="Modern">
      {/* .framer-e6n6bz — sticky column */}
      <div className="modern-sticky">
        {/* title (.framer-tzyt8i) */}
        <div className="modern-title" data-framer-name="title">
          <div className="modern-title-inner">
            <div className="modern-heading">
              <div className="modern-text">
                <h2 dir="rtl" className="modern-eyebrow">
                  نظام حديث
                </h2>
              </div>
              <div className="modern-text">
                <p dir="rtl" className="modern-headline">
                  يصنع توازنًا مريحًا لمدرستك
                </p>
              </div>
            </div>
            <div className="modern-text">
              <p dir="rtl" className="modern-lede">
                تفهمه من النظرة الأولى، يجمع بين الوضوح والسرعة، بلمسة هادئة
                تُبرز ما يهمّ.
              </p>
            </div>
          </div>
        </div>

        {/* Web (.framer-1rbesf9-container) / mobile (.framer-1xqfktg-container) */}
        <div
          className={`modern-ticker ${phone ? "modern-ticker--mobile" : "modern-ticker--web"}`}
          data-framer-name={phone ? "mobile" : "Web"}
        >
          {mounted && (
            <Ticker
              key={phone ? "phone" : "web"}
              tiles={phone ? PHONE : DESKTOP}
              sizes={phone ? "656px" : "905px"}
              copies={phone ? 2 : 3}
            />
          )}
        </div>
      </div>
    </div>
  )
}
