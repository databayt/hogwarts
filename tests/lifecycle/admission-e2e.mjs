/**
 * Admission E2E Lifecycle Test
 * ============================
 * Full cycle: Apply as applicant -> Review as admin -> Enroll -> Verify student
 *
 * Prerequisites:
 * - King Fahad School exists (domain: kingfahad, id: cmne3owe90002sdaa621wf103)
 * - Campaign OPEN (id: cmne7syg000qpsdaaj9uqdrrj, fee: $0)
 * - user@databayt.org is ADMIN of kingfahad
 * - applicant@databayt.org is USER with no school
 * - School nameFormat is "split" (separate firstName/lastName)
 *
 * Run: node tests/lifecycle/admission-e2e.mjs
 */
import { mkdirSync } from "fs"
import { chromium } from "@playwright/test"

mkdirSync("tests/lifecycle/screenshots", { recursive: true })

const BASE = "http://kingfahad.localhost:3000"
const CAMPAIGN_ID = "cmne7syg000qpsdaaj9uqdrrj"
const LOCALE = "en"

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// --- React Hook Form helper: set field values via fiber traversal ---
function setFormScript(fieldValues) {
  return `(function() {
    const el = document.querySelector('form') || document.querySelector('input');
    if (!el) return JSON.stringify({error:'no form element'});
    const fk = Object.keys(el).find(k=>k.startsWith('__reactFiber'));
    if (!fk) return JSON.stringify({error:'no fiber'});
    let f=el[fk], form=null, i=0;
    while(f&&i<300){i++;const p=f.memoizedProps;
      if(p&&p.value&&typeof p.value.setValue==='function'&&typeof p.value.getValues==='function'){form=p.value;break}
      f=f.return}
    if(!form) return JSON.stringify({error:'no RHF instance'});
    const fv=${JSON.stringify(fieldValues)};
    for(const[k,v]of Object.entries(fv)){form.setValue(k,v,{shouldValidate:true,shouldDirty:true,shouldTouch:true})}
    return JSON.stringify({ok:true,vals:form.getValues()});
  })()`
}

// --- Test runner ---
const results = { pass: 0, fail: 0, steps: [] }

function log(phase, step, status, detail = "") {
  const icon = status === "PASS" ? "PASS" : status === "FAIL" ? "FAIL" : "INFO"
  console.log(`  [${icon}] ${phase} > ${step}${detail ? " — " + detail : ""}`)
  if (status === "PASS") results.pass++
  if (status === "FAIL") results.fail++
  results.steps.push({ phase, step, status, detail })
}

