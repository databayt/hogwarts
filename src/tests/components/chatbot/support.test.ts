import { describe, expect, it } from "vitest"

import {
  formatSupport,
  isHelpIndexQuestion,
  isSupportQuestion,
  matchTopics,
  normalize,
  SUPPORT_TOPICS,
} from "@/components/chatbot/support"
import { flowStills, resourcesFor } from "@/components/chatbot/support-media"
import type { ImageMedia, VideoMedia } from "@/components/docs/media"

const top = (...texts: string[]) => matchTopics(texts)[0]?.slug

describe("normalize", () => {
  it("folds alef, ta-marbuta and tashkeel", () => {
    expect(normalize("إِضافةُ طالبٍ")).toBe("اضافه طالب")
    expect(normalize("كلمة المرور؟")).toBe("كلمه المرور")
  })
})

describe("matchTopics", () => {
  it.each([
    ["كيف أضيف طالب جديد؟", "add-student"],
    ["ابغى اضافة الطالب", "add-student"],
    ["How do I add a student?", "add-student"],
    ["كيف أضيف معلم", "add-teacher"],
    ["import students from excel", "bulk-student"],
    ["عندي ملف اكسل فيه كل الطلاب", "bulk-student"],
    ["كيف استيراد المعلمين من ملف", "bulk-teacher"],
    ["نسيت كلمة المرور", "login"],
    ["how do I take attendance", "attendance"],
    ["كيف أحصّل الرسوم من أولياء الأمور", "fees"],
    ["can I install it on my iPhone?", "mobile"],
    ["how do I get started", "get-started"],
  ])("%s → %s", (question, slug) => {
    expect(top(question)).toBe(slug)
  })

  it("routes a pricing question to the calculator, as a sales question", () => {
    const matched = matchTopics(["what are the pricing plans?"])
    expect(matched[0]?.slug).toBe("pricing")
    expect(isSupportQuestion(matched)).toBe(false)
    expect(top("بكم السعر لمدرسة فيها 300 طالب")).toBe("pricing")
  })

  it("keeps the topic on a follow-up via the earlier message", () => {
    expect(top("and after that?", "how do I add a student?")).toBe(
      "add-student"
    )
  })

  it("lets the latest message win over the earlier one", () => {
    expect(top("and how do I add a teacher?", "how do I add a student?")).toBe(
      "add-teacher"
    )
  })

  it("does not match short English keywords inside words", () => {
    // "app" must not hit "approve"; "test" must not hit "latest"
    expect(matchTopics(["approve the latest"])).toEqual([])
  })
})

describe("isSupportQuestion", () => {
  it("is false for get-started (a sales question) and true for how-tos", () => {
    expect(isSupportQuestion(matchTopics(["how do I get started"]))).toBe(false)
    expect(isSupportQuestion(matchTopics(["how do I add a student"]))).toBe(
      true
    )
    expect(isSupportQuestion([])).toBe(false)
  })
})

describe("formatSupport", () => {
  it("lists every guide, and the matched answer only when matched", () => {
    const index = formatSupport("en", [])
    for (const t of SUPPORT_TOPICS) expect(index).toContain(t.title.en)
    expect(index).not.toContain("###")

    const matched = formatSupport("ar", matchTopics(["كيف أضيف طالب"]))
    expect(matched).toContain("### إضافة طالب")
    expect(matched).toContain("**إنشاء**")
  })
})

const image = (step: string): ImageMedia => ({
  kind: "image",
  width: 1600,
  height: 1000,
  alt: { ar: `${step} ar`, en: `${step} en` },
  avif: { "1600": `https://cdn/${step}-1600.avif` },
  webp: {
    "1600": `https://cdn/${step}-1600.webp`,
    "2400": `https://cdn/${step}-2400.webp`,
  },
})
const video: VideoMedia = {
  kind: "video",
  title: { ar: "إضافة طالب", en: "Add a student" },
  poster: "https://cdn/poster.webp",
  width: 1920,
  height: 1080,
  duration: 83.4,
  sources: [{ src: "https://cdn/v.mp4", type: "video/mp4" }],
  tracks: [],
}
const STEPS = [
  "list",
  "documents",
  "finder-photo",
  "personal",
  "father",
  "academic",
  "created",
]
const fixture = {
  story: video,
  "add-student/video-ar": video,
  ...Object.fromEntries(STEPS.map((s) => [`add-student/${s}-ar`, image(s)])),
  "add-student/iphone-16/list-ar": image("phone"),
  "add-student/reel-ar": video,
}
const addStudent = SUPPORT_TOPICS.find((t) => t.slug === "add-student")!
const labels = { video: "Watch", guide: "Guide" }

describe("support media", () => {
  it("lists flat stills only, in shot order", () => {
    expect(flowStills("add-student", "ar", fixture)).toEqual(
      STEPS.map((s) => `add-student/${s}-ar`)
    )
  })

  it("attaches video, three spaced stills (no list/finder) and the guide", () => {
    const res = resourcesFor(addStudent, "ar", labels, fixture)
    expect(res.map((r) => r.kind)).toEqual([
      "video",
      "image",
      "image",
      "image",
      "guide",
    ])
    expect(res[0]).toMatchObject({
      href: "/ar/docs/support/add-student#video",
      thumb: "https://cdn/poster.webp",
      duration: 83.4,
    })
    const stills = res.filter((r) => r.kind === "image")
    expect(stills.map((r) => r.title)).toEqual([
      "documents ar",
      "father ar",
      "created ar",
    ])
    expect(stills[0]!.href).toBe("https://cdn/documents-2400.webp")
    expect(res.at(-1)).toMatchObject({
      kind: "guide",
      href: "/ar/docs/support/add-student",
    })
  })

  it("falls back to Arabic media on an English page", () => {
    const res = resourcesFor(addStudent, "en", labels, fixture)
    expect(res[0]?.kind).toBe("video")
    expect(res.filter((r) => r.kind === "image")[0]?.title).toBe("documents en")
    expect(res.at(-1)?.href).toBe("/en/docs/support/add-student")
  })

  it("an unpublished flow gives only the guide — never throws", () => {
    const res = resourcesFor(addStudent, "ar", labels, {})
    expect(res).toEqual([
      {
        kind: "guide",
        title: "إضافة طالب",
        href: "/ar/docs/support/add-student",
      },
    ])
  })
})

describe("isHelpIndexQuestion", () => {
  it("recognises the Support chip question in both languages", () => {
    expect(isHelpIndexQuestion("كيف تساعدني في استخدام بالقلم؟")).toBe(true)
    expect(
      isHelpIndexQuestion("What can you help me with in using Balqalam?")
    ).toBe(true)
    expect(isHelpIndexQuestion("how do I add a student?")).toBe(false)
  })
})

describe("SUPPORT_TOPICS (generated from the help guides)", () => {
  it("links every topic to its own guide page, never an FAQ anchor", () => {
    for (const t of SUPPORT_TOPICS) {
      expect(t.guide).not.toContain("#")
      if (t.slug !== "pricing") expect(t.guide).toBe(`/docs/support/${t.slug}`)
      expect(t.answer.ar && t.answer.en).toBeTruthy()
      expect(t.roles?.length).toBeGreaterThan(0)
    }
  })
})
