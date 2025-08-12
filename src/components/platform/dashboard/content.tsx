import { currentUser } from "@/components/auth/auth";
import { constructMetadata } from "@/components/marketing/pricing/lib/utils";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/platform/dashboard/header";
import { EmptyPlaceholder } from "@/components/marketing/pricing/shared/empty-placeholder";

export const metadata = constructMetadata({
  title: "Dashboard – SaaS Starter",
  description: "Create and manage content.",
});

export default async function DashboardContent() {
  const user = await currentUser();

  return (
    <>
      <DashboardHeader
        heading="Dashboard"
        text={`Current Role : ${user?.role} — Change your role in settings.`}
      />
      <EmptyPlaceholder>
        <EmptyPlaceholder.Icon name="post" />
        <EmptyPlaceholder.Title>No content created</EmptyPlaceholder.Title>
        <EmptyPlaceholder.Description>
          You don&apos;t have any content yet. Start creating content.
        </EmptyPlaceholder.Description>
        <Button>Add Content</Button>
      </EmptyPlaceholder>
    </>
  );
}
