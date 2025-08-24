import { NextResponse } from "next/server";
import { startImpersonation } from "@/app/(platform)/operator/actions/impersonation/start";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const resolvedParams = await params;
    const form = await request.formData().catch(() => null);
    const reason = form?.get("reason")?.toString();
    await startImpersonation(resolvedParams.schoolId, reason);
    return NextResponse.redirect(new URL("/dashboard", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}


