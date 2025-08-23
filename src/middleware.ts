import { NextResponse, NextRequest } from "next/server";
import { authRoutes } from "@/routes";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get("host") || "";

  // Ignore static files and Next internals
  if (
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/api") ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|ico|svg|css|js|woff2?)$/)
  ) {
    return NextResponse.next();
  }

  // Allow auth routes to be handled normally (don't rewrite for subdomains)
  if (authRoutes.includes(url.pathname)) {
    return NextResponse.next();
  }

  // Case 1: ed.databayt.org = marketing
  if (host === "ed.databayt.org") {
    // Let (marketing) routes resolve normally
    return NextResponse.next();
  }

  // Case 2: other subdomains = tenants
  if (host.endsWith(".databayt.org")) {
    const subdomain = host.split(".")[0];
    url.pathname = `/s/${subdomain}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Case 3: Vercel preview URLs (tenant---branch.vercel.app)
  if (host.includes("---") && host.endsWith(".vercel.app")) {
    const subdomain = host.split("---")[0];
    url.pathname = `/s/${subdomain}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Case 4: localhost development
  if (host.includes("localhost") && host.includes(".")) {
    const parts = host.split(".");
    if (parts.length > 1 && parts[0] !== "www") {
      const subdomain = parts[0];
      url.pathname = `/s/${subdomain}${url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|.*\\..*).*)"],
};