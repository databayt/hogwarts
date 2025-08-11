import { NextResponse } from "next/server";
import { toggleTenantActive } from "@/app/(platform)/operator/actions/tenants/toggle-active";

export async function POST(
  request: Request,
  { params }: { params: { tenantId: string } }
) {
  try {
    const form = await request.formData().catch(() => null);
    const reason = form?.get("reason")?.toString();
    await toggleTenantActive(params.tenantId, reason);
    return NextResponse.redirect(new URL("/operator/tenants", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}


