import { getTermsForSelection } from "@/components/platform/timetable/actions"
import { db } from "@/lib/db"

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


