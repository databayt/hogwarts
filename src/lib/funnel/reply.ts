/**
 * Replies to wave emails — classify, strip the quote, match the sender.
 *
 * Stop-on-reply is the funnel's hardest rule, and a reply is a gate
 * transition (→ WARM), so what counts as one matters more than anything
 * else here. Rules only, zero tokens; anything the rules cannot call
 * confidently is `ambiguous` and goes to a human as a card, never guessed.
 *
 * The trap this file exists for: our email tells the school to reply with
 * «إيقاف» to opt out, and almost every reply QUOTES our email. So opt-out is
 * judged on the NEW text only — `newText()` cuts the quoted history first.
 */

export type SchoolReplyKind =
  | "reply"
  | "auto_reply"
  | "bounce"
  | "opt_out"
  | "ambiguous"

export interface MailIn {
  from: string
  subject: string
  body: string
}

const FREE_MAIL =
  /(^|\.)(gmail|googlemail|hotmail|outlook|live|yahoo|icloud|ymail|aol|proton(mail)?|msn)\./i

/** "Name <a@b.c>" → "a@b.c" (lowercased). */
export function senderAddress(from: string): string {
  const m = from.match(/<([^>]+)>/) ?? from.match(/([^\s<>]+@[^\s<>]+)/)
  return (m?.[1] ?? from).trim().toLowerCase()
}

/** The text above the first quote marker — what the person actually wrote. */
export function newText(body: string): string {
  const markers = [
    /^\s*>/m,
    /^On .{3,200}wrote:\s*$/m,
    /^في .{3,200}كتب.{0,40}:\s*$/m,
    /^-{2,}\s*Original Message\s*-{2,}/im,
    /^_{10,}\s*$/m,
    /^(From|من|De|Von):\s/m,
    /^Sent from my /m,
  ]
  let cut = body.length
  for (const re of markers) {
    const i = body.search(re)
    if (i >= 0 && i < cut) cut = i
  }
  return body.slice(0, cut).trim()
}

const BOUNCE =
  /mailer-daemon|postmaster|delivery status notification|undeliverable|delivery has failed|could not be delivered|returned mail|address not found|تعذر تسليم/i
const AUTO =
  /auto(matic|mated)?[- ]?(reply|response)|out of (the )?office|away from (the )?office|on (annual )?leave|رد آلي|رد تلقائي|خارج المكتب|في إجازة/i
const NOREPLY = /no-?reply|do-?not-?reply|notifications?@/i
const OPT_OUT =
  /إيقاف|ايقاف|أوقفوا|اوقفوا|لا نرغب|لا ترسلوا|الغاء الاشتراك|إلغاء الاشتراك|\bstop\b|unsubscribe|remove (me|us)|not interested/i

export function classifySchoolReply(m: MailIn): SchoolReplyKind {
  const head = `${m.from}\n${m.subject}`
  if (BOUNCE.test(head)) return "bounce"
  const fresh = newText(m.body)
  if (AUTO.test(`${m.subject}\n${fresh}`) || NOREPLY.test(m.from))
    return "auto_reply"
  // Short and says stop → opt-out. A long message that happens to contain
  // "not interested in X but…" is a person talking; a human reads it.
  if (fresh.length <= 160 && OPT_OUT.test(fresh)) return "opt_out"
  if (fresh.length > 0) return "reply"
  return "ambiguous"
}

export interface SentTarget {
  companyId: string
  email: string
  /** ISO time we sent — a mail received before it cannot be a reply. */
  at: string
}

/**
 * Which school wrote this? Exact address first; then the school's own domain
 * when it is not free mail (a principal often answers from their personal
 * address at the school's domain). Free-mail domains never match by domain —
 * every gmail user is not the same school.
 */
export function matchSender(
  from: string,
  receivedAt: Date,
  targets: SentTarget[]
): SentTarget | null {
  const addr = senderAddress(from)
  const eligible = targets.filter((t) => new Date(t.at) <= receivedAt)
  const exact = eligible.find((t) => t.email.toLowerCase() === addr)
  if (exact) return exact
  const domain = addr.split("@")[1] ?? ""
  if (!domain || FREE_MAIL.test(`${domain}.`)) return null
  const byDomain = eligible.filter(
    (t) => t.email.toLowerCase().split("@")[1] === domain
  )
  return byDomain.length === 1 ? byDomain[0] : null
}
