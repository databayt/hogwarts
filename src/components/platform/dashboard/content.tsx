import { currentUser } from "@/components/auth/auth";
import { StudentDashboard } from "./dashboards/student-dashboard";
import { TeacherDashboard } from "./dashboards/teacher-dashboard";
import { ParentDashboard } from "./dashboards/parent-dashboard";
import { StaffDashboard } from "./dashboards/staff-dashboard";
import { AdminDashboard } from "./dashboards/admin-dashboard";
import { PrincipalDashboard } from "./dashboards/principal-dashboard";
import { AccountantDashboard } from "./dashboards/accountant-dashboard";
import { TenantLoginRedirect } from "@/components/auth/tenant-login-redirect";
import { CookieDebug } from "@/components/auth/cookie-debug";
import type { School } from "@/components/site/types";
import type { Dictionary } from "@/components/internationalization/dictionaries";

// Extended user type that includes the properties added by our auth callbacks
type ExtendedUser = {
  id: string;
  email?: string | null;
  role?: string;
  schoolId?: string | null;
};

interface Props {
  school?: School; // Make school prop optional
  dictionary?: Dictionary['school']; // Add dictionary prop
  locale?: string; // Add locale prop
}

export default async function DashboardContent({ school, dictionary, locale = "en" }: Props = {}) {
  const user = await currentUser() as ExtendedUser | null;

  // If no user, show login component
  if (!user) {
    return (
      <TenantLoginRedirect 
        subdomain={school?.domain || 'unknown'} 
        className="max-w-md mx-auto mt-20"
      />
    );
  }

  // For now, use a default school name if not provided
  const schoolName = school?.name || dictionary?.dashboard?.yourSchool || "Your School";

  // Provide default translations if dictionary is not provided
  const dashboardDict = dictionary?.dashboard || {
    title: "Dashboard",
    welcome: "Welcome to Hogwarts"
  };

  const renderDashboard = () => {
    const userRole = user.role || 'USER';
    switch (userRole) {
      case "STUDENT":
        return <StudentDashboard user={user} dictionary={dictionary!} locale={locale} />;
      case "TEACHER":
        return <TeacherDashboard user={user} dictionary={dictionary!} locale={locale} />;
      case "GUARDIAN":
        return <ParentDashboard user={user} dictionary={dictionary!} locale={locale} />;
      case "STAFF":
        return <StaffDashboard user={user} dictionary={dictionary!} locale={locale} />;
      case "ADMIN":
        return <AdminDashboard user={user} dictionary={dictionary!} locale={locale} />;
      case "PRINCIPAL":
        return <PrincipalDashboard user={user} dictionary={dictionary!} locale={locale} />;
      case "ACCOUNTANT":
        return <AccountantDashboard user={user} dictionary={dictionary!} locale={locale} />;
      default:
        return <DefaultDashboard user={user} dictionary={dictionary!} />;
    }
  };

  return (
    <div className="space-y-6">
      {renderDashboard()}
    </div>
  );
}

function DefaultDashboard({ user, dictionary }: { user: ExtendedUser, dictionary?: Dictionary['school'] }) {
  return (
    <div className="grid gap-6">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h3 className="mb-4">{dictionary?.dashboard?.dashboardComingSoon || 'Dashboard Coming Soon'}</h3>
        <p className="text-muted-foreground">
          {dictionary?.dashboard?.workingOnDashboard || `We're working on a personalized dashboard for your role.`} ({user.role || dictionary?.dashboard?.unknown || 'Unknown'})
        </p>
        <CookieDebug />
      </div>
    </div>
  );
}
