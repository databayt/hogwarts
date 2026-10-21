import { describe, expect, it } from "vitest"

import {
  formatSupport,
  isHelpIndexQuestion,
  isSupportQuestion,
  matchTopics,
  normalize,
  SUPPORT_TOPICS,
  supportRoleOf,
  terms,
} from "@/components/chatbot/support"
import { resourcesFor } from "@/components/chatbot/support-media"
import { flowStills } from "@/components/docs/media"
import type { ImageMedia, VideoMedia } from "@/components/docs/media"

const top = (...texts: string[]) => matchTopics(texts)[0]?.slug

// The online-school guides (2026-10-19): what students, teachers, parents
// and admins actually ask, in both languages.
describe("matchTopics — online school", () => {
  it.each([
    ["كيف أنضم إلى حصتي المباشرة؟", "live-classes"],
    ["ما اقدر انضم للحصة", "live-classes"],
    ["How do I join my live class?", "live-classes"],
    ["كيف أبدأ الحصة المباشرة وأنهيها؟", "teach-live"],
    ["how do I start and end my live class", "teach-live"],
    ["كيف أسلّم واجبي مع ملف؟", "homework"],
    ["how do I hand in my homework with a photo", "homework"],
    ["كيف أصحح الواجبات", "homework"],
    ["كيف أشغّل مدرستي عن بُعد؟", "online-school"],
    ["how do I run my school online", "online-school"],
    ["كيف أعلن عطلة العيد", "holidays"],
    ["how do I declare a holiday", "holidays"],
    ["لا تصلني إشعارات", "notifications"],
    ["how do I turn on push notifications", "notifications"],
    ["كيف أنشئ بطاقة خروج", "quick-checks"],
    ["create an exit ticket", "quick-checks"],
    // the dashboard quick asks themselves
    ["How do I join my live class?", "live-classes"],
    ["How do I hand in my homework with a file?", "homework"],
    ["How do I start and end my live class?", "teach-live"],
    ["How can I watch my child's live class?", "live-classes"],
    ["How do I run my school online?", "online-school"],
    ["كيف أتابع حصة ابني المباشرة؟", "live-classes"],
  ])("%s → %s", (question, slug) => {
    expect(top(question)).toBe(slug)
  })

  it("a student reads student guides and still the parent ones", () => {
    const index = formatSupport("en", [], { role: "student" })
    expect(index).toContain("Join a live class")
    expect(index).toContain("Homework")
    // parents.mdx is a parent guide; students share the portal
    expect(index).toMatch(/Parents|parent/i)
    expect(index).not.toContain("Run your school online")
  })
})

describe("normalize", () => {
  it("folds alef, ta-marbuta and tashkeel", () => {
    expect(normalize("إِضافةُ طالبٍ")).toBe("اضافه طالب")
    expect(normalize("كلمة المرور؟")).toBe("كلمه المرور")
  })
})

describe("terms", () => {
  it("drops stop words and folds the article, plurals and particles", () => {
    expect(terms("كيف أرصد درجات الامتحانات؟")).toEqual([
      "ارصد",
      "درج",
      "امتحان",
    ])
    expect(terms("How do I print the report cards")).toEqual([
      "print",
      "report",
      "card",
    ])
  })
})

