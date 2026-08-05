// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// "Why Databayt" band — the apple mac/why-apple horizontally scrollable
// value-props gallery with paddle nav, filled with the shared battle-card
// deck (page-data/showcase/why.ts) and real product screenshots. Fixed
// light band by design, matching the showcase deck above it.

/* eslint-disable @next/next/no-img-element */

"use client"

import { useRef, useState } from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"

import { WHY_CARDS, WHY_HEADING, WHY_LINK } from "../page-data/showcase/why"

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
          ? "Previous item in Why Databayt gallery"
          : "Next item in Why Databayt gallery"
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

interface Props {
  lang: string
}

export function WhyDatabayt({ lang }: Props) {
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

  const headingLines = WHY_HEADING.split("\n")

  return (
    <div className="relative ml-[calc(50%-50vw)] w-screen overflow-x-clip">
      <section className="w-full overflow-hidden bg-[rgb(245,245,247)] pt-[144px] pb-[144px] max-[1068px]:pt-[100px] max-[1068px]:pb-[100px] max-[734px]:pt-[80px] max-[734px]:pb-[80px]">
        {/* Section header row */}
        <div className="mx-auto mb-[48px] flex max-w-[1260px] flex-wrap items-end justify-between gap-x-[80px] gap-y-[20px] px-[90px] max-[734px]:flex-col max-[734px]:items-start max-[734px]:px-[24px]">
          <h2 className="max-w-[75%] min-w-[50%] flex-grow text-[48px] leading-[52.0077px] font-[600] tracking-[-0.144px] text-[rgba(0,0,0,0.88)] max-[1068px]:text-[40px] max-[1068px]:leading-[1.1] max-[734px]:max-w-full max-[734px]:text-[32px] max-[734px]:leading-[1.125]">
            <span>
              {headingLines.map((line, i) => (
                <span key={line}>
                  {i > 0 && <br />}
                  {line}
                </span>
              ))}
            </span>
          </h2>
          <div className="max-w-[75%] min-w-min">
            <ul className="flex flex-wrap gap-x-[34px] gap-y-[5px] pb-[2px]">
              <li>
                <Link
                  href={`/${lang}${WHY_LINK.href}`}
                  className="inline-flex items-center text-[17px] leading-[21.0012px] text-[rgb(0,102,204)] hover:underline"
                >
                  <span>{WHY_LINK.label}</span>
                  <svg
                    viewBox="0 0 9 12"
                    className="ms-[2px] size-[10px] fill-current rtl:rotate-180"
                    aria-hidden="true"
                  >
                    <path d="M1.5 0L0 1.4 4.8 6 0 10.6 1.5 12l6.2-6z" />
                  </svg>
                </Link>
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
              {WHY_CARDS.map((card) => (
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
                          src={card.image}
                          alt={card.headline}
                          loading="lazy"
                          className="absolute inset-0 size-full object-cover"
                          style={{
                            objectPosition: card.objectPosition ?? "center top",
                          }}
                        />
                      </div>

                      {/* Card link overlay */}
                      <Link
                        href={`/${lang}${card.href}`}
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
                              className="size-[19.7969px] fill-current rtl:rotate-180"
                            >
                              <path d="M13.94 9.06l-4.5-4.5a1.5 1.5 0 0 0-2.12 2.12L10.755 10l-3.435 3.32a1.5 1.5 0 1 0 2.12 2.12l4.5-4.5a1.5 1.5 0 0 0 0-1.88z" />
                            </svg>
                          </span>
                        </span>
                        <span className="sr-only">{card.headline}</span>
                      </Link>
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
    </div>
  )
}
