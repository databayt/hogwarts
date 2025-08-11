import { NextResponse } from "next/server";
import { startImpersonation } from "@/app/(platform)/operator/actions/impersonation/start";

export async function POST(
  request: Request,
  { params }: { params: { schoolId: string } }
) {
  try {
    const form = await request.formData().catch(() => null);
    const reason = form?.get("reason")?.toString();
    await startImpersonation(params.schoolId, reason);
    return NextResponse.redirect(new URL("/dashboard", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}


