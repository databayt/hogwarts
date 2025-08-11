import { redirect } from "next/navigation";

import { getCurrentUser } from "@/components/marketing/pricing/lib/session";
import { constructMetadata } from "@/components/marketing/pricing/lib/utils";
import { DeleteAccountSection } from "@/components/marketing/pricing/dashboard/delete-account";
import { DashboardHeader } from "@/components/marketing/pricing/dashboard/header";
import { UserNameForm } from "@/components/marketing/pricing/forms/user-name-form";
import { UserRoleForm } from "@/components/marketing/pricing/forms/user-role-form";

export const metadata = constructMetadata({
  title: "Settings – SaaS Starter",
  description: "Configure your account and website settings.",
});

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user?.id) redirect("/login");

  return (
    <>
      <DashboardHeader
        heading="Settings"
        text="Manage account and website settings."
      />
      <div className="divide-y divide-muted pb-10">
        <UserNameForm user={{ id: user.id, name: user.name || "" }} />
        <UserRoleForm user={{ id: user.id, role: user.role }} />
        <DeleteAccountSection />
      </div>
    </>
  );
}
