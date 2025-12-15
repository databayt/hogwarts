/**
 * Academic Terms Selection API
 *
 * Returns list of academic terms for dropdown selection.
 *
 * USE CASES:
 * - Timetable: Select term to view/edit
 * - Reports: Filter by academic term
 * - Attendance: Choose term for records
 *
 * PUBLIC ACCESS:
 * - Primary: Uses session for authenticated users
 * - Fallback: Accepts domain param for public pages
 *
 * WHY DOMAIN FALLBACK:
 * - Public school timetable pages have no session
 * - domain param identifies school without auth
 * - Returns empty array if school not found (graceful)
 *
 * RESPONSE FORMAT:
 * { terms: [{ id, label: "Term 1" }, ...] }
 *
 * WHY force-dynamic:
 * - Terms created during academic year setup
 * - Must return current data
 *
 * ERROR HANDLING:
 * - Returns empty terms array instead of errors
 * - WHY: Dropdowns should render (empty) not crash
 *
 * @see /components/platform/timetable/actions.ts
 */

import { getTermsForSelection } from "@/components/platform/timetable/actions"
import { db } from "@/lib/db"

// WHY: Terms list changes during setup
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const data = await getTermsForSelection()
    return new Response(JSON.stringify(data), { status: 200, headers: { "content-type": "application/json" } })
  } catch {
    // Public fallback: allow fetching by domain when tenant context is missing
    try {
      const url = new URL(request.url)
      const domain = url.searchParams.get('domain') || url.searchParams.get('school') || undefined
      if (!domain) {
        return new Response(JSON.stringify({ terms: [] }), { status: 200 })
      }

      // Use proper Prisma client without unsafe type casting
      const school = await db.school.findFirst({ 
        where: { domain }, 
        select: { id: true } 
      })

      if (!school) {
        return new Response(JSON.stringify({ terms: [] }), { status: 200 })
      }

      const terms = await db.term.findMany({ 
        where: { schoolId: school.id }, 
        orderBy: { startDate: 'desc' }, 
        select: { id: true, termNumber: true } 
      })

      return new Response(
        JSON.stringify({ 
          terms: terms.map(term => ({ id: term.id, label: `Term ${term.termNumber}` })) 
        }), 
        { status: 200, headers: { "content-type": "application/json" } }
      )
    } catch (error) {
      console.error("Error in terms fallback:", error)
      return new Response(JSON.stringify({ terms: [] }), { status: 200, headers: { "content-type": "application/json" } })
    }
  }
}


