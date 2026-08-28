import { chromium } from "playwright"

const [route, word] = [process.argv[2], process.argv[3]]
;(async () => {
  const b = await chromium.launch({ headless: true })
  const p = await (
    await b.newContext({
      viewport: { width: 1440, height: 1000 },
      locale: "ar",
    })
  ).newPage()
  await p.goto("http://demo.localhost:3000/ar/login", { timeout: 90000 })
  await p.waitForLoadState("load")
  await p.waitForTimeout(1000)
  await p.locator('input[name="identifier"]').fill("accountant@databayt.org")
  await p.locator('input[name="password"]').fill("1234")
  await p.getByRole("button", { name: /^دخول$/ }).click()
  await p.waitForURL((u) => !/\/login/.test(u.toString()), { timeout: 60000 })
  await p.goto(`http://demo.localhost:3000/ar${route}`, {
    timeout: 90000,
    waitUntil: "load",
  })
  await p.waitForTimeout(3000)
  const ctx = await p.evaluate((w) => {
    const out: string[] = []
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT
    )
    let n: Node | null
    while ((n = walker.nextNode())) {
      const t = n.textContent ?? ""
      if (t.includes(w)) {
        const el = n.parentElement!
        out.push(
          `${el.tagName}.${el.className.toString().slice(0, 60)} :: ${t.trim().slice(0, 120)}`
        )
      }
    }
    return out
  }, word)
  console.log(ctx.slice(0, 8))
  await b.close()
})()
