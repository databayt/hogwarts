import { NextResponse } from "next/server";
import { toggleTenantActive } from "@/components/operator/actions/tenants/toggle-active";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const resolvedParams = await params;
    const form = await request.formData().catch(() => null);
    const reason = form?.get("reason")?.toString();
    await toggleTenantActive(resolvedParams.tenantId, reason);
    return NextResponse.redirect(new URL("/operator/tenants", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}


