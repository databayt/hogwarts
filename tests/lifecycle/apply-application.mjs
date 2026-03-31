/**
 * Lifecycle Test - Phase 3: Submit Application
 * Login → Fill all steps → Submit
 */
import { mkdirSync } from "fs"
import { chromium } from "@playwright/test"

mkdirSync("tests/lifecycle/screenshots", { recursive: true })

const BASE = "http://kingfahad.localhost:3000"
const CAMPAIGN_ID = "cmne7syg000qpsdaaj9uqdrrj"
const LOCALE = "en"

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function setFormScript(fieldValues) {
  return `(function() {
    const el = document.querySelector('form') || document.querySelector('input');
    if (!el) return JSON.stringify({error:'no form'});
    const fk = Object.keys(el).find(k=>k.startsWith('__reactFiber'));
    if (!fk) return JSON.stringify({error:'no fiber'});
    let f=el[fk], form=null, i=0;
    while(f&&i<300){i++;const p=f.memoizedProps;
      if(p&&p.value&&typeof p.value.setValue==='function'&&typeof p.value.getValues==='function'){form=p.value;break}
      f=f.return}
    if(!form) return JSON.stringify({error:'no form instance'});
    const fv=${JSON.stringify(fieldValues)};
    for(const[k,v]of Object.entries(fv)){form.setValue(k,v,{shouldValidate:true,shouldDirty:true,shouldTouch:true})}
    return JSON.stringify({ok:true,vals:form.getValues()});
  })()`
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })
  const page = await ctx.newPage()
  page.on("dialog", (d) => d.accept())
  page.setDefaultTimeout(30000)

  async function go(url) {
    await page.goto(url, { waitUntil: "load", timeout: 60000 }).catch(() => {})
    await sleep(4000)
  }

  try {
    // LOGIN
    console.log("=== LOGIN ===")
    // First load is slow due to Turbopack compilation
    await page.goto(`${BASE}/${LOCALE}/login`, {
      waitUntil: "networkidle",
      timeout: 90000,
    })
    await sleep(3000)
    await page.waitForSelector('input[type="email"], input[name="email"]', {
      timeout: 20000,
    })
    await page
      .locator('input[name="email"], input[type="email"]')
      .first()
      .fill("applicant@databayt.org")
    await page
      .locator('input[name="password"], input[type="password"]')
      .first()
      .fill("1234")
    await page.locator('button[type="submit"]').first().click()
    await page
      .waitForURL((u) => !u.pathname.includes("/login"), { timeout: 20000 })
      .catch(() => {})
    await sleep(3000)

    const cookies = await ctx.cookies()
    const hasSession = cookies.some((c) => c.name === "authjs.session-token")
    console.log(`  Logged in: ${hasSession}, URL: ${page.url()}`)
    if (!hasSession) throw new Error("Login failed")

    // OVERVIEW - Get Started
    console.log("=== OVERVIEW ===")
    await go(`${BASE}/${LOCALE}/application/overview?id=${CAMPAIGN_ID}`)
    const gs = page
      .locator('button:has-text("Get Started"), button:has-text("ابدأ")')
      .first()
    if (await gs.isVisible({ timeout: 3000 }).catch(() => false)) {
      await gs.click()
      await sleep(4000)
    }
    console.log(`  URL: ${page.url()}`)

    // FILL EACH STEP
    const steps = [
      {
        name: "personal",
        path: "personal",
        data: {
          firstName: "Ahmed",
          middleName: "Mohammed",
          lastName: "Ali",
          dateOfBirth: "2014-05-15",
          gender: "MALE",
          nationality: "SD",
          category: "general",
          religion: "",
        },
      },
      {
        name: "contact",
        path: "contact",
        data: {
          email: "applicant@databayt.org",
          phone: "+249912345678",
          alternatePhone: "",
        },
      },
      {
        name: "location",
        path: "location",
        data: {
          address: "123 Nile Avenue",
          city: "Khartoum",
          state: "Khartoum",
          postalCode: "11111",
          country: "SD",
        },
      },
      {
        name: "guardian",
        path: "guardian",
        data: {
          fatherName: "Mohammed Ali Hassan",
          fatherOccupation: "Engineer",
          fatherPhone: "+249912345679",
          fatherEmail: "mohammed@example.com",
          motherName: "Fatima Ahmed",
          motherOccupation: "Teacher",
          motherPhone: "+249912345680",
          motherEmail: "",
          guardianName: "",
          guardianRelation: "",
          guardianPhone: "",
          guardianEmail: "",
        },
      },
      {
        name: "academic",
        path: "academic",
        data: {
          previousSchool: "Al-Noor International School",
          previousClass: "الصف السادس",
          previousPercentage: "excellent",
          applyingForClass: "الصف السابع",
          preferredStream: "science",
          secondLanguage: "",
          thirdLanguage: "",
          achievements: "Top student in science and mathematics.",
        },
      },
    ]

    for (const step of steps) {
      console.log(`=== ${step.name.toUpperCase()} ===`)
      await go(`${BASE}/${LOCALE}/application/${CAMPAIGN_ID}/${step.path}`)
      if (page.url().includes("/login"))
        throw new Error(`Redirected to login at ${step.name}`)
      const r = await page.evaluate(setFormScript(step.data))
      const parsed = JSON.parse(r)
      console.log(`  ${parsed.ok ? "OK" : "FAIL: " + parsed.error}`)
      await sleep(1500)
    }

    // INJECT ALL FORM DATA INTO CONTEXT + SUBMIT
    console.log("=== INJECT CONTEXT + SUBMIT ===")

    // Step 1: Inject all form data into ApplicationContext
    const allData = {}
    for (const s of steps) allData[s.name] = s.data

    await page.evaluate((allData) => {
      const el = document.querySelector("form") || document.body
      const fk = Object.keys(el).find((k) => k.startsWith("__reactFiber"))
      if (!fk) return
      let f = el[fk],
        i = 0
      while (f && i < 500) {
        i++
        const p = f.memoizedProps
        if (p?.value?.updateStepData && p?.value?.session) {
          for (const [step, data] of Object.entries(allData)) {
            p.value.updateStepData(step, data)
          }
          return
        }
        f = f.return
      }
    }, allData)

    // Wait for React to process
    await sleep(5000)

    // Step 2: Verify context
    const verify = await page.evaluate(() => {
      const el = document.querySelector("form") || document.body
      const fk = Object.keys(el).find((k) => k.startsWith("__reactFiber"))
      if (!fk) return { error: "no fiber" }
      let f = el[fk],
        i = 0
      while (f && i < 500) {
        i++
        const p = f.memoizedProps
        if (p?.value?.session?.formData) {
          const fd = p.value.session.formData
          return {
            steps: Object.keys(fd).filter(
              (k) => fd[k] && Object.keys(fd[k]).length > 0
            ),
            token: p.value.session.sessionToken,
          }
        }
        f = f.return
      }
      return { error: "no context" }
    })
    console.log(`  Context steps: ${JSON.stringify(verify)}`)

    // Step 3: Trigger submission via onNext
    console.log("=== SUBMIT ===")
    const submitResult = await page.evaluate(async () => {
      const el = document.querySelector("form") || document.body
      const fk = Object.keys(el).find((k) => k.startsWith("__reactFiber"))
      if (!fk) return { error: "no fiber" }
      let f = el[fk],
        i = 0
      while (f && i < 500) {
        i++
        const p = f.memoizedProps
        if (p?.value?.customNavigation?.onNext) {
          try {
            await p.value.customNavigation.onNext()
            return { ok: true }
          } catch (e) {
            return { error: e.message }
          }
        }
        f = f.return
      }
      return { error: "no onNext" }
    })
    console.log(`  Submit result: ${JSON.stringify(submitResult)}`)
    await sleep(10000)

    console.log(`  Final URL: ${page.url()}`)
    await page
      .screenshot({
        path: "tests/lifecycle/screenshots/final.png",
        timeout: 10000,
      })
      .catch(() => {})

    // Check DB for application
    const bodyText = await page.textContent("body").catch(() => "")
    const appMatch = bodyText.match(/APP-\d+/)
    if (appMatch) {
      console.log(`\n✅ Application submitted: ${appMatch[0]}`)
    } else if (submitResult.ok) {
      console.log(`\n✅ Submit returned OK. Checking for success indicators...`)
      const hasSuccess =
        bodyText.toLowerCase().includes("success") ||
        bodyText.includes("نجح") ||
        bodyText.includes("تم")
      console.log(`  Success text: ${hasSuccess}`)
    } else {
      console.log(`\n❌ Submit failed: ${submitResult.error}`)
      // Get alert text
      const alert = await page
        .locator('[role="alert"]')
        .textContent()
        .catch(() => "none")
      console.log(`  Alert: ${alert}`)
    }
  } catch (err) {
    console.error(`\n❌ ERROR: ${err.message}`)
    await page
      .screenshot({
        path: "tests/lifecycle/screenshots/error.png",
        timeout: 5000,
      })
      .catch(() => {})
  } finally {
    await browser.close()
    console.log("\nDone.")
  }
}

main().catch(console.error)
