"use client"

import React, { useEffect } from "react"
import { useRouter } from "next/navigation"

// Prefetch banking routes for faster navigation
export function usePrefetchBankingRoutes(lang: string) {
  const router = useRouter()

  useEffect(() => {
    // Prefetch common banking routes
    const routes = [
      `/${lang}/banking`,
      `/${lang}/banking/my-banks`,
      `/${lang}/banking/transaction-history`,
      `/${lang}/banking/payment-transfer`,
    ]

    routes.forEach((route) => {
      router.prefetch(route)
    })
  }, [lang, router])
}

// Prefetch data on hover for instant navigation
export function usePrefetchOnHover(url: string) {
  const router = useRouter()

  return {
    onMouseEnter: () => router.prefetch(url),
    onTouchStart: () => router.prefetch(url),
  }
}

// Link wrapper with automatic prefetching
export function PrefetchLink({
  href,
  children,
  className,
  prefetch = true,
}: {
  href: string
  children: React.ReactNode
  className?: string
  prefetch?: boolean
}) {
  const router = useRouter()

  const handleMouseEnter = () => {
    if (prefetch) {
      router.prefetch(href)
    }
  }

  return (
    <a
      href={href}
      className={className}
      onMouseEnter={handleMouseEnter}
      onClick={(e) => {
        e.preventDefault()
        router.push(href)
      }}
    >
      {children}
    </a>
  )
}

// Intersection Observer for viewport-based prefetching
export function useViewportPrefetch(urls: string[]) {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === "undefined") return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const url = entry.target.getAttribute("data-prefetch")
            if (url) {
              router.prefetch(url)
              observer.unobserve(entry.target)
            }
          }
        })
      },
      {
        rootMargin: "100px", // Start prefetching 100px before element is visible
      }
    )

    // Observe elements with data-prefetch attribute
    const elements = document.querySelectorAll("[data-prefetch]")
    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [router, urls])
}

// Resource hints for critical resources
export function ResourceHints() {
  return (
    <>
      {/* Preconnect to external services */}
      <link rel="preconnect" href="https://cdn.plaid.com" />
      <link rel="dns-prefetch" href="https://cdn.plaid.com" />

      {/* Prefetch critical fonts */}
      <link
        rel="prefetch"
        href="/fonts/inter-var.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />

      {/* Preload critical CSS */}
      <link rel="preload" href="/_next/static/css/app.css" as="style" />
    </>
  )
}
