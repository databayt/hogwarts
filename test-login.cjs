const { webkit } = require("playwright")

;(async () => {
  const browser = await webkit.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  console.log("Going to login...")
  await page.goto("https://ed.databayt.org/en/login")
  await page.waitForTimeout(2000)

  console.log("Filling credentials...")
  await page.fill('input[type="email"]', "dev@databayt.org")
  await page.fill('input[type="password"]', "1234")

  console.log("Clicking login...")
  await page.click('button:has-text("Login")')
  await page.waitForTimeout(5000)

  await page.screenshot({ path: "/tmp/after-login.png" })
  console.log("After login screenshot saved")

  console.log("Going to overview...")
  await page.goto("https://ed.databayt.org/en/onboarding/overview")
  await page.waitForTimeout(3000)
  await page.screenshot({ path: "/tmp/overview-auth.png", fullPage: true })

  console.log("Going to /onboarding...")
  await page.goto("https://ed.databayt.org/en/onboarding")
  await page.waitForTimeout(3000)
  await page.screenshot({ path: "/tmp/base-auth.png", fullPage: true })

  await browser.close()
  console.log("Done!")
})()
