// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported from apple (store/hero) — pixel-exact masthead + the full-bleed
// product-category carousel with paddle-nav. Icons swapped to lucide; rail data
// inlined (PNGs copied to public/store/nav/).

"use client"

import * as React from "react"
import { ArrowUpRight, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

const heroLinks: { label: string; external?: boolean }[] = [
  { label: "Connect with a Specialist", external: true },
  { label: "Find an Apple Store" },
]

const productRail: { name: string; img: string }[] = [
  { name: "Mac", img: "/store/nav/mac.png" },
  { name: "iPhone", img: "/store/nav/iphone.png" },
  { name: "iPad", img: "/store/nav/ipad.png" },
  { name: "Apple Watch", img: "/store/nav/watch.png" },
  { name: "Apple Vision Pro", img: "/store/nav/vision-pro.png" },
  { name: "AirPods", img: "/store/nav/airpods.png" },
  { name: "AirTag", img: "/store/nav/airtag.png" },
  { name: "Apple TV 4K", img: "/store/nav/apple-tv.png" },
  { name: "HomePod", img: "/store/nav/homepod.png" },
  { name: "Accessories", img: "/store/nav/accessories.png" },
  { name: "Apple Gift Card", img: "/store/nav/gift-card.png" },
]

export function StoreHero() {
  return (
    <div>
      {/* ===== Masthead — .rs-shop-container-withchatandstore ===== */}
      <div className="apple-store-gutter">
        <div className="flex flex-col pt-14 pb-8 md:min-h-[248px] md:flex-row md:items-center md:justify-between md:py-0">
          {/* large-8 — "Store" */}
          <h1 className="font-[family-name:var(--font-sf-pro-display)] text-[48px] leading-[52px] font-semibold tracking-[-0.003em] text-[#1d1d1f] md:text-[80px] md:leading-[84px] md:tracking-[-0.015em]">
            Store
          </h1>

          {/* large-4 — tagline + chat/store links */}
          <div className="mt-1 flex max-w-[300px] flex-col items-start text-start md:mt-0 md:w-[317px] md:max-w-none md:items-end md:text-end">
            <p className="font-[family-name:var(--font-sf-pro-display)] text-[21px] leading-[25px] font-semibold tracking-[0.011em] text-[#1d1d1f] md:text-[28px] md:leading-[32px] md:tracking-[0.007em]">
              The best way to buy the products you love.
            </p>
            <div className="mt-4 flex flex-col items-start gap-2 md:items-end">
              {heroLinks.map((link) => (
                <a
                  key={link.label}
                  href="#"
                  className="inline-flex items-center gap-1 text-[12px] leading-[16px] tracking-[-0.016em] text-[#0066cc] hover:underline lg:text-[14px] lg:leading-[20px]"
                >
                  {link.label}
                  <ArrowUpRight
                    className="size-[15px] rtl:-scale-x-100"
                    aria-hidden
                  />
                  {link.external && (
                    <span className="sr-only">(opens in a new window)</span>
                  )}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== Product carousel — .rs-productnav-cardsshelf (full-bleed) ===== */}
      <ProductCarousel />
    </div>
  )
}

/* ---------- product-category carousel ---------- */

function ProductCarousel() {
  const ref = React.useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = React.useState(true)
  const [atEnd, setAtEnd] = React.useState(false)

  const update = React.useCallback(() => {
    const el = ref.current
    if (!el) return
    const left = Math.abs(el.scrollLeft)
    setAtStart(left <= 4)
    setAtEnd(left + el.clientWidth >= el.scrollWidth - 4)
  }, [])

  React.useEffect(() => {
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [update])

  const scroll = (dir: 1 | -1) => {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" })
  }

  return (
    <div className="relative pb-[62px]">
      <div
        ref={ref}
        onScroll={update}
        aria-label="Product"
        role="list"
        className="apple-store-rail flex gap-[10px] overflow-x-auto overflow-y-hidden pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {productRail.map((p) => (
          <a
            key={p.name}
            href="#"
            role="listitem"
            className="group flex w-[136px] shrink-0 flex-col items-center rounded-[18px] px-2 pt-[18px] pb-4 transition-colors duration-200 hover:bg-black/[0.04]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.img}
              alt={p.name}
              width={120}
              height={78}
              loading="lazy"
              className="mb-4 block h-[78px] w-[120px] object-contain"
            />
            <span className="block w-[120px] text-center text-[14px] leading-[20px] font-semibold tracking-[-0.016em] text-[#1d1d1f]">
              {p.name}
            </span>
          </a>
        ))}
      </div>

      <PaddleButton dir="prev" hidden={atStart} onClick={() => scroll(-1)} />
      <PaddleButton dir="next" hidden={atEnd} onClick={() => scroll(1)} />
    </div>
  )
}

function PaddleButton({
  dir,
  hidden,
  onClick,
}: {
  dir: "prev" | "next"
  hidden: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={dir === "next" ? "Next" : "Previous"}
      onClick={onClick}
      className={cn(
        "absolute top-[90px] z-10 hidden size-14 -translate-y-1/2 items-center justify-center rounded-full bg-[rgba(210,210,215,0.64)] text-[#1d1d1f] backdrop-blur-sm transition-opacity duration-300 hover:bg-[rgba(210,210,215,0.82)] sm:flex",
        dir === "next" ? "end-[18px]" : "start-[18px]",
        hidden && "pointer-events-none opacity-0"
      )}
    >
      <ChevronRight
        className={cn(
          "size-5",
          dir === "prev" && "rotate-180",
          "rtl:rotate-180"
        )}
      />
    </button>
  )
}
