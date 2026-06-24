// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported verbatim from apple (mac/why-apple) — horizontally scrollable
// value-props gallery with paddle-nav. Self-contained Tailwind; inherits the
// app's default sans (no SF Pro license).

/* eslint-disable @next/next/no-img-element */

"use client"

import { useRef, useState } from "react"

import { cn } from "@/lib/utils"

interface Card {
  id: string
  topic: string
  headline: React.ReactNode
  body: React.ReactNode
  src: string
  alt: string
  srcLabel: string
}

const A = "https://www.apple.com/assets-www/en_WW/mac"

const CARDS: Card[] = [
  {
    id: "acmi",
    topic: "Ways to Buy",
    headline: <>Pay over time, interest&#8209;free.</>,
    body: (
      <>
        When you choose to check out at Apple with Apple&nbsp;Card Monthly
        Installments.
        <sup className="relative">
          <span className="underline">&#9674;</span>
        </sup>
      </>
    ),
    src: `${A}/03_value_props/large/apple_card_ee2a8ee40_2x.jpg`,
    alt: "Front of Apple Card, titanium finish",
    srcLabel: "Learn more about Apple Card Monthly Installments",
  },
  {
    id: "education",
    topic: "Education",
    headline: (
      <>
        Save on Mac with education pricing.
        <sup className="relative">
          <span className="underline">*</span>
        </sup>
      </>
    ),
    body: (
      <>
        College students and educators can save through the Apple&nbsp;Store.
        <sup className="relative">
          <span className="underline">*</span>
        </sup>
      </>
    ),
    src: `${A}/06_value_props/large/education_9d319824e_2x.jpg`,
    alt: "Three MacBook products: 13-inch MacBook, 15-inch MacBook Air, 16-inch MacBook Pro",
    srcLabel: "Learn more about education pricing.",
  },
  {
    id: "personal-setup",
    topic: "Personal Setup",
    headline: <>Meet your new Mac with Personal Setup.</>,
    body: (
      <>
        Get one-on-one help with data transfer, the latest features, and more.
      </>
    ),
    src: `${A}/03_value_props/large/setup_f2645f30d_2x.jpg`,
    alt: "Apple devices and features, charging cable, Mac laptop and desktop, keyboard, mouse, display, macOS window, Touch ID",
    srcLabel: "Learn more about your new Mac",
  },
  {
    id: "customize",
    topic: "Customize Your Mac",
    headline: <>Customize your Mac.</>,
    body: <>Choose your chip, memory, storage, even color.</>,
    src: `${A}/03_value_props/large/customize_52caaf2f5_2x.jpg`,
    alt: "Four Mac computers of various models, sizes, and colors, demonstrating the range of customization",
    srcLabel: "Learn more about customizing your Mac",
  },
  {
    id: "delivery",
    topic: "Delivery & Pickup",
    headline: <>Get flexible delivery and easy pickup.</>,
    body: (
      <>
        Choose from two&#8209;hour delivery from an Apple&nbsp;Store, free
        delivery, or easy pickup options.
      </>
    ),
    src: `${A}/03_value_props/large/delivery_f43650245_2x.jpg`,
    alt: "Apple bag",
    srcLabel: "Learn more about delivery and pickup options.",
  },
  {
    id: "specialist",
    topic: "Guided Shopping",
    headline: <>Shop live with a Specialist.</>,
    body: (
      <>
        Let us help you find what you need and answer all of your questions, one
        on one, at an Apple&nbsp;Store or online.
      </>
    ),
    src: `${A}/03_value_props/large/support_c5aa9f49c_2x.jpg`,
    alt: "Apple Support team member",
    srcLabel: "Learn more about shopping with a Specialist over video",
  },
  {
    id: "app",
    topic: "Apple Store App",
    headline: <>Explore a shopping experience designed around you.</>,
    body: <>Use the Apple Store app to get a more personal way to shop.</>,
    src: `${A}/03_value_props/large/apple_store_6678ce8c8_2x.jpg`,
    alt: "Logo, Apple Store App",
    srcLabel: "Learn more about shopping using Apple Store app",
  },
]

function PaddleButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next"
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={
        direction === "prev"
          ? "Previous item in Why Apple gallery"
          : "Next item in Why Apple gallery"
      }
      className={cn(
        "flex size-[36px] items-center justify-center rounded-full",
        "bg-[rgb(232,232,237)] text-[rgba(0,0,0,0.56)]",
        "transition-[background-color,color,opacity] duration-[100ms]",
        "hover:bg-[rgb(223,223,227)] disabled:cursor-default disabled:opacity-[0.32]",
        "cursor-pointer"
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 36 36"
        className="size-[18px] fill-current rtl:rotate-180"
        aria-hidden="true"
      >
        {direction === "prev" ? (
          <path d="M20 25c-.384 0-.768-.146-1.06-.44l-5.5-5.5a1.5 1.5 0 0 1 0-2.12l5.5-5.5a1.5 1.5 0 1 1 2.12 2.12L16.622 18l4.44 4.44A1.5 1.5 0 0 1 20 25z" />
        ) : (
          <path d="M22.56 16.938l-5.508-5.5a1.493 1.493 0 0 0-2.116.003 1.502 1.502 0 0 0 .004 2.121L19.384 18l-4.444 4.438A1.502 1.502 0 0 0 15.996 25c.382 0 .764-.145 1.056-.438l5.508-5.5a1.502 1.502 0 0 0 0-2.125z" />
        )}
      </svg>
    </button>
  )
}

