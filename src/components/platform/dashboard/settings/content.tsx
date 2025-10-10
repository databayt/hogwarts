import { redirect } from "next/navigation";

import { currentUser } from "@/components/auth/auth";
import { DeleteAccountSection } from "@/components/platform/dashboard/delete-account";
import { DashboardHeader } from "@/components/platform/dashboard/header";
import { UserNameForm } from "@/components/platform/dashboard/settings/user-name-form";
import { UserRoleForm } from "@/components/marketing/pricing/forms/user-role-form";
import { Separator } from "@/components/ui/separator";
import { UserRole } from "@prisma/client";
import { type Locale } from "@/components/internationalization/config";
import { type getDictionary } from "@/components/internationalization/dictionaries";

// Extended user type that includes the properties added by our auth callbacks
type ExtendedUser = {
  id: string;
  email?: string | null;
  role?: string;
  schoolId?: string | null;
  name?: string | null;
};

interface SettingsContentProps {
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  lang: Locale;
}

export default async function SettingsContent({ dictionary, lang }: SettingsContentProps) {
  const user = await currentUser() as ExtendedUser | null;

  if (!user?.id) redirect("/login");

  return (
    <>
      <DashboardHeader
        heading="Settings"
        text="Manage account and website settings."
      />
      <div className="divide-y divide-muted py-4 pb-10">
        <div className="flex flex-col bg-muted rounded-lg px-6">
        <UserNameForm user={{ id: user.id, name: user.name || "" }} />
        <Separator />
          <UserRoleForm user={{ id: user.id, role: user.role as UserRole }} />
        </div>
        <DeleteAccountSection />
      </div>
    </>
  );
}
