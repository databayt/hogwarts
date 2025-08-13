import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getTenantContext } from "@/components/platform/operator/lib/tenant"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) return new Response(JSON.stringify({ periods: [] }), { status: 200 })
  const { searchParams } = new URL(req.url)
  const termId = searchParams.get("termId")
  if (!termId) return new Response(JSON.stringify({ error: "Missing termId" }), { status: 400 })
  const term = await (db as any).term.findFirst({ where: { id: termId, schoolId }, select: { yearId: true } })
  if (!term) return new Response(JSON.stringify({ periods: [] }), { status: 200 })
  const rows = await (db as any).period.findMany({
    where: { schoolId, yearId: term.yearId },
    orderBy: { startTime: 'asc' },
    select: { id: true, name: true },
  })
  return new Response(JSON.stringify({ periods: rows }), { status: 200, headers: { "content-type": "application/json" } })
}


