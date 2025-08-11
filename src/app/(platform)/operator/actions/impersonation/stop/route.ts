import { NextResponse } from "next/server";
import { stopImpersonation } from "@/app/(platform)/operator/actions/impersonation/stop";

export async function POST() {
  try {
    await stopImpersonation();
    return NextResponse.redirect(new URL("/operator/tenants", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}


