// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import "server-only"

/**
 * A scripted model for end-to-end tests: `CHATBOT_FAKE_PROVIDER=1` on a dev
 * server makes every answer this, with no provider and no cost. It streams
 * in small pieces, slowly enough that a test sees the typing dots, a Stop
 * press and a partial answer. A question containing "break" fails halfway,
 * to exercise the cut-off path. Never in production.
 */
export function fakeProviderEnabled(): boolean {
  return (
    process.env.CHATBOT_FAKE_PROVIDER === "1" &&
    process.env.NODE_ENV !== "production"
  )
}

const ANSWER = {
  en: "1. Open **Students** from the sidebar.\n2. Press **Add student** and fill in the form.\n3. Press **Save** — the student gets a login.",
  ar: "1. افتح **الطلاب** من القائمة الجانبية.\n2. اضغط **إضافة طالب** واملأ النموذج.\n3. اضغط **حفظ** — يحصل الطالب على حساب دخول.",
}

export async function* fakeAnswer(
  question: string,
  locale: string,
  signal?: AbortSignal
): AsyncGenerator<string> {
  const text = ANSWER[locale === "ar" ? "ar" : "en"]
  const breaks = /break/i.test(question)
  await new Promise((r) => setTimeout(r, 600))
  for (let i = 0; i < text.length; i += 6) {
    if (signal?.aborted) return
    if (breaks && i > text.length / 2) throw new Error("fake provider broke")
    yield text.slice(i, i + 6)
    await new Promise((r) => setTimeout(r, 40))
  }
}
