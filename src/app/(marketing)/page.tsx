import MarketingContent from "@/components/marketing/content";
import SiteContent from "@/components/site/content";
import { headers } from "next/headers";

export const metadata = {
  title: "Marketing",
}

export default async function Marketing() {
  const headersList = await headers();
  const subdomain = headersList.get("x-subdomain");
  
  // If we're on a school subdomain (not ed.databayt.org), show SiteContent
  if (subdomain && subdomain !== "ed") {
    return <SiteContent />;
  }
  
  // Otherwise, show MarketingContent (for ed.databayt.org and other cases)
  return <MarketingContent />;
}
