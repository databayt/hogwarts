import { db } from "@/lib/db"
import { getTenantContext } from "@/components/platform/operator/lib/tenant"

export const dynamic = "force-dynamic"

export async function GET() {
  const { schoolId } = await getTenantContext()
  if (!schoolId) return new Response(JSON.stringify({ classrooms: [] }), { status: 200 })
  const rows = await (db as any).classroom.findMany({ where: { schoolId }, select: { id: true, roomName: true } })
  return new Response(JSON.stringify({ classrooms: rows }), { status: 200, headers: { "content-type": "application/json" } })
}


