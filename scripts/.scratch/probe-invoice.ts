import { chromium } from "playwright"

;(async () => {
  const b = await chromium.launch({ headless: true })
  const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } })
  const p = await ctx.newPage()
  const errs: string[] = []
  const reqs: Record<string, number> = {}
  p.on("console", (m) => {
    if (m.type() === "error") errs.push(m.text().slice(0, 300))
  })
  p.on("request", (r) => {
    const u = r.url().replace(/\?.*$/, "")
    reqs[u] = (reqs[u] ?? 0) + 1
  })
  await p.goto("http://demo.localhost:3000/ar/login", { timeout: 90000 })
  await p.waitForLoadState("load")
  await p.waitForTimeout(1000)
  await p.locator('input[name="identifier"]').fill("accountant@databayt.org")
  await p.locator('input[name="password"]').fill("1234")
  await p.getByRole("button", { name: /^دخول$/ }).click()
  await p.waitForURL((u) => !/\/login/.test(u.toString()), { timeout: 60000 })
  errs.length = 0
  for (const k of Object.keys(reqs)) delete reqs[k]
  const t0 = Date.now()
  await p.goto("http://demo.localhost:3000/ar/finance/invoice", {
    timeout: 90000,
    waitUntil: "load",
  })
  console.log("load ms:", Date.now() - t0)
  await p.waitForTimeout(15000)
  console.log("errors:", errs.length)
  const uniq = [
    ...new Set(errs.map((e) => e.replace(/%c|%s/g, "").slice(0, 160))),
  ]
  console.log(uniq.slice(0, 6))
  const hot = Object.entries(reqs)
    .filter(([, n]) => n > 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
  console.log("repeated requests in 15s:", hot)
  await p.screenshot({
    path: "/private/tmp/claude-501/-Users-abdout-hogwarts/c93b394c-c33c-4691-82db-e3eddb4c0788/scratchpad/shots/invoice-ar.png",
  })
  await b.close()
})()
