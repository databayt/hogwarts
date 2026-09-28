import { describe, expect, it } from "vitest"

import {
  classifySchoolReply,
  matchSender,
  newText,
  senderAddress,
} from "@/lib/funnel/reply"

const OUR_EMAIL =
  "هل ترغبون أن نجهّز نسخة تجريبية باسم مدرستكم لتجربتها؟\n\nإن لم ترغبوا بمراسلاتنا مستقبلاً، يكفي الرد بكلمة «إيقاف»."

describe("newText", () => {
  it("cuts Gmail-style Arabic and English quote headers", () => {
    expect(newText(`نعم نرغب\n\nفي الاثنين، ٢٨ سبتمبر كتب فريق بالقلم:\n> ${OUR_EMAIL}`)).toBe("نعم نرغب")
    expect(newText(`Yes please\n\nOn Mon, 28 Sep 2026 at 10:00, Balqalam wrote:\n> hi`)).toBe("Yes please")
  })
  it("cuts Outlook-style headers", () => {
    expect(newText(`Interested.\n________________________________\nFrom: Balqalam\n${OUR_EMAIL}`)).toBe("Interested.")
    expect(newText(`مهتمون\nمن: فريق بالقلم\n${OUR_EMAIL}`)).toBe("مهتمون")
  })
})

describe("classifySchoolReply", () => {
  const m = (body: string, subject = "Re: منصة «بالقلم»", from = "principal@school.sa") => ({ from, subject, body })

  it("a real reply that quotes our opt-out line is a REPLY, not an opt-out", () => {
    expect(classifySchoolReply(m(`نعم، أرسلوا التفاصيل\n\nOn Mon wrote:\n> ${OUR_EMAIL}`))).toBe("reply")
  })
  it("the one-word opt-out is an opt-out", () => {
    expect(classifySchoolReply(m(`إيقاف\n\nOn Mon wrote:\n> ${OUR_EMAIL}`))).toBe("opt_out")
    expect(classifySchoolReply(m("stop"))).toBe("opt_out")
    expect(classifySchoolReply(m("Please remove us from your list"))).toBe("opt_out")
  })
  it("out-of-office is an auto-reply", () => {
    expect(classifySchoolReply(m("I am out of the office until Sunday", "Automatic reply: منصة"))).toBe("auto_reply")
    expect(classifySchoolReply(m("رد آلي: المدير في إجازة"))).toBe("auto_reply")
  })
  it("a no-reply sender is an auto-reply", () => {
    expect(classifySchoolReply(m("Ticket #123 received", "Re: x", "no-reply@helpdesk.school.sa"))).toBe("auto_reply")
  })
  it("a bounce is a bounce", () => {
    expect(classifySchoolReply(m("…", "Undeliverable: منصة", "postmaster@school.sa"))).toBe("bounce")
  })
  it("an empty new text is ambiguous", () => {
    expect(classifySchoolReply(m(`> ${OUR_EMAIL}`))).toBe("ambiguous")
  })
})

describe("senderAddress", () => {
  it("extracts and lowercases", () => {
    expect(senderAddress("Head <Head@School.SA>")).toBe("head@school.sa")
    expect(senderAddress("a@b.co")).toBe("a@b.co")
  })
})

describe("matchSender", () => {
  const targets = [
    { companyId: "1", email: "principal@das.sch.sa", at: "2026-09-28T08:00:00Z" },
    { companyId: "2", email: "school@gmail.com", at: "2026-09-28T08:00:00Z" },
  ]
  const after = new Date("2026-09-29T08:00:00Z")

  it("matches the exact address", () => {
    expect(matchSender("P <principal@das.sch.sa>", after, targets)?.companyId).toBe("1")
  })
  it("matches a colleague at the same school domain", () => {
    expect(matchSender("deputy@das.sch.sa", after, targets)?.companyId).toBe("1")
  })
  it("never matches free mail by domain", () => {
    expect(matchSender("someone.else@gmail.com", after, targets)).toBeNull()
  })
  it("ignores mail received before we sent", () => {
    expect(matchSender("principal@das.sch.sa", new Date("2026-09-27T00:00:00Z"), targets)).toBeNull()
  })
})
