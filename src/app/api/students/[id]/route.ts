import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantContext } from "@/components/operator/lib/tenant";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { schoolId } = await getTenantContext();
    if (!schoolId || !(db as any).student) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const s = await (db as any).student.findFirst({
      where: { id: (await params).id, schoolId },
      select: { givenName: true, middleName: true, surname: true },
    });
    if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const name = [s.givenName, s.middleName, s.surname].filter(Boolean).join(" ");
    return NextResponse.json({ name });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


