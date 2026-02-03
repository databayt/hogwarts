import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { getTemporaryAccessToken } from "@/components/school-dashboard/finance/receipt/schematic/get-temporary-access-token"
import SchematicEmbed from "@/components/school-dashboard/finance/receipt/schematic/schematic-embed"

export default async function ManagePlanPage() {
  // 1. Authenticate
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  // 2. Get Schematic access token
  const accessToken = await getTemporaryAccessToken()

  if (!accessToken) {
    return (
      <div className="py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold">
          Unable to load subscription portal
        </h1>
        <p className="text-muted-foreground">
          Please try again later or contact support.
        </p>
      </div>
    )
  }

  // 3. Get component ID from environment
  const componentId =
    process.env.NEXT_PUBLIC_SCHEMATIC_CUSTOMER_PORTAL_COMPONENT_ID

  if (!componentId) {
    console.error("NEXT_PUBLIC_SCHEMATIC_CUSTOMER_PORTAL_COMPONENT_ID not set")
    return (
      <div className="py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold">Configuration Error</h1>
        <p className="text-muted-foreground">
          Subscription portal is not configured.
        </p>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Manage Subscription</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your subscription plan
        </p>
      </div>

      <div className="bg-card rounded-lg border">
        <SchematicEmbed accessToken={accessToken} componentId={componentId} />
      </div>
    </div>
  )
}
