// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { getImage, type MediaLang } from "@/components/docs/media"

/**
 * The real product screens the homepage shows in place of the reference's
 * photographs — the "The Answer" rows and the "Trials" band. They are the same
 * stills the help guides use: captured from the demo school by the `shoot`
 * lane and served pre-encoded from cdn.databayt.org/hogwarts/<lang>/<route>/
 * (see src/components/docs/media.ts).
 *
 * Resolved on the server and handed to the client blocks as plain strings:
 * importing the manifest into a client component would ship all of it.
 * The page's language wins; Arabic fills in where a still has no English
 * capture yet.
 */
export interface HomeScreen {
  avif: string
  webp: string
  /** WebP fallback for the <img>. */
  src: string
  width: number
  height: number
  alt: string
}

export interface HomeScreens {
  /** "The Answer", row A — the whole school day on one dashboard. */
  answerA: HomeScreen
  /** "The Answer", row B — one base under the numbers (the fees overview). */
  answerB: HomeScreen
  /** "Trials" — the same platform on a phone. */
  phone: HomeScreen
}

const ALT: Record<keyof HomeScreens, Record<MediaLang, string>> = {
  answerA: {
    ar: "لوحة تحكم مدير المدرسة في بالقلم",
    en: "The school admin dashboard in Bilqalm",
  },
  answerB: {
    ar: "صفحة الرسوم في بالقلم: المستحقات والمدفوعات في مكان واحد",
    en: "The fees page in Bilqalm: what is due and what is paid, in one place",
  },
  phone: {
    ar: "بالقلم على الجوال: لوحة المدرسة كاملة",
    en: "Bilqalm on a phone: the full school dashboard",
  },
}

const SHOT: Record<keyof HomeScreens, string> = {
  answerA: "switch-language/dashboard",
  answerB: "set-fees/overview",
  phone: "install-app/iphone-16/dashboard",
}

/** "<url> 1600w, <url> 2400w", narrowest first. */
function srcSet(byWidth: Record<string, string>): string {
  return Object.entries(byWidth)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([width, url]) => `${url} ${width}w`)
    .join(", ")
}

function resolve(key: keyof HomeScreens, lang: MediaLang): HomeScreen {
  const id = SHOT[key]
  let image
  try {
    image = getImage(`${id}-${lang}`)
  } catch {
    image = getImage(`${id}-ar`)
  }
  const webp = Object.entries(image.webp).sort(
    ([a], [b]) => Number(a) - Number(b)
  )
  return {
    avif: srcSet(image.avif),
    webp: srcSet(image.webp),
    src: webp[0][1],
    width: image.width,
    height: image.height,
    alt: ALT[key][lang],
  }
}

export function homeScreens(lang: MediaLang): HomeScreens {
  return {
    answerA: resolve("answerA", lang),
    answerB: resolve("answerB", lang),
    phone: resolve("phone", lang),
  }
}
