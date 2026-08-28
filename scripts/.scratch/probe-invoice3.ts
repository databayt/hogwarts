import { chromium } from "playwright"

;(async () => {
  const b = await chromium.launch({ headless: true })
  const p = await (
    await b.newContext({ viewport: { width: 1440, height: 1000 } })
  ).newPage()
  const logs: string[] = []
  p.on("console", (m) => {
    const t = m.text()
    if (t.startsWith("[PROBE")) logs.push(t.slice(0, 300))
  })
  await p.addInitScript(() => {
    const orig = window.fetch
    let n = 0
    // @ts-ignore
    window.fetch = function (input: any, init?: any) {
      const url = typeof input === "string" ? input : input?.url
      if (init?.method === "POST" && String(url).includes("/finance/invoice")) {
        n++
        if (n <= 3)
          console.log("[PROBE] POST#" + n + " stack:\n" + new Error().stack)
      }
      return orig.apply(this, arguments as any)
    }
  })
  await p.goto("http://demo.localhost:3000/ar/login", { timeout: 90000 })
  await p.waitForLoadState("load")
  await p.waitForTimeout(1000)
  await p.locator('input[name="identifier"]').fill("accountant@databayt.org")
  await p.locator('input[name="password"]').fill("1234")
  await p.getByRole("button", { name: /^دخول$/ }).click()
  await p.waitForURL((u) => !/\/login/.test(u.toString()), { timeout: 60000 })
  logs.length = 0
  await p.goto("http://demo.localhost:3000/ar/finance/invoice", {
    timeout: 90000,
    waitUntil: "load",
  })
  await p.waitForTimeout(6000)
  console.log(logs.slice(0, 40).join("\n"))
  await b.close()
})()
