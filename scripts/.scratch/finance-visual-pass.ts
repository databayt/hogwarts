// Visual/i18n pass over the finance block on the local demo school.
// Usage: pnpm tsx scripts/.scratch/finance-visual-pass.ts [role] [lang]
import { mkdirSync, writeFileSync } from "fs"
import { chromium, type Page } from "playwright"

const ROLE = process.argv[2] ?? "accountant"
const LANG = process.argv[3] ?? "ar"
const BASE = "http://demo.localhost:3000"
const OUT = `/private/tmp/claude-501/-Users-abdout-hogwarts/c93b394c-c33c-4691-82db-e3eddb4c0788/scratchpad/shots/${ROLE}-${LANG}`
mkdirSync(OUT, { recursive: true })

const CREDS: Record<string, string> = {
  accountant: "accountant@balqalam.com",
  admin: "admin@balqalam.com",
  teacher: "teacher@balqalam.com",
  student: "student@balqalam.com",
}

const ALL_ROUTES = [
  "/finance",
  "/finance/dashboard",
  "/finance/fees",
  "/finance/fees/structures",
  "/finance/fees/assignments",
  "/finance/fees/payments",
  "/finance/fees/fines",
  "/finance/fees/scholarships",
  "/finance/fees/reports",
  "/finance/invoice",
  "/finance/accounts",
  "/finance/accounts/chart",
  "/finance/accounts/journal",
  "/finance/accounts/ledger",
  "/finance/reports",
  "/finance/reports/balance-sheet",
  "/finance/reports/profit-loss",
  "/finance/reports/trial-balance",
  "/finance/budget",
  "/finance/budget/all",
  "/finance/expenses",
  "/finance/expenses/all",
  "/finance/expenses/categories",
  "/finance/wallet",
  "/finance/wallet/all",
  "/finance/wallet/transactions",
  "/finance/payroll",
  "/finance/payroll/runs",
  "/finance/salary",
  "/finance/timesheet",
  "/finance/timesheet/entries",
  "/finance/timesheet/periods",
  "/finance/banking",
  "/finance/receipt",
  "/finance/receipt/manage-plan",
  "/finance/permissions",
  "/finance/payroll/my",
  "/finance/fees/structures/new",
  "/finance/invoice/add/x/details",
]

const ROUTES = process.env.ROUTES ? process.env.ROUTES.split(",") : ALL_ROUTES

async function login(page: Page) {
  await page.goto(`${BASE}/${LANG}/login`, { timeout: 60_000 })
  await page.waitForLoadState("load")
  const btn = page.getByRole("button", {
    name: /^(sign in|login|log in|تسجيل الدخول|دخول)$/i,
  })
  await btn.waitFor({ state: "visible", timeout: 20_000 })
  await page.waitForTimeout(1000)
  await page
    .locator('input[name="identifier"], input[name="email"]')
    .first()
    .fill(CREDS[ROLE])
  await page.locator('input[name="password"]').fill("1234")
  await btn.click()
  await page.waitForURL((u) => !/\/login/.test(u.toString()), {
    timeout: 60_000,
  })
}

// Latin words that are NOT acceptable on an Arabic page (excluding codes/currency/numbers)
const LATIN_WORD = /\b[A-Za-z]{4,}\b/g
const ALLOW = new Set([
  "SDG",
  "USD",
  "AED",
  "SAR",
  "PDF",
  "CSV",
  "IBAN",
  "Plaid",
  "Stripe",
  "Bankak",
  "Cashi",
  "Excel",
  "Google",
  "email",
  "Email",
  "databayt",
  "Databayt",
  "localhost",
  "demo",
])

const report: Record<string, unknown>[] = []
;(async () => {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    locale: LANG === "ar" ? "ar" : "en",
  })
  const page = await ctx.newPage()
  const consoleErrors: string[] = []
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text().slice(0, 200))
  })
  page.on("pageerror", (e) =>
    consoleErrors.push("PAGEERROR " + e.message.slice(0, 200))
  )
  await login(page)
  for (const route of ROUTES) {
    consoleErrors.length = 0
    const url = `${BASE}/${LANG}${route}`
    let status = 0
    try {
      const res = await page.goto(url, {
        timeout: 60_000,
        waitUntil: "networkidle",
      })
      status = res?.status() ?? 0
    } catch (e) {
      report.push({ route, error: String(e).slice(0, 200) })
      continue
    }
    await page.waitForTimeout(600)
    const main = page.locator("main").first()
    const text = (
      (await await main.count()) ? main.innerText() : page.innerText("body")
    ).catch(() => "")
    const body = await text
    const dir = await page.evaluate(() =>
      document.documentElement.getAttribute("dir")
    )
    const h1 = await page
      .locator("h1, h2, h3")
      .first()
      .innerText()
      .catch(() => "")
    const latin =
      LANG === "ar"
        ? [
            ...new Set(
              (body.match(LATIN_WORD) ?? []).filter(
                (w) => !ALLOW.has(w) && !/^[A-Z0-9_]+$/.test(w)
              )
            ),
          ]
        : []
    const rawEnums = [
      ...new Set(body.match(/\b[A-Z]{3,}(?:_[A-Z]+)+\b/g) ?? []),
    ]
    const denied =
      /لا تملك صلاحية|ليس لديك|permission|Access denied|غير مصرح/i.test(body)
    const file = `${OUT}/${route.replace(/\//g, "_").replace(/^_/, "") || "root"}.png`
    await page.screenshot({ path: file, fullPage: false })
    report.push({
      route,
      status,
      dir,
      heading: h1.slice(0, 60),
      denied,
      latinWords: latin.slice(0, 25),
      rawEnums: rawEnums.slice(0, 15),
      consoleErrors: consoleErrors.slice(0, 5),
      textLen: body.length,
    })
    console.log(
      `${status} ${route} dir=${dir} denied=${denied} latin=${latin.length} enums=${rawEnums.length} errs=${consoleErrors.length}`
    )
  }
  writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 1))
  await browser.close()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
