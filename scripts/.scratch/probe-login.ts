import { chromium } from "playwright"

;(async () => {
  const b = await chromium.launch({ headless: true })
  const p = await b.newPage()
  await p.goto("http://demo.localhost:3000/ar/login", { timeout: 90000 })
  await p.waitForLoadState("load")
  await p.waitForTimeout(3000)
  console.log("URL:", p.url())
  const inputs = await p
    .locator("input")
    .evaluateAll((els) =>
      els.map(
        (e) =>
          `${(e as HTMLInputElement).type}|${(e as HTMLInputElement).name}|${(e as HTMLInputElement).id}|${(e as HTMLInputElement).placeholder}`
      )
    )
  console.log("inputs:", inputs)
  const buttons = await p
    .locator("button")
    .evaluateAll((els) => els.map((e) => e.textContent?.trim().slice(0, 40)))
  console.log("buttons:", buttons)
  await p.screenshot({
    path: "/private/tmp/claude-501/-Users-abdout-hogwarts/c93b394c-c33c-4691-82db-e3eddb4c0788/scratchpad/login.png",
  })
  await b.close()
})()