describe("matchTopics", () => {
  it("attaches nothing to a question no guide covers", () => {
    expect(matchTopics(["what's the weather today?"])).toEqual([])
    expect(matchTopics(["مرحبا"])).toEqual([])
  })

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

  it("orders stills by their shot number, not manifest position", () => {
    // a step re-published later lands at the end of the manifest
    const late = {
      "add-student/created-ar": { ...image("created"), order: 3 },
      "add-student/list-ar": { ...image("list"), order: 1 },
      "add-student/documents-ar": { ...image("documents"), order: 2 },
    }
    expect(flowStills("add-student", "ar", late)).toEqual([
      "add-student/list-ar",
      "add-student/documents-ar",
      "add-student/created-ar",
    ])
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

  it("borrows images by manifest id, and prefixes the help-center origin", () => {
    const login = {
      ...addStudent,
      flow: undefined,
      media: ["add-student/father-ar"],
    }
    const res = resourcesFor(
      login,
      "ar",
      labels,
      fixture,
      "https://balqalam.com"
    )
    expect(res.map((r) => r.kind)).toEqual(["image", "guide"])
    expect(res[0]?.title).toBe("father ar")
    expect(res.at(-1)?.href).toBe(
      "https://balqalam.com/ar/docs/support/add-student"
    )
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

describe("dashboard support desk", () => {
  it("maps every UserRole to a help-center audience", () => {
    expect(supportRoleOf("TEACHER")).toBe("teacher")
    expect(supportRoleOf("GUARDIAN")).toBe("parent")
    expect(supportRoleOf("STUDENT")).toBe("student")
    for (const r of ["ADMIN", "DEVELOPER", "ACCOUNTANT", "STAFF", undefined])
      expect(supportRoleOf(r)).toBe("admin")
  })

  it("lists only the guides written for the member's role", () => {
    const index = formatSupport("en", [], { role: "parent" })
    for (const t of SUPPORT_TOPICS) {
      const listed = index.includes(`- ${t.title.en}:`)
      expect(listed).toBe(!t.roles?.length || t.roles.includes("parent"))
    }
  })

  it("names the attached media under the first matched guide only", () => {
    const [a, b] = SUPPORT_TOPICS
    const out = formatSupport("en", [a!, b!], { attached: ["Step one"] })
    expect(out).toContain(`${a!.answer.en}\nAttached below: Step one`)
    expect(out.match(/Attached below/g)).toHaveLength(1)
  })

  it("puts the guide written for the member's role first", () => {
    const q = "كيف أرصد درجات الامتحان؟"
    expect(matchTopics([q], 3, "teacher")[0]?.slug).toBe("exams")
    expect(matchTopics([q], 3, "parent")[0]?.slug).toBe("grades")
  })

  it.each([
    ["How do I enter exam marks?", "exams"],
    ["أين أرى درجات ابني؟", "grades"],
    ["report card", "grades"],
    ["أين أجد جدولي الدراسي؟", "timetable"],
    ["Where do I see my timetable?", "timetable"],
    ["كيف أسجّل حضور فصلي؟", "attendance"],
    ["كيف أحدد رسوم صف دراسي؟", "fees"],
    ["How do I see my child's fees?", "fees"],
    ["كيف أعطي موظفًا صلاحية الدخول؟", "roles"],
    ["How do I give a staff member access?", "roles"],
    ["كيف أغيّر كلمة المرور أو أستعيدها؟", "login"],
  ])("dashboard quick ask %s → %s", (question, slug) => {
    expect(top(question)).toBe(slug)
  })
})

// 2026-10-21: real questions the help index swallowed, and guides attached
// by one common word.
describe("help index — only the question itself", () => {
  it.each([
    "Can you help me add a student?",
    "هل تساعدني في إضافة طالب؟",
    "What can you do for a school of 300 students?",
    "can you help me reset my password",
  ])("lets %s reach the guides", (q) => {
    expect(isHelpIndexQuestion(q)).toBe(false)
  })

  it.each([
    "What can you help me with in using Balqalam?",
    "كيف تساعدني في استخدام بالقلم؟",
    "what can you do?",
    "هل تساعدني؟",
    "ايش تقدر تسوي",
  ])("still answers %s with the guide list", (q) => {
    expect(isHelpIndexQuestion(q)).toBe(true)
  })

  it("matches the chip's exact text whatever words it holds", () => {
    expect(isHelpIndexQuestion("Show me around", ["Show me around"])).toBe(true)
  })
})

describe("matchTopics — term-only floor and the desk", () => {
  const desk = (q: string, role: "admin" | "teacher" | "parent" = "admin") =>
    matchTopics([q], 3, role, { excludeSales: true }).map((t) => t.slug)

  it("attaches nothing for one common word", () => {
    expect(matchTopics(["change the school logo"])).toEqual([])
    expect(matchTopics(["the page is blank"])).toEqual([])
  })

  it("never offers sales guides on the desk", () => {
    expect(desk("how do I set up the timetable")).not.toContain("get-started")
    expect(desk("كيف أحذف طالب")).not.toContain("pricing")
    expect(desk("how much does it cost")).toEqual([])
  })

  it("still finds the guide a member asked for", () => {
    expect(desk("how do I set up the timetable")[0]).toBe("timetable")
    expect(desk("forgot my password", "teacher")[0]).toBe("login")
    expect(desk("كيف ادفع الرسوم", "parent")[0]).toBe("fees")
  })
})

describe("matchTopics — a new question is about itself", () => {
  it("doesn't let the previous question outvote the new one", () => {
    expect(
      matchTopics(["كيف أسجل الحضور؟", "كيف أضيف طالب جديد؟"], 3, "admin", {
        excludeSales: true,
      })[0]?.slug
    ).toBe("attendance")
    expect(
      matchTopics(["how do I mark attendance", "how do I add a student"])[0]
        ?.slug
    ).toBe("attendance")
  })
})
