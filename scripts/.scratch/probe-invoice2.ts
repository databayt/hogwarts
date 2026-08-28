import { chromium } from "playwright"

;(async () => {
  const b = await chromium.launch({ headless: true })
  const p = await (
    await b.newContext({ viewport: { width: 1440, height: 1000 } })
  ).newPage()
  const posts: string[] = []
  p.on("request", (r) => {
    if (r.method() === "POST" && r.url().includes("/finance/invoice"))
      posts.push(
        `${r.headers()["next-action"] ?? "?"} body=${(r.postData() ?? "").slice(0, 120)}`
      )
  })
  await p.goto("http://demo.localhost:3000/ar/login", { timeout: 90000 })
  await p.waitForLoadState("load")
  await p.waitForTimeout(1000)
  await p.locator('input[name="identifier"]').fill("accountant@balqalam.com")
  await p.locator('input[name="password"]').fill("1234")
  await p.getByRole("button", { name: /^دخول$/ }).click()
  await p.waitForURL((u) => !/\/login/.test(u.toString()), { timeout: 60000 })
  posts.length = 0
  await p.goto("http://demo.localhost:3000/ar/finance/invoice", {
    timeout: 90000,
    waitUntil: "load",
  })
  await p.waitForTimeout(8000)
  console.log("POSTs:", posts.length)
  console.log([...new Set(posts)].slice(0, 5))
  await b.close()
})()
