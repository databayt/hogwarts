import { chromium } from "playwright"

;(async () => {
  const b = await chromium.launch({ headless: true })
  const p = await (
    await b.newContext({
      viewport: { width: 1440, height: 1100 },
      locale: "ar",
    })
  ).newPage()
  const errs: string[] = []
  p.on("console", (m) => {
    if (m.type() === "error") errs.push(m.text().slice(0, 160))
  })
  await p.goto("http://demo.localhost:3000/ar/login", { timeout: 90000 })
  await p.waitForLoadState("load")
  await p.waitForTimeout(1000)
  await p.locator('input[name="identifier"]').fill("accountant@databayt.org")
  await p.locator('input[name="password"]').fill("1234")
  await p.getByRole("button", { name: /^دخول$/ }).click()
  await p.waitForURL((u) => !/\/login/.test(u.toString()), { timeout: 60000 })
  errs.length = 0
  await p.goto("http://demo.localhost:3000/ar/finance", {
    timeout: 90000,
    waitUntil: "load",
  })
  await p.waitForTimeout(5000)
  const ticks = await p
    .locator(".recharts-cartesian-axis-tick-value")
    .allInnerTexts()
  console.log("axis ticks:", [...new Set(ticks)].slice(0, 20))
  console.log(
    "NaN errors:",
    errs.filter((e) => /NaN/.test(e)).length,
    "other errors:",
    errs.filter((e) => !/NaN|WebSocket|socket/.test(e)).slice(0, 3)
  )
  const radial = await p.locator("text.fill-foreground, tspan").allInnerTexts()
  console.log("radial/text nodes sample:", radial.slice(0, 8))
  await p.screenshot({
    path: "/private/tmp/claude-501/-Users-abdout-hogwarts/c93b394c-c33c-4691-82db-e3eddb4c0788/scratchpad/shots/hub-ar.png",
    fullPage: true,
  })
  await b.close()
})()
