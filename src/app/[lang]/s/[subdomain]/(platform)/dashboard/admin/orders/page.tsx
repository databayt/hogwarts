import { redirect } from "next/navigation";

import { currentUser } from "@/components/auth/auth";
import { constructMetadata } from "@/components/marketing/pricing/lib/utils";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/platform/dashboard/header";
import { EmptyPlaceholder } from "@/components/marketing/pricing/shared/empty-placeholder";

export const metadata = constructMetadata({
  title: "Orders – SaaS Starter",
  description: "Check and manage your latest orders.",
});

export default async function Orders() {
  // const user = await currentUser();
  // if (!user || user.role !== "ADMIN") redirect("/login");

  return (
    <>
      <DashboardHeader
        heading="Orders"
        text="Check and manage your latest orders."
      />
      <EmptyPlaceholder>
        <EmptyPlaceholder.Icon name="package" />
        <EmptyPlaceholder.Title>No orders listed</EmptyPlaceholder.Title>
        <EmptyPlaceholder.Description>
          You don&apos;t have any orders yet. Start ordering a product.
        </EmptyPlaceholder.Description>
        <Button>Buy Products</Button>
      </EmptyPlaceholder>
    </>
  );
}
