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
import { Card, CardContent } from "@/components/ui/card";
import type { School } from "@/components/site/types";
import type { Dictionary } from "@/components/internationalization/dictionaries";

// Extended user type that includes the properties added by our auth callbacks
type ExtendedUser = {
  id: string;
  email?: string | null;
  role?: string;
  schoolId?: string | null;
  name?: string;
};

interface Props {
  school?: School; // Make school prop optional
  dictionary?: Dictionary['school']; // Add dictionary prop
  locale?: string; // Add locale prop
}

export default async function DashboardContent({ school, dictionary, locale = "en" }: Props = {}) {
  try {
    // Get current user with error handling
    let user: ExtendedUser | null = null;
    try {
      user = await currentUser() as ExtendedUser | null;
    } catch (error) {
      console.error("[DashboardContent] Error getting current user:", error);
      // Return login redirect on auth error
      return (
        <TenantLoginRedirect
          subdomain={school?.domain || 'unknown'}
          className="max-w-md mx-auto mt-20"
        />
      );
    }

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
      const userRole = user?.role || 'USER';
      // Ensure we have a valid dictionary, use empty object as fallback
      const safeDict = dictionary || {} as Dictionary['school'];

      switch (userRole) {
        case "STUDENT":
          return <StudentDashboard user={user!} dictionary={safeDict} locale={locale} />;
        case "TEACHER":
          return <TeacherDashboard user={user!} dictionary={safeDict} locale={locale} />;
        case "GUARDIAN":
          return <ParentDashboard user={user!} dictionary={safeDict} locale={locale} />;
        case "STAFF":
          return <StaffDashboard user={user!} dictionary={safeDict} locale={locale} />;
        case "ADMIN":
        case "DEVELOPER":
          // DEVELOPER (platform admin) sees AdminDashboard when viewing school subdomains
          return <AdminDashboard user={user!} dictionary={safeDict} locale={locale} />;
        case "PRINCIPAL":
          return <PrincipalDashboard user={user!} dictionary={safeDict} locale={locale} />;
        case "ACCOUNTANT":
          return <AccountantDashboard user={user!} dictionary={safeDict} locale={locale} />;
        default:
          return <DefaultDashboard user={user!} dictionary={safeDict} />;
      }
    };

    return (
      <div className="space-y-6">
        {renderDashboard()}
      </div>
    );
  } catch (error) {
    // Catch-all error handler for any unexpected errors
    console.error("[DashboardContent] Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4">Dashboard Error</h3>
            <p className="text-muted-foreground mb-2">
              An error occurred while loading the dashboard.
            </p>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
              {errorMessage}
            </pre>
            <CookieDebug />
          </CardContent>
        </Card>
      </div>
    );
  }
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