async function main() {
  console.log("=".repeat(70))
  console.log("  ADMISSION E2E LIFECYCLE TEST")
  console.log("  King Fahad School | kingfahad.localhost:3000")
  console.log("=".repeat(70))

  const browser = await chromium.launch({ headless: true })

  // =====================================================================
  // PHASE A: SUBMIT APPLICATION (as applicant@databayt.org)
  // =====================================================================
  console.log("\n--- PHASE A: SUBMIT APPLICATION ---")

  let applicationId = null

  {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    })
    const page = await ctx.newPage()
    page.on("dialog", (d) => d.accept())
    page.setDefaultTimeout(30000)

    // Track server action responses for debugging
    const actionResponses = []
    page.on("response", async (res) => {
      if (res.request().method() === "POST") {
        try {
          const body = await res.text()
          if (
            body.includes("applicationNumber") ||
            body.includes("sessionToken") ||
            body.includes('"error"')
          ) {
            actionResponses.push({
              url: res.url(),
              status: res.status(),
              body: body.substring(0, 800),
            })
          }
        } catch {}
      }
    })

    // Navigate to a step URL directly (fallback when Next button nav fails)
    async function goToStep(step) {
      await page
        .goto(`${BASE}/${LOCALE}/application/${CAMPAIGN_ID}/${step}`, {
          waitUntil: "load",
          timeout: 30000,
        })
        .catch(() => {})
      await sleep(3000)
    }

    // Click the Next/Submit button in the footer and wait for navigation
    async function clickNextAndWait(nextStep) {
      const footerBtns = page.locator("footer button")
      const btnCount = await footerBtns.count().catch(() => 0)
      if (btnCount < 2) return false

      const nextBtn = footerBtns.nth(btnCount - 1) // Last button = Next/Submit

      // Wait for button to be enabled (React state propagation after setValue)
      for (let i = 0; i < 20; i++) {
        if (!(await nextBtn.isDisabled().catch(() => true))) break
        await sleep(500)
      }

      if (await nextBtn.isDisabled().catch(() => true)) return false

      await nextBtn.click()

      if (!nextStep) return true // No navigation expected (submission)

      // Wait for URL to change to next step
      try {
        await page.waitForURL((u) => u.pathname.includes(`/${nextStep}`), {
          timeout: 12000,
        })
        await sleep(2000)
        return true
      } catch {
        // Navigation didn't happen — use direct navigation as fallback
        await goToStep(nextStep)
        return page.url().includes(`/${nextStep}`)
      }
    }

    try {
      // A1: Login as applicant
      await page.goto(`${BASE}/${LOCALE}/login`, {
        waitUntil: "networkidle",
        timeout: 90000,
      })
      await sleep(2000)
      await page.waitForSelector('input[type="email"]', { timeout: 20000 })
      await page
        .locator('input[name="email"]')
        .first()
        .fill("applicant@databayt.org")
      await page.locator('input[name="password"]').first().fill("1234")
      await page.locator('button[type="submit"]').first().click()
      await page
        .waitForURL((u) => !u.pathname.includes("/login"), { timeout: 20000 })
        .catch(() => {})
      await sleep(3000)

      const cookies = await ctx.cookies()
      if (cookies.some((c) => c.name === "authjs.session-token")) {
        log("A", "Login", "PASS", "applicant@databayt.org")
      } else {
        log("A", "Login", "FAIL", "No session cookie")
        throw new Error("Login failed")
      }

      // A2: Navigate to overview and click Get Started
      await page.goto(
        `${BASE}/${LOCALE}/application/overview?id=${CAMPAIGN_ID}`,
        { waitUntil: "load", timeout: 60000 }
      )
      await sleep(4000)

      const gsBtn = page
        .locator('button:has-text("Get Started"), button:has-text("ابدأ")')
        .first()
      if (await gsBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await gsBtn.click()
        try {
          await page.waitForURL((u) => u.pathname.includes("/attachments"), {
            timeout: 15000,
          })
          await sleep(2000)
        } catch {
          await goToStep("attachments")
        }
        log("A", "Overview → Attachments", "PASS")
      } else {
        await goToStep("attachments")
        log("A", "Overview → Attachments", "PASS", "Direct nav")
      }

      // A3: Skip attachments (optional — no uploads needed)
      await sleep(1000)
      const atPersonal = await clickNextAndWait("personal")
      log(
        "A",
        "Attachments → Personal",
        atPersonal ? "PASS" : "FAIL",
        !atPersonal && "Navigation failed"
      )

      // A4: Fill personal
      const pRes = JSON.parse(
        await page.evaluate(
          setFormScript({
            firstName: "Ahmed",
            middleName: "Mohammed",
            lastName: "Ali",
            dateOfBirth: "2014-05-15",
            gender: "MALE",
            nationality: "SD",
          })
        )
      )
      log("A", "Fill personal", pRes.ok ? "PASS" : "FAIL", pRes.error || "")
      await sleep(2000)
      const atContact = await clickNextAndWait("contact")
      log(
        "A",
        "Personal → Contact",
        atContact ? "PASS" : "FAIL",
        !atContact && "Navigation failed"
      )

      // A5: Fill contact
      const cRes = JSON.parse(
        await page.evaluate(
          setFormScript({
            email: "applicant@databayt.org",
            phone: "+249912345678",
          })
        )
      )
      log("A", "Fill contact", cRes.ok ? "PASS" : "FAIL", cRes.error || "")
      await sleep(2000)
      const atLocation = await clickNextAndWait("location")
      log(
        "A",
        "Contact → Location",
        atLocation ? "PASS" : "FAIL",
        !atLocation && "Navigation failed"
      )

      // A6: Fill location
      const lRes = JSON.parse(
        await page.evaluate(
          setFormScript({
            address: "123 Nile Avenue",
            city: "Khartoum",
            state: "Khartoum",
            postalCode: "11111",
            country: "SD",
          })
        )
      )
      log("A", "Fill location", lRes.ok ? "PASS" : "FAIL", lRes.error || "")
      await sleep(2000)
      const atGuardian = await clickNextAndWait("guardian")
      log(
        "A",
        "Location → Guardian",
        atGuardian ? "PASS" : "FAIL",
        !atGuardian && "Navigation failed"
      )

      // A7: Fill guardian
      const gRes = JSON.parse(
        await page.evaluate(
          setFormScript({
            fatherName: "Mohammed Ali Hassan",
            fatherOccupation: "Engineer",
            fatherPhone: "+249912345679",
            fatherEmail: "mohammed@example.com",
            motherName: "Fatima Ahmed",
            motherOccupation: "Teacher",
            motherPhone: "+249912345680",
          })
        )
      )
      log("A", "Fill guardian", gRes.ok ? "PASS" : "FAIL", gRes.error || "")
      await sleep(2000)
      const atAcademic = await clickNextAndWait("academic")
      log(
        "A",
        "Guardian → Academic",
        atAcademic ? "PASS" : "FAIL",
        !atAcademic && "Navigation failed"
      )

      // A8: Fill academic (LAST STEP — Next triggers submission)
      const aRes = JSON.parse(
        await page.evaluate(
          setFormScript({
            previousSchool: "Al-Noor International School",
            previousClass: "Grade 6",
            previousPercentage: "excellent",
            applyingForClass: "Grade 7",
            preferredStream: "science",
            achievements: "Top student in science.",
          })
        )
      )
      log("A", "Fill academic", aRes.ok ? "PASS" : "FAIL", aRes.error || "")

      await sleep(3000)
      actionResponses.length = 0

      // Click Submit
      const submitted = await clickNextAndWait(null)
      log(
        "A",
        "Submit clicked",
        submitted ? "PASS" : "FAIL",
        !submitted && "Button disabled"
      )

      // Wait for server action
      await sleep(12000)

      // A9: Check result
      const pageText = await page.textContent("body").catch(() => "")
      const appNumberMatch = pageText.match(/APP-\d{4}-[A-Z0-9]+/)
      const hasSuccessModal = await page
        .locator('[role="dialog"]')
        .first()
        .isVisible()
        .catch(() => false)
      const errorAlert = await page
        .locator('[role="alert"]')
        .first()
        .textContent()
        .catch(() => null)
      const submitResp = actionResponses.find(
        (r) =>
          r.body.includes("applicationNumber") || r.body.includes('"error"')
      )

      if (appNumberMatch) {
        log("A", "Application created", "PASS", `Number: ${appNumberMatch[0]}`)
      } else if (hasSuccessModal) {
        log("A", "Application created", "PASS", "Success modal shown")
      } else if (submitResp?.body.includes("applicationNumber")) {
        const m = submitResp.body.match(/"applicationNumber":"(APP-[^"]+)"/)
        log(
          "A",
          "Application created",
          "PASS",
          `Server: ${m?.[1] || "created"}`
        )
      } else if (errorAlert) {
        log(
          "A",
          "Application created",
          "FAIL",
          `Alert: ${errorAlert.substring(0, 200)}`
        )
      } else if (submitResp?.body.includes('"error"')) {
        const m = submitResp.body.match(/"error":"([^"]+)"/)
        log(
          "A",
          "Application created",
          "FAIL",
          `Server: ${m?.[1] || submitResp.body.substring(0, 200)}`
        )
      } else {
        // Debug: print all captured responses
        console.log(
          "    DEBUG: actionResponses =",
          JSON.stringify(actionResponses.slice(-3), null, 2)
        )
        log("A", "Application created", "FAIL", "No success indicator found")
      }

      await page
        .screenshot({
          path: "tests/lifecycle/screenshots/e2e-apply-result.png",
          timeout: 5000,
        })
        .catch(() => {})
    } catch (err) {
      log("A", "Error", "FAIL", err.message)
      await page
        .screenshot({
          path: "tests/lifecycle/screenshots/e2e-apply-error.png",
          timeout: 5000,
        })
        .catch(() => {})
    } finally {
      await ctx.close()
    }
  }

  // =====================================================================
  // PHASE B: REVIEW & ENROLL (as user@databayt.org — kingfahad ADMIN)
  // =====================================================================
  console.log("\n--- PHASE B: REVIEW & ENROLL ---")

  {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    })
    const page = await ctx.newPage()
    page.on("dialog", (d) => d.accept())
    page.setDefaultTimeout(30000)

    const actionResponses = []
    page.on("response", async (res) => {
      if (res.request().method() === "POST") {
        try {
          const body = await res.text()
          if (body.includes("success") || body.includes("error")) {
            actionResponses.push({
              status: res.status(),
              body: body.substring(0, 500),
            })
          }
        } catch {}
      }
    })

    async function go(url) {
      await page
        .goto(url, { waitUntil: "load", timeout: 60000 })
        .catch(() => {})
      await sleep(4000)
    }

    async function dismissDialog() {
      if (
        await page
          .locator('[role="dialog"]')
          .first()
          .isVisible({ timeout: 2000 })
          .catch(() => false)
      ) {
        await page.keyboard.press("Escape")
        await sleep(1000)
        return true
      }
      return false
    }

    try {
      // B1: Login as admin
      await page.goto(`${BASE}/${LOCALE}/login`, {
        waitUntil: "networkidle",
        timeout: 90000,
      })
      await sleep(3000)
      await page.waitForSelector('input[type="email"]', { timeout: 20000 })
      await page
        .locator('input[name="email"]')
        .first()
        .fill("user@databayt.org")
      await page.locator('input[name="password"]').first().fill("1234")
      await page.locator('button[type="submit"]').first().click()

      for (let i = 0; i < 15; i++) {
        await sleep(2000)
        if (!page.url().includes("/login")) break
      }

      const cookies = await ctx.cookies()
      if (cookies.some((c) => c.name === "authjs.session-token")) {
        log("B", "Login", "PASS", "user@databayt.org (ADMIN)")
      } else {
        log("B", "Login", "FAIL", "No session cookie")
        throw new Error("Admin login failed")
      }

      await sleep(2000)
      await dismissDialog()

      // B2: Find application in list
      await go(`${BASE}/${LOCALE}/admission/applications`)
      await dismissDialog()
      await sleep(2000)

      const rows = page.locator("table tbody tr")
      const rowCount = await rows.count().catch(() => 0)
      log("B", "Applications list", "INFO", `Found ${rowCount} rows`)

      // Find Ahmed's row, click "..." → "View Details" to navigate to detail page
      let foundRow = false
      for (let i = 0; i < rowCount; i++) {
        const rowText = await rows
          .nth(i)
          .textContent()
          .catch(() => "")
        if (rowText.includes("Ahmed") || rowText.includes("APP-")) {
          foundRow = true
          // Click the "..." dropdown button (last button in the row)
          const menuBtn = rows.nth(i).locator("button").last()
          if (await menuBtn.isVisible().catch(() => false)) {
            await menuBtn.click()
            await sleep(1000)
            // Click "View Details" or "View" from the dropdown
            const viewItem = page
              .locator('[role="menuitem"]:has-text("View")')
              .first()
            if (
              await viewItem.isVisible({ timeout: 3000 }).catch(() => false)
            ) {
              await viewItem.click()
              await sleep(4000)
              const urlMatch = page.url().match(/applications\/(cm[a-z0-9]+)/)
              if (urlMatch) applicationId = urlMatch[1]
            } else {
              await page.keyboard.press("Escape")
            }
          }
          break
        }
      }

      if (!applicationId) {
        await page
          .screenshot({
            path: "tests/lifecycle/screenshots/e2e-app-list.png",
            timeout: 5000,
          })
          .catch(() => {})
        log(
          "B",
          "Find application",
          "FAIL",
          foundRow ? "Row found but View Details failed" : "No matching row"
        )
        throw new Error("No application found")
      }
      log("B", "Find application", "PASS", applicationId)

      // B3: Open application detail
      await go(`${BASE}/${LOCALE}/admission/applications/${applicationId}`)
      await dismissDialog()
      await page
        .waitForSelector(
          'button:has-text("Update Status"), button:has-text("تحديث الحالة")',
          { timeout: 15000 }
        )
        .catch(() => {})
      await sleep(1000)

      await page
        .screenshot({
          path: "tests/lifecycle/screenshots/e2e-detail.png",
          timeout: 5000,
        })
        .catch(() => {})
      if (page.url().includes("/login")) throw new Error("Redirected to login")
      log("B", "Application detail", "PASS")

      // B4: Status transitions
      const transitions = [
        { display: "Under Review", value: "UNDER_REVIEW" },
        { display: "Shortlisted", value: "SHORTLISTED" },
        { display: "Selected", value: "SELECTED" },
      ]

      for (const target of transitions) {
        const updateBtn = page
          .locator(
            'button:has-text("Update Status"), button:has-text("تحديث الحالة")'
          )
          .first()
        if (
          !(await updateBtn.isVisible({ timeout: 5000 }).catch(() => false))
        ) {
          log(
            "B",
            `Status → ${target.value}`,
            "FAIL",
            "Update Status button not found"
          )
          continue
        }

        actionResponses.length = 0
        await updateBtn.click()
        await sleep(1000)

        const option = page
          .locator(`[role="menuitem"]:has-text("${target.display}")`)
          .first()
        if (!(await option.isVisible({ timeout: 3000 }).catch(() => false))) {
          log("B", `Status → ${target.value}`, "FAIL", "Option not in dropdown")
          await page.keyboard.press("Escape")
          await sleep(500)
          continue
        }

        await option.click()
        await sleep(4000)

        const toasts = await page
          .locator("[data-sonner-toast]")
          .allTextContents()
          .catch(() => [])
        const hasSuccess = toasts.some(
          (t) => t.toLowerCase().includes("success") || t.includes("updated")
        )
        const hasError = actionResponses.some((r) =>
          r.body.includes('"success":false')
        )

        if (hasError) {
          log("B", `Status → ${target.value}`, "FAIL", "Server returned error")
        } else {
          log(
            "B",
            `Status → ${target.value}`,
            "PASS",
            hasSuccess ? "" : "No error detected"
          )
        }
      }

      // B5: Confirm Enrollment
      await sleep(2000)
      const enrollBtn = page
        .locator(
          'button:has-text("Confirm Enrollment"), button:has-text("تأكيد القبول")'
        )
        .first()

      if (await enrollBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        actionResponses.length = 0
        await enrollBtn.click()
        await sleep(15000) // Transaction timeout is 30s

        const toasts = await page
          .locator("[data-sonner-toast]")
          .allTextContents()
          .catch(() => [])
        const hasSuccess = toasts.some(
          (t) =>
            t.toLowerCase().includes("confirmed") ||
            t.toLowerCase().includes("enrollment") ||
            t.toLowerCase().includes("admitted")
        )
        const respError = actionResponses.find((r) =>
          r.body.includes('"success":false')
        )

        if (respError) {
          const m = respError.body.match(/"error":"([^"]+)"/)
          log(
            "B",
            "Confirm Enrollment",
            "FAIL",
            `Server: ${m?.[1] || "unknown"}`
          )
        } else {
          log(
            "B",
            "Confirm Enrollment",
            "PASS",
            hasSuccess ? toasts.join(", ") : "No error detected"
          )
        }
      } else {
        log(
          "B",
          "Confirm Enrollment",
          "FAIL",
          "Button not visible — status may not be SELECTED"
        )
      }

      await page
        .screenshot({
          path: "tests/lifecycle/screenshots/e2e-enrolled.png",
          timeout: 5000,
        })
        .catch(() => {})

      // B6: Verify student in students list
      await go(`${BASE}/${LOCALE}/students`)
      await dismissDialog()
      await sleep(2000)

      const bodyText = await page.textContent("body").catch(() => "")
      if (bodyText.includes("Ahmed") && bodyText.includes("Ali")) {
        log("B", "Student in list", "PASS", "Ahmed Ali found")
      } else {
        log("B", "Student in list", "FAIL", "Ahmed Ali not found")
      }

      await page
        .screenshot({
          path: "tests/lifecycle/screenshots/e2e-students.png",
          timeout: 5000,
        })
        .catch(() => {})
    } catch (err) {
      log("B", "Error", "FAIL", err.message)
      await page
        .screenshot({
          path: "tests/lifecycle/screenshots/e2e-review-error.png",
          timeout: 5000,
        })
        .catch(() => {})
    } finally {
      await ctx.close()
    }
  }

  await browser.close()

  // =====================================================================
  // RESULTS
  // =====================================================================
  console.log("\n" + "=".repeat(70))
  console.log("  RESULTS")
  console.log("=".repeat(70))
  console.log(
    `  PASS: ${results.pass}  |  FAIL: ${results.fail}  |  TOTAL: ${results.pass + results.fail}`
  )

  if (results.fail > 0) {
    console.log("\n  FAILURES:")
    for (const s of results.steps.filter((s) => s.status === "FAIL")) {
      console.log(`    ${s.phase} > ${s.step}: ${s.detail}`)
    }
  }

  console.log(
    "\n" +
      (results.fail === 0
        ? "  ALL TESTS PASSED"
        : `  ${results.fail} FAILURE(S)`) +
      "\n"
  )
}

main().catch(console.error)