export function MacWhyApple() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  function scrollByCard(dir: -1 | 1) {
    const el = scrollRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>("[data-card]")
    const step = card ? card.offsetWidth + 20 : el.clientWidth * 0.5
    el.scrollBy({ left: dir * step, behavior: "smooth" })
  }

  function onScroll() {
    const el = scrollRef.current
    if (!el) return
    setAtStart(el.scrollLeft <= 1)
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1)
  }

  return (
    <section className="w-full overflow-hidden bg-[rgb(245,245,247)] pt-[144px] pb-[144px] max-[1068px]:pt-[100px] max-[1068px]:pb-[100px] max-[734px]:pt-[80px] max-[734px]:pb-[80px]">
      {/* Section header row */}
      <div className="mx-auto mb-[48px] flex max-w-[1260px] flex-wrap items-end justify-between gap-x-[80px] gap-y-[20px] px-[90px] max-[734px]:flex-col max-[734px]:items-start max-[734px]:px-[24px]">
        <h2 className="max-w-[75%] min-w-[50%] flex-grow text-[48px] leading-[52.0077px] font-[600] tracking-[-0.144px] text-[rgba(0,0,0,0.88)] max-[1068px]:text-[40px] max-[1068px]:leading-[1.1] max-[734px]:max-w-full max-[734px]:text-[32px] max-[734px]:leading-[1.125]">
          <span>
            Why Apple is the best
            <br />
            place to buy Mac.
          </span>
        </h2>
        <div className="max-w-[75%] min-w-min">
          <ul className="flex flex-wrap gap-x-[34px] gap-y-[5px] pb-[2px]">
            <li>
              <a
                href="#"
                className="inline-flex items-center text-[17px] leading-[21.0012px] text-[rgb(0,102,204)] hover:underline"
              >
                <span>Shop Mac</span>
                <svg
                  viewBox="0 0 9 12"
                  className="ms-[2px] size-[10px] fill-current rtl:rotate-180"
                  aria-hidden="true"
                >
                  <path d="M1.5 0L0 1.4 4.8 6 0 10.6 1.5 12l6.2-6z" />
                </svg>
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Gallery */}
      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          data-rsc-scrollable="true"
          className="mt-[-7.56px] mb-[-28px] overflow-x-auto overflow-y-hidden pb-[28px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <ul className="flex items-stretch gap-[20px] ps-[90px] pe-[90px] max-[734px]:ps-[24px] max-[734px]:pe-[24px]">
            {CARDS.map((card) => (
              <li
                key={card.id}
                data-card
                className="w-[372px] shrink-0 max-[1068px]:w-[344px] max-[734px]:w-[260px]"
              >
                <div className="mt-[7.56px]">
                  <div
                    className={cn(
                      "relative box-border grid overflow-hidden",
                      "min-h-[494.984px] grid-rows-[179px_1fr]",
                      "max-[1068px]:min-h-[470px] max-[1068px]:grid-rows-[auto_1fr] max-[734px]:min-h-[420px]",
                      "rounded-[28px] bg-white text-[rgba(0,0,0,0.88)]",
                      "outline outline-[1px] outline-[rgb(245,245,247)]"
                    )}
                  >
                    {/* Copy lockup (row 1) */}
                    <div className="row-start-1">
                      <h3 className="px-[32px] pt-[32px] text-[17px] leading-[21.0012px] font-[600] text-[rgba(0,0,0,0.88)] max-[734px]:px-[24px] max-[734px]:text-[14px]">
                        <span>{card.topic}</span>
                      </h3>
                      <div className="px-[32px] pt-[8px] max-[734px]:px-[24px]">
                        <p className="max-w-[496px] text-[28px] leading-[32px] font-[600] tracking-[0.196px] text-[rgba(0,0,0,0.88)] max-[1068px]:text-[24px] max-[1068px]:leading-[28px] max-[734px]:text-[21px] max-[734px]:leading-[25px]">
                          <span>{card.headline}</span>
                        </p>
                        <p className="mt-[12px] max-w-[496px] text-[17px] leading-[21.0012px] text-[rgba(0,0,0,0.88)] max-[734px]:text-[14px] max-[734px]:leading-[18px]">
                          <span>{card.body}</span>
                        </p>
                      </div>
                    </div>

                    {/* Image (row 2) fills the bottom of the card */}
                    <div className="relative row-start-2 overflow-hidden">
                      <img
                        src={card.src}
                        alt={card.alt}
                        loading="lazy"
                        className="absolute inset-0 size-full object-cover object-bottom"
                      />
                    </div>

                    {/* Plus trigger overlay */}
                    <button
                      type="button"
                      className="absolute inset-0 z-[1] block cursor-pointer"
                    >
                      <span
                        className="absolute end-[16px] bottom-[16px] z-[2] flex size-[44px] items-center justify-center"
                        aria-hidden="true"
                      >
                        <span className="flex size-[36px] items-center justify-center rounded-full bg-[rgb(29,29,31)] text-white transition-[background-color,color,opacity] duration-[100ms]">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            className="size-[19.7969px] fill-current"
                          >
                            <path d="M16 8.5h-4.5V4a1.5 1.5 0 0 0-3 0v4.5H4a1.5 1.5 0 0 0 0 3h4.5V16a1.5 1.5 0 0 0 3 0v-4.5H16a1.5 1.5 0 0 0 0-3z" />
                          </svg>
                        </span>
                      </span>
                      <span className="sr-only">{card.srcLabel}</span>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Paddle nav */}
        <div className="mx-auto mt-[20px] flex max-w-[1260px] justify-center gap-[20px] px-[90px] max-[734px]:px-[24px] min-[1069px]:absolute min-[1069px]:top-[-104px] min-[1069px]:right-[90px] min-[1069px]:mt-0 min-[1069px]:w-auto min-[1069px]:px-0">
          <PaddleButton
            direction="prev"
            disabled={atStart}
            onClick={() => scrollByCard(-1)}
          />
          <PaddleButton
            direction="next"
            disabled={atEnd}
            onClick={() => scrollByCard(1)}
          />
        </div>
      </div>
    </section>
  )
}
