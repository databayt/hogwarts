// app/api/admin/route.ts

import { NextResponse } from "next/server";
import { currentRole } from "@/lib/auth";

export async function GET() {
  try {
    const role = await currentRole();

    if (role === "ADMIN") {
      return NextResponse.json({ message: "Access granted" }, { status: 200 });
    }

    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  } catch (error) {
    console.error("Error in /api/admin:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
