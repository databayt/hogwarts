import { redirect } from "next/navigation";

import { currentUser } from "@/components/auth/auth";
import { constructMetadata } from "@/components/marketing/pricing/lib/utils";
import { DashboardHeader } from "@/components/platform/dashboard/header";
import { EmptyPlaceholder } from "@/components/marketing/pricing/shared/empty-placeholder";

export const metadata = constructMetadata({
  title: "Admin – SaaS Starter",
  description: "Admin page for only admin management.",
});

export default async function AdminPage() {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  return (
    <>
      <DashboardHeader
        heading="Admin Panel"
        text="Access only for users with ADMIN role."
      />
      <EmptyPlaceholder>
        <EmptyPlaceholder.Icon name="warning" />
        <EmptyPlaceholder.Title>Admin area</EmptyPlaceholder.Title>
        <EmptyPlaceholder.Description>
          Owner/Admin tools will appear here. Use sidebar to navigate.
        </EmptyPlaceholder.Description>
      </EmptyPlaceholder>
    </>
  );
}
